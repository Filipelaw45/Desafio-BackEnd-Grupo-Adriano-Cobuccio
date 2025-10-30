import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { Repository, DataSource, ObjectLiteral, EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

type MockRepository<T extends ObjectLiteral = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepo: MockRepository<Transaction>;
  let dataSource: Partial<DataSource>;
  let mockEntityManager: any;

  beforeEach(async () => {
    mockEntityManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    transactionRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async <T>(runInTransaction: (entityManager: EntityManager) => Promise<T>) => {
        return runInTransaction(mockEntityManager as EntityManager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: transactionRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);

    jest.spyOn(service as any, 'runTransactionWithRetries').mockImplementation(async (callback: any) => {
      return callback(mockEntityManager);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('transfer', () => {
    it('should transfer successfully between two users', async () => {
      const fromUserId = 'user-1';
      const dto: CreateTransactionDto = {
        toUserId: 'user-2',
        amount: 100,
        description: 'Test transfer',
      };

      const fromWallet = {
        id: 'wallet-1',
        userId: fromUserId,
        balance: 500,
        user: { id: fromUserId },
      } as Wallet;

      const toWallet = {
        id: 'wallet-2',
        userId: dto.toUserId,
        balance: 200,
        user: { id: dto.toUserId },
      } as Wallet;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([fromWallet, toWallet]),
      };

      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockEntityManager.save.mockImplementation((data: any) => {
        if (Array.isArray(data)) return Promise.resolve(data);
        return Promise.resolve({ ...data, id: 'txn-1' });
      });

      const result = await service.transfer(fromUserId, dto);

      expect(result).toBeDefined();
      expect(mockEntityManager.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when transferring to self', async () => {
      const userId = 'user-1';
      const dto: CreateTransactionDto = {
        toUserId: userId,
        amount: 100,
      };

      await expect(service.transfer(userId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.transfer(userId, dto)).rejects.toThrow('Não é possível transferir para si mesmo');
    });

    it('should throw BadRequestException when amount is zero or negative', async () => {
      const fromUserId = 'user-1';
      const dto: CreateTransactionDto = {
        toUserId: 'user-2',
        amount: 0,
      };

      await expect(service.transfer(fromUserId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.transfer(fromUserId, dto)).rejects.toThrow('O valor deve ser maior que zero');
    });

    it('should throw BadRequestException when insufficient balance', async () => {
      const fromUserId = 'user-1';
      const dto: CreateTransactionDto = {
        toUserId: 'user-2',
        amount: 1000,
      };

      const fromWallet = {
        id: 'wallet-1',
        userId: fromUserId,
        balance: 100,
        user: { id: fromUserId },
      } as Wallet;

      const toWallet = {
        id: 'wallet-2',
        userId: dto.toUserId,
        balance: 200,
        user: { id: dto.toUserId },
      } as Wallet;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([fromWallet, toWallet]),
      };

      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.transfer(fromUserId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.transfer(fromUserId, dto)).rejects.toThrow('Saldo insuficiente');
    });

    it('should throw NotFoundException when source wallet not found', async () => {
      const fromUserId = 'user-1';
      const dto: CreateTransactionDto = {
        toUserId: 'user-2',
        amount: 100,
      };

      const toWallet = {
        id: 'wallet-2',
        userId: dto.toUserId,
        balance: 200,
        user: { id: dto.toUserId },
      } as Wallet;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([toWallet]),
      };

      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.transfer(fromUserId, dto)).rejects.toThrow(NotFoundException);
      await expect(service.transfer(fromUserId, dto)).rejects.toThrow('Carteira de origem não encontrada');
    });

    it('should throw NotFoundException when destination wallet not found', async () => {
      const fromUserId = 'user-1';
      const dto: CreateTransactionDto = {
        toUserId: 'user-2',
        amount: 100,
      };

      const fromWallet = {
        id: 'wallet-1',
        userId: fromUserId,
        balance: 500,
        user: { id: fromUserId },
      } as Wallet;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([fromWallet]),
      };

      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.transfer(fromUserId, dto)).rejects.toThrow(NotFoundException);
      await expect(service.transfer(fromUserId, dto)).rejects.toThrow('Carteira de destino não encontrada');
    });
  });

  describe('reverse', () => {
    it('should reverse a completed transaction', async () => {
      const transactionId = 'txn-1';
      const userId = 'user-1';
      const reverseDto: ReverseTransactionDto = {
        reason: 'Customer request',
      };

      const originalTransaction = {
        id: transactionId,
        fromUserId: userId,
        toUserId: 'user-2',
        amount: 100,
        status: TransactionStatus.COMPLETED,
        reversedTransactionId: null,
        ledgerEntries: [],
      };

      const fromWallet = {
        id: 'wallet-1',
        userId: userId,
        balance: 400,
        user: { id: userId },
      } as Wallet;

      const toWallet = {
        id: 'wallet-2',
        userId: 'user-2',
        balance: 300,
        user: { id: 'user-2' },
      } as Wallet;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([fromWallet, toWallet]),
      };

      mockEntityManager.findOne.mockResolvedValue(originalTransaction);
      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockEntityManager.save.mockImplementation((data: any) => {
        if (Array.isArray(data)) return Promise.resolve(data);
        return Promise.resolve({ ...data, id: 'txn-reverse-1' });
      });

      const result = await service.reverse(transactionId, userId, reverseDto);

      expect(result).toBeDefined();
      expect(mockEntityManager.findOne).toHaveBeenCalled();
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const transactionId = 'non-existent';
      const userId = 'user-1';
      const reverseDto: ReverseTransactionDto = {
        reason: 'Test',
      };

      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.reverse(transactionId, userId, reverseDto)).rejects.toThrow(NotFoundException);
      await expect(service.reverse(transactionId, userId, reverseDto)).rejects.toThrow('Transação não encontrada');
    });

    it('should throw BadRequestException when transaction is not completed', async () => {
      const transactionId = 'txn-1';
      const userId = 'user-1';
      const reverseDto: ReverseTransactionDto = {
        reason: 'Test',
      };

      const transaction = {
        id: transactionId,
        fromUserId: userId,
        status: TransactionStatus.PENDING,
      } as Transaction;

      mockEntityManager.findOne.mockResolvedValue(transaction);

      await expect(service.reverse(transactionId, userId, reverseDto)).rejects.toThrow(BadRequestException);
      await expect(service.reverse(transactionId, userId, reverseDto)).rejects.toThrow('Apenas transações completas podem ser estornadas');
    });

    it('should throw ConflictException when transaction already reversed', async () => {
      const transactionId = 'txn-1';
      const userId = 'user-1';
      const reverseDto: ReverseTransactionDto = {
        reason: 'Test',
      };

      const transaction = {
        id: transactionId,
        fromUserId: userId,
        status: TransactionStatus.COMPLETED,
        reversedTransactionId: 'txn-reverse-1',
      } as Transaction;

      mockEntityManager.findOne.mockResolvedValue(transaction);

      await expect(service.reverse(transactionId, userId, reverseDto)).rejects.toThrow(ConflictException);
      await expect(service.reverse(transactionId, userId, reverseDto)).rejects.toThrow('Esta transação já foi estornada');
    });

    it('should throw BadRequestException when user has no permission', async () => {
      const transactionId = 'txn-1';
      const userId = 'user-3';
      const reverseDto: ReverseTransactionDto = {
        reason: 'Test',
      };

      const transaction = {
        id: transactionId,
        fromUserId: 'user-1',
        toUserId: 'user-2',
        status: TransactionStatus.COMPLETED,
        reversedTransactionId: null,
      };

      mockEntityManager.findOne.mockResolvedValue(transaction);

      await expect(service.reverse(transactionId, userId, reverseDto)).rejects.toThrow(BadRequestException);
      await expect(service.reverse(transactionId, userId, reverseDto)).rejects.toThrow(
        'Você não tem permissão para estornar esta transação',
      );
    });

    it('should throw BadRequestException when recipient has insufficient balance', async () => {
      const transactionId = 'txn-1';
      const userId = 'user-1';
      const reverseDto: ReverseTransactionDto = {
        reason: 'Test',
      };

      const originalTransaction = {
        id: transactionId,
        fromUserId: userId,
        toUserId: 'user-2',
        amount: 1000,
        status: TransactionStatus.COMPLETED,
        reversedTransactionId: null,
        ledgerEntries: [],
      };

      const fromWallet = {
        id: 'wallet-1',
        userId: userId,
        balance: 100,
        user: { id: userId },
      } as Wallet;

      const toWallet = {
        id: 'wallet-2',
        userId: 'user-2',
        balance: 50,
        user: { id: 'user-2' },
      } as Wallet;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([fromWallet, toWallet]),
      };

      mockEntityManager.findOne.mockResolvedValue(originalTransaction);
      mockEntityManager.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.reverse(transactionId, userId, reverseDto)).rejects.toThrow(BadRequestException);
      await expect(service.reverse(transactionId, userId, reverseDto)).rejects.toThrow(
        'Destinatário não possui saldo suficiente para estorno',
      );
    });
  });

  describe('findUserTransactions', () => {
    it('should return paginated user transactions', async () => {
      const userId = 'user-1';
      const queryDto: QueryTransactionDto = {
        page: 1,
        limit: 10,
      };

      const transactions = [
        {
          id: 'txn-1',
          fromUserId: userId,
          toUserId: 'user-2',
          amount: 100,
          status: TransactionStatus.COMPLETED,
          createdAt: new Date(),
        },
        {
          id: 'txn-2',
          fromUserId: 'user-3',
          toUserId: userId,
          amount: 50,
          status: TransactionStatus.COMPLETED,
          createdAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([transactions, 2]),
      };

      transactionRepo.createQueryBuilder?.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findUserTransactions(userId, queryDto);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.data[0].direction).toBe('DEBIT');
      expect(result.data[1].direction).toBe('CREDIT');
    });

    it('should filter by status', async () => {
      const userId = 'user-1';
      const queryDto: QueryTransactionDto = {
        status: TransactionStatus.COMPLETED,
        page: 1,
        limit: 10,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      transactionRepo.createQueryBuilder?.mockReturnValue(mockQueryBuilder as any);

      await service.findUserTransactions(userId, queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('transaction.status = :status', {
        status: TransactionStatus.COMPLETED,
      });
    });

    it('should filter by date range', async () => {
      const userId = 'user-1';
      const queryDto: QueryTransactionDto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        limit: 10,
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      transactionRepo.createQueryBuilder?.mockReturnValue(mockQueryBuilder as any);

      await service.findUserTransactions(userId, queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });
  });

  describe('findOne', () => {
    it('should return transaction details', async () => {
      const transactionId = 'txn-1';
      const userId = 'user-1';

      const transaction = {
        id: transactionId,
        fromUserId: userId,
        toUserId: 'user-2',
        amount: 100,
        ledgerEntries: [],
      };

      transactionRepo.findOne?.mockResolvedValue(transaction);

      const result = await service.findOne(transactionId, userId);

      expect(result).toBeDefined();
      expect(transactionRepo.findOne).toHaveBeenCalledWith({
        where: { id: transactionId },
        relations: ['ledgerEntries'],
      });
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const transactionId = 'non-existent';
      const userId = 'user-1';

      transactionRepo.findOne?.mockResolvedValue(null);

      await expect(service.findOne(transactionId, userId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(transactionId, userId)).rejects.toThrow('Transação não encontrada');
    });

    it('should throw BadRequestException when user has no permission', async () => {
      const transactionId = 'txn-1';
      const userId = 'user-3';

      const transaction = {
        id: transactionId,
        fromUserId: 'user-1',
        toUserId: 'user-2',
        amount: 100,
      } as Transaction;

      transactionRepo.findOne?.mockResolvedValue(transaction);

      await expect(service.findOne(transactionId, userId)).rejects.toThrow(BadRequestException);
      await expect(service.findOne(transactionId, userId)).rejects.toThrow('Você não tem permissão para ver esta transação');
    });
  });
});
