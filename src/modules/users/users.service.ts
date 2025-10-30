import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UserDto } from './dto/user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User as UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateUserDto } from './dto/update-user.dto';
import { WalletsService } from '../wallets/wallets.service';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly walletsService: WalletsService,
  ) {}

  async create(userData: CreateUserDto): Promise<UserDto> {
    const existingEmail = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (existingEmail) {
      throw new ConflictException('O email já está em uso');
    }

    const savedUser = await this.userRepository.save(this.userRepository.create(userData));
    await this.walletsService.create(savedUser.id, { balance: 1000 });

    return savedUser as UserDto;
  }

  async findAll(queryDto: QueryUserDto): Promise<UserResponseDto> {
    const { name, email, page = 1, limit = 100 } = queryDto;

    const queryBuilder = this.userRepository.createQueryBuilder('user');

    const filters = {
      name: { field: 'user.name', value: name },
      email: { field: 'user.email', value: email },
    };

    Object.entries(filters).forEach(([key, { field, value }]) => {
      if (value) {
        queryBuilder.andWhere(`${field} ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    });

    const [users, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data: plainToInstance(UserDto, users, {
        excludeExtraneousValues: true,
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(userId: string, userData: UpdateUserDto): Promise<UserDto> {
    const existingUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (userData.email && userData.email !== existingUser.email) {
      const emailInUse = await this.userRepository.findOne({ where: { email: userData.email } });
      if (emailInUse && emailInUse.id !== userId) {
        throw new ConflictException('O email já está em uso');
      }
    }

    await this.userRepository.update(userId, userData);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['wallet'],
    });

    if (!updatedUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return plainToInstance(UserDto, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  async delete(requesterId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: requesterId } });

    if (!user) {
      throw new NotFoundException(`Cliente com ID ${requesterId} não encontrado`);
    }

    await this.userRepository.softDelete(requesterId);
    return;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    return user;
  }

  async findById(id: string): Promise<UserDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['wallet'],
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return plainToInstance(UserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.userRepository.update({ id: userId }, { refreshToken });
  }

  async getRefreshToken(userId: string): Promise<string | undefined> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['refreshToken'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user.refreshToken;
  }
}
