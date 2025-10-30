import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Min, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'ID do usuário destinatário',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  toUserId: string;

  @ApiProperty({
    description: 'Valor da transferência',
    example: 100.50,
    minimum: 0.01,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Pagamento de serviço',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}