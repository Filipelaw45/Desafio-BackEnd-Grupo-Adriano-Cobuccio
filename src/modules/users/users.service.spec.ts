import { NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User as UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepo: any;
  let walletsServiceMock: any;

  beforeEach(() => {
    mockRepo = {
      findOne: jest.fn(),
      softDelete: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    walletsServiceMock = {
      create: jest.fn(),
    };

    service = new UsersService(mockRepo as unknown as Repository<UserEntity>, walletsServiceMock);
  });

  describe('create', () => {
    it('should create a new user with wallet', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(createUserDto);
      mockRepo.save.mockResolvedValue({ id: 'user-1', ...createUserDto });
      walletsServiceMock.create.mockResolvedValue({});

      const result = await service.create(createUserDto);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email: createUserDto.email } });
      expect(mockRepo.save).toHaveBeenCalled();
      expect(walletsServiceMock.create).toHaveBeenCalledWith('user-1', { balance: 1000 });
      expect(result).toEqual({ id: 'user-1', ...createUserDto });
    });

    it('should throw ConflictException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockRepo.findOne.mockResolvedValue({ id: 'existing-user', email: createUserDto.email });

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(mockRepo.save).not.toHaveBeenCalled();
      expect(walletsServiceMock.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const queryDto: QueryUserDto = { page: 1, limit: 10 };
      const users = [{ id: 'user-1', name: 'Test User', email: 'test@example.com' }];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([users, 1]),
      };

      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(queryDto);

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by name and email', async () => {
      const queryDto: QueryUserDto = { name: 'Test', email: 'test@example.com', page: 1, limit: 10 };

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = 'user-1';
      const updateUserDto: UpdateUserDto = { name: 'Updated Name' };
      const existingUser = { id: userId, email: 'test@example.com', name: 'Old Name' };
      const updatedUser = { ...existingUser, ...updateUserDto };

      mockRepo.findOne.mockResolvedValueOnce(existingUser).mockResolvedValueOnce(updatedUser);
      mockRepo.update.mockResolvedValue({});

      await service.update(userId, updateUserDto);

      expect(mockRepo.update).toHaveBeenCalledWith(userId, updateUserDto);
      expect(mockRepo.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'non-existent';
      const updateUserDto: UpdateUserDto = { name: 'Updated Name' };

      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email is already in use', async () => {
      const userId = 'user-1';
      const updateUserDto: UpdateUserDto = { email: 'existing@example.com' };
      const existingUser = { id: userId, email: 'test@example.com' };
      const userWithEmail = { id: 'user-2', email: 'existing@example.com' };

      mockRepo.findOne.mockResolvedValueOnce(existingUser).mockResolvedValueOnce(userWithEmail);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(ConflictException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete when user exists', async () => {
      const userId = 'user-1';
      const user = { id: userId };

      mockRepo.findOne.mockResolvedValue(user);
      mockRepo.softDelete.mockResolvedValue({});

      await service.delete(userId);

      expect(mockRepo.findOne).toHaveBeenCalledTimes(1);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockRepo.softDelete).toHaveBeenCalledTimes(1);
      expect(mockRepo.softDelete).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'user-2';

      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.delete(userId)).rejects.toThrow(NotFoundException);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockRepo.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const email = 'test@example.com';
      const user = { id: 'user-1', email };

      mockRepo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const email = 'nonexistent@example.com';

      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findByEmail(email)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const userId = 'user-1';
      const user = { id: userId, email: 'test@example.com', wallet: {} };

      mockRepo.findOne.mockResolvedValue(user);

      await service.findById(userId);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: userId }, relations: ['wallet'] });
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'non-existent';

      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findById(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('saveRefreshToken', () => {
    it('should save refresh token', async () => {
      const userId = 'user-1';
      const refreshToken = 'token123';

      mockRepo.update.mockResolvedValue({});

      await service.saveRefreshToken(userId, refreshToken);

      expect(mockRepo.update).toHaveBeenCalledWith({ id: userId }, { refreshToken });
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token when user exists', async () => {
      const userId = 'user-1';
      const refreshToken = 'token123';
      const user = { refreshToken };

      mockRepo.findOne.mockResolvedValue(user);

      const result = await service.getRefreshToken(userId);

      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: userId }, select: ['refreshToken'] });
      expect(result).toBe(refreshToken);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'non-existent';

      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.getRefreshToken(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
