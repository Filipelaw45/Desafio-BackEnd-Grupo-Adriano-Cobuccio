import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { BaseEntityDto } from '../../../common/entities/base-entity.dto';

@Exclude()
export class LedgerEntryDto extends BaseEntityDto {
  @Expose()
  @ApiProperty({ type: String })
  transactionId: string;

  @Expose()
  @ApiProperty({ type: String })
  userId: string;

  @Expose()
  @ApiProperty({ type: Number })
  amount: number;

  @Expose()
  @ApiProperty({ type: Number })
  balance: number;

  @Expose()
  @ApiProperty({ type: String, required: false })
  description?: string;
}
