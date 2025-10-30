import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min } from 'class-validator';

export class CreateWalletDto {
  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  balance: number;
}
