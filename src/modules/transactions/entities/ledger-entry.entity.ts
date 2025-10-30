import { BaseEntity } from '../../../common/entities/base-entity';
import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Transaction } from './transaction.entity';
import { User } from '../../users/entities/user.entity';

export enum LedgerEntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

@Entity('ledger_entries')
@Index(['userId', 'createdAt'])
@Index(['transactionId'])
export class LedgerEntry extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'transaction_id', type: 'uuid' })
  transactionId: string;

  @ManyToOne(() => Transaction, (transaction) => transaction.ledgerEntries)
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: LedgerEntryType,
  })
  type: LedgerEntryType;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'balance_after' })
  balanceAfter: number;

  @Column({ type: 'text', nullable: true })
  description?: string;
}