import { User } from '../../users/entities/user.entity';
import { BaseEntity } from '../../../common/entities/base-entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity('wallets')
export class Wallet extends BaseEntity {
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
