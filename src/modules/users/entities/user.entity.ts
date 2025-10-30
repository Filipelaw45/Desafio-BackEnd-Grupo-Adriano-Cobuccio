import { BaseEntity } from '../../../common/entities/base-entity';
import { Wallet } from '../../wallets/entities/wallet.entity';
import { hashPassword } from '../../../common/utils/hash-password';
import { BeforeInsert, BeforeUpdate, Column, DeleteDateColumn, Entity, Index, OneToOne } from 'typeorm';

@Entity('users')
@Index(['email'])
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToOne(() => Wallet, (wallet) => wallet.user, { cascade: true })
  wallet: Wallet;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken?: string;

  @DeleteDateColumn()
  deletedAt?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  protected async hashPasswordBeforeSave() {
    if (this.password) {
      this.password = await hashPassword(this.password);
    }
  }
}
