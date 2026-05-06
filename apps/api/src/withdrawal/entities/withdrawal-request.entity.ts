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

@Entity('withdrawal_requests')
export class WithdrawalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  bankName: string;

  @Column()
  accountNumber: string;

  @Column()
  accountHolder: string;

  @Column({ default: 'requested' })
  @Index()
  status: string; // requested | processing | completed | rejected

  @Column({ nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @ManyToOne(() => User, (user) => user.withdrawalRequests)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
