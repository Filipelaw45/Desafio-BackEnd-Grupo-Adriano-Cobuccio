import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { BaseEntityDto } from '../../../common/entities/base-entity.dto';

@Exclude()
export class TransactionDto extends BaseEntityDto {
  @Expose()
  @ApiProperty({ type: String })
  fromUserId: string;

  @Expose()
  @ApiProperty({ type: String })
  toUserId: string;

  @Expose()
  @ApiProperty({ type: Number })
  @Type(() => Number)
  amount: number;

  @Expose()
  @ApiProperty({ type: String })
  type: string;

  @Expose()
  @ApiProperty({ type: String })
  status: string;

  @Expose()
  @ApiProperty({ type: String, required: false })
  description?: string;
}
