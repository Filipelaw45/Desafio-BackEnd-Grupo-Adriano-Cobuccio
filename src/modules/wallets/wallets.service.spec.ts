import { ConflictException } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { Repository } from 'typeorm';
import { Wallet } from './entities/wallet.entity';

describe('WalletsService - create', () => {
  let service: WalletsService;
  let mockRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new WalletsService(mockRepo as unknown as Repository<Wallet>);
  });

  it('should create a wallet when none exists', async () => {
    const userId = 'user-1';
    const createWalletDto = { balance: 100 };

    const createdEntity = { balance: 100, user: { id: userId } };
    const savedEntity = { id: 'wallet-1', balance: 100, user: { id: userId } };

    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.create.mockReturnValue(createdEntity);
    mockRepo.save.mockResolvedValue(savedEntity);

    const result = await service.create(userId, createWalletDto);

    expect(mockRepo.findOne).toHaveBeenCalledTimes(1);
    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { user: { id: userId } },
    });

    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    expect(mockRepo.create).toHaveBeenCalledWith({
      balance: createWalletDto.balance,
      user: { id: userId },
    });

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(createdEntity);

    expect(result).toEqual(savedEntity);
  });

  it('should throw ConflictException when user already has a wallet', async () => {
    const userId = 'user-2';
    const createWalletDto = { balance: 50 };

    const existingWallet = { id: 'wallet-existing', balance: 20, user: { id: userId } };
    mockRepo.findOne.mockResolvedValue(existingWallet);

    await expect(service.create(userId, createWalletDto)).rejects.toThrow(ConflictException);

    expect(mockRepo.findOne).toHaveBeenCalledWith({
      where: { user: { id: userId } },
    });
    expect(mockRepo.create).not.toHaveBeenCalled();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});