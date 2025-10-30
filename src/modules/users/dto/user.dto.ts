import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { BaseEntityDto } from '../../../common/entities/base-entity.dto';
import { WalletDto } from '../../wallets/dto/wallet.dto';

@Exclude()
export class UserDto extends BaseEntityDto {
  @Expose()
  @ApiProperty({ type: String })
  email: string;

  @Expose()
  @ApiProperty({ type: String })
  name: string;

  @Expose()
  @ApiProperty({ type: () => WalletDto, required: false })
  @Type(() => WalletDto)
  wallet?: WalletDto;
}
