import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TransactionStatus, TransactionType } from '../entities/transaction.entity';
import { BaseQueryDto } from '../../../common/dto/base-query.dto';

export class QueryTransactionDto extends BaseQueryDto {
  @ApiProperty({ enum: TransactionStatus, required: false })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiProperty({ enum: TransactionType, required: false })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}