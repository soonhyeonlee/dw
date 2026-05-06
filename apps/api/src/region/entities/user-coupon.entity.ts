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
import { Coupon } from './coupon.entity';

@Entity('user_coupons')
@Index(['userId', 'couponId'], { unique: true })
export class UserCoupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  couponId: string;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  @CreateDateColumn()
  downloadedAt: Date;
}
