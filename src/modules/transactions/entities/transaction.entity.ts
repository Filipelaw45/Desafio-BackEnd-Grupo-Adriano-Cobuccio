import { BaseEntity } from '../../../common/entities/base-entity';
import { Column, Entity, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LedgerEntry } from './ledger-entry.entity';

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REVERSED = 'REVERSED',
  FAILED = 'FAILED',
}

export enum TransactionType {
  TRANSFER = 'TRANSFER',
}

@Entity('transactions')
@Index(['fromUserId', 'createdAt'])
@Index(['toUserId', 'createdAt'])
@Index(['status'])
export class Transaction extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.TRANSFER,
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({ name: 'from_user_id', type: 'uuid' })
  fromUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @Column({ name: 'to_user_id', type: 'uuid' })
  toUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  metadata?: string;

  @Column({ name: 'reversed_transaction_id', type: 'uuid', nullable: true })
  reversedTransactionId?: string;

  @ManyToOne(() => Transaction, { nullable: true })
  @JoinColumn({ name: 'reversed_transaction_id' })
  reversedTransaction?: Transaction;

  @OneToMany(() => LedgerEntry, (entry) => entry.transaction, { cascade: true })
  ledgerEntries: LedgerEntry[];
}