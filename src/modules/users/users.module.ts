import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { WalletsService } from '../wallets/wallets.service';
import { Wallet } from '../wallets/entities/wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Wallet])],
  controllers: [UsersController],
  providers: [UsersService, WalletsService],
  exports: [UsersService],
})
export class UsersModule {}
