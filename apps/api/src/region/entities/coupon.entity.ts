import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  couponType: string; // 이용권, 할인권, 무료체험

  @Column({ nullable: true })
  value: string; // "무료", "20%", "50,000원" 등

  @Column({ type: 'int', default: 0 })
  totalQuantity: number; // 총 발행 수량

  @Column({ type: 'int', default: 0 })
  remainingQuantity: number; // 잔여 수량

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  serialNumber: string; // 고유 일련번호

  // 발행 파트너
  @Column()
  partnerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'partnerId' })
  partner: User;

  @Column({ nullable: true })
  partnerName: string; // 파트너 상호명 (조회 편의)

  @Column({ nullable: true })
  category: string; // 학원, 체육 등

  @Column({ type: 'timestamp' })
  startAt: Date;

  @Column({ type: 'timestamp' })
  expireAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
