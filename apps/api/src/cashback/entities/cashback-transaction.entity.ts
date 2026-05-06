import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('cashback_transactions')
export class CashbackTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ nullable: true })
  productId: string;

  @Column()
  platform: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  orderAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  commissionAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  cashbackAmount: number;

  @Column({ default: 'pending' })
  @Index()
  status: string; // pending | confirmed | paid | cancelled

  @Column({ nullable: true })
  confirmedAt: Date;

  @Column({ nullable: true })
  paidAt: Date;

  @ManyToOne(() => User, (user) => user.cashbackTransactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
