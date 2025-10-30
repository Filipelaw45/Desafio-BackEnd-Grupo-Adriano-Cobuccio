import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from './entities/transaction.entity';
import { LedgerEntry, LedgerEntryType } from './entities/ledger-entry.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { plainToInstance } from 'class-transformer';
import { TransactionDto } from './dto/transaction.dto';
import { TransactionWithLedgerEntryDto } from './dto/transaction-whith-leadger-entry.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  async transfer(fromUserId: string, dto: CreateTransactionDto): Promise<TransactionDto> {
    if (fromUserId === dto.toUserId) throw new BadRequestException('Não é possível transferir para si mesmo');
    if (dto.amount <= 0) throw new BadRequestException('O valor deve ser maior que zero');

    return this.runTransactionWithRetries(async (manager) => {
      const { fromWallet, toWallet } = await this.loadAndLockWallets(manager, fromUserId, dto.toUserId);

      if (Number(fromWallet.balance) < dto.amount) throw new BadRequestException('Saldo insuficiente');

      const transaction = this.buildTransaction(fromUserId, dto.toUserId, dto.amount, dto.description);
      const savedTransaction = await manager.save(Transaction, transaction);

      try {
        this.applyBalanceDelta(fromWallet, -dto.amount);
        this.applyBalanceDelta(toWallet, dto.amount);

        await manager.save(Wallet, [fromWallet, toWallet]);

        const entries = this.buildTransferLedgerEntries(
          savedTransaction.id,
          fromUserId,
          dto.toUserId,
          dto.amount,
          fromWallet.balance,
          toWallet.balance,
        );
        await manager.save(LedgerEntry, entries);

        savedTransaction.status = TransactionStatus.COMPLETED;
        await manager.save(Transaction, savedTransaction);

        return plainToInstance(TransactionDto, savedTransaction);
      } catch (error) {
        savedTransaction.status = TransactionStatus.FAILED;
        await manager.save(Transaction, savedTransaction);
        throw error;
      }
    });
  }

  async reverse(transactionId: string, userId: string, reverseDto: ReverseTransactionDto): Promise<TransactionDto> {
    return this.runTransactionWithRetries(async (manager) => {
      const original = await manager.findOne(Transaction, {
        where: { id: transactionId },
        relations: ['ledgerEntries'],
      });

      if (!original) throw new NotFoundException('Transação não encontrada');
      if (original.status !== TransactionStatus.COMPLETED)
        throw new BadRequestException('Apenas transações completas podem ser estornadas');
      if (original.reversedTransactionId) throw new ConflictException('Esta transação já foi estornada');
      if (original.fromUserId !== userId && original.toUserId !== userId)
        throw new BadRequestException('Você não tem permissão para estornar esta transação');

      const { fromWallet, toWallet } = await this.loadAndLockWallets(manager, original.fromUserId, original.toUserId);

      if (Number(toWallet.balance) < Number(original.amount))
        throw new BadRequestException('Destinatário não possui saldo suficiente para estorno');

      const reverseTransaction = this.buildTransaction(
        original.toUserId,
        original.fromUserId,
        original.amount,
        `Estorno: ${reverseDto.reason}`,
      );
      reverseTransaction.metadata = JSON.stringify({
        originalTransactionId: transactionId,
        reason: reverseDto.reason,
        additionalInfo: reverseDto.additionalInfo,
      });

      const savedReverse = await manager.save(Transaction, reverseTransaction);

      this.applyBalanceDelta(toWallet, -Number(original.amount));
      this.applyBalanceDelta(fromWallet, Number(original.amount));

      await manager.save(Wallet, [fromWallet, toWallet]);

      const entries = this.buildTransferLedgerEntries(
        savedReverse.id,
        original.toUserId,
        original.fromUserId,
        original.amount,
        toWallet.balance,
        fromWallet.balance,
        'Estorno de transferência',
        'Estorno de transferência',
      );
      await manager.save(LedgerEntry, entries);

      savedReverse.status = TransactionStatus.COMPLETED;
      original.status = TransactionStatus.REVERSED;
      original.reversedTransactionId = savedReverse.id;

      await manager.save(Transaction, [savedReverse, original]);

      return plainToInstance(TransactionDto, savedReverse);
    });
  }

  async findUserTransactions(
    userId: string,
    queryDto: QueryTransactionDto,
  ): Promise<{
    data: TransactionWithLedgerEntryDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { status, type, startDate, endDate, page = 1, limit = 10 } = queryDto;

    const qb = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.fromUserId = :userId OR transaction.toUserId = :userId', { userId });

    if (status) qb.andWhere('transaction.status = :status', { status });
    if (type) qb.andWhere('transaction.type = :type', { type });
    if (startDate) qb.andWhere('transaction.createdAt >= :startDate', { startDate });
    if (endDate) qb.andWhere('transaction.createdAt <= :endDate', { endDate });

    const [transactions, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('transaction.createdAt', 'DESC')
      .getManyAndCount();

    const dtos = plainToInstance(TransactionWithLedgerEntryDto, transactions);

    dtos.forEach((dto, idx) => {
      const trx = transactions[idx];
      if (!trx) return;
      dto.direction = trx.toUserId === userId ? 'CREDIT' : 'DEBIT';
    });

    return {
      data: dtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string): Promise<TransactionDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['ledgerEntries'],
    });

    if (!transaction) throw new NotFoundException('Transação não encontrada');
    if (transaction.fromUserId !== userId && transaction.toUserId !== userId)
      throw new BadRequestException('Você não tem permissão para ver esta transação');

    const dto = plainToInstance(TransactionWithLedgerEntryDto, transaction);
    dto.direction = transaction.toUserId === userId ? 'CREDIT' : 'DEBIT';

    return dto;
  }

  private async runTransactionWithRetries<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    const maxAttempts = 3;
    const baseDelay = 100;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.dataSource.transaction(async (manager) => {
          return work(manager);
        });
      } catch (error: any) {
        if (attempt === maxAttempts) throw error;
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }
    throw new Error('transaction-retries-exhausted');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async loadAndLockWallets(
    manager: EntityManager,
    fromUserId: string,
    toUserId: string,
  ): Promise<{ fromWallet: Wallet; toWallet: Wallet }> {
    const userIds = [fromUserId, toUserId].sort();
    const wallets = await manager
      .createQueryBuilder(Wallet, 'wallet')
      .where('wallet.user_id IN (:...userIds)', { userIds })
      .orderBy('wallet.user_id', 'ASC')
      .setLock('pessimistic_write')
      .getMany();

    if (!wallets || wallets.length < 2) {
      const missing = userIds.filter((id) => !wallets.some((w) => w.user.id === id));
      if (missing.includes(fromUserId)) throw new NotFoundException('Carteira de origem não encontrada');
      throw new NotFoundException('Carteira de destino não encontrada');
    }

    const fromWallet = wallets.find((w) => w.userId === fromUserId)!;
    const toWallet = wallets.find((w) => w.userId === toUserId)!;

    return { fromWallet, toWallet };
  }

  private buildTransaction(fromUserId: string, toUserId: string, amount: number, description?: string): Transaction {
    const t = new Transaction();
    t.fromUserId = fromUserId;
    t.toUserId = toUserId;
    t.amount = amount;
    t.type = TransactionType.TRANSFER;
    t.status = TransactionStatus.PENDING;
    t.description = description;
    return t;
  }

  private applyBalanceDelta(wallet: Wallet, delta: number): void {
    const next = Number(wallet.balance) + delta;
    wallet.balance = Number(next.toFixed(2));
  }

  private buildTransferLedgerEntries(
    transactionId: string,
    fromUserId: string,
    toUserId: string,
    amount: number,
    fromBalanceAfter: number,
    toBalanceAfter: number,
    fromDescription?: string,
    toDescription?: string,
  ): LedgerEntry[] {
    const debit = new LedgerEntry();
    debit.userId = fromUserId;
    debit.transactionId = transactionId;
    debit.amount = amount;
    debit.type = LedgerEntryType.DEBIT;
    debit.balanceAfter = fromBalanceAfter;
    debit.description = fromDescription ?? `Transferência para ${toUserId}`;

    const credit = new LedgerEntry();
    credit.userId = toUserId;
    credit.transactionId = transactionId;
    credit.amount = amount;
    credit.type = LedgerEntryType.CREDIT;
    credit.balanceAfter = toBalanceAfter;
    credit.description = toDescription ?? `Transferência de ${fromUserId}`;

    return [debit, credit];
  }
}
