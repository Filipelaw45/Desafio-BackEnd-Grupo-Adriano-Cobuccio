import { ApiProperty } from '@nestjs/swagger';
import { BaseEntityDto } from '../../../common/entities/base-entity.dto';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class WalletDto extends BaseEntityDto {
  @ApiProperty({ type: String })
  @Expose()
  userId: string;

  @ApiProperty({ type: Number })
  @Expose()
  @Type(() => Number)
  balance: number;
}
