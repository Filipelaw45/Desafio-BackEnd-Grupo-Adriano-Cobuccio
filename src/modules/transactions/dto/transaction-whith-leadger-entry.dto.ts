import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { LedgerEntryDto } from './ledger-entry.dto';
import { TransactionDto } from './transaction.dto';

@Exclude()
export class TransactionWithLedgerEntryDto extends TransactionDto {
  @Expose()
  @ApiProperty({ type: () => [LedgerEntryDto], required: false })
  @Type(() => LedgerEntryDto)
  ledgerEntries?: LedgerEntryDto[];

  @Expose()
  @ApiProperty({
    type: String,
    enum: ['CREDIT', 'DEBIT'],
    required: false,
    description: 'Direção da transação para o usuário (CREDIT = recebido, DEBIT = enviado)',
  })
  direction?: 'CREDIT' | 'DEBIT';
}
