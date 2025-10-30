import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ReverseTransactionDto {
  @ApiProperty({
    description: 'Motivo do estorno',
    example: 'Solicitação do cliente',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Informações adicionais sobre o estorno',
    example: 'Transação estornada devido a erro no processamento',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalInfo?: string;
}