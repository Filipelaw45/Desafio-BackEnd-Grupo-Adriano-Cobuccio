import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { WalletDto } from './dto/wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
  ) {}

  async create(userId: string, createWalletDto: CreateWalletDto): Promise<WalletDto> {
    const existingWallet = await this.walletRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingWallet) {
      throw new ConflictException(`Usuário já possui uma carteira`);
    }

    const wallet = this.walletRepository.create({
      balance: createWalletDto.balance,
      user: { id: userId },
    });

    const walletCreated = await this.walletRepository.save(wallet);
    return walletCreated;
  }
}
