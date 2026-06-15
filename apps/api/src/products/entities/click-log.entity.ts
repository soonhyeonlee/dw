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
import { Product } from './product.entity';

@Entity('click_logs')
export class ClickLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  productId: string;

  @Column()
  platform: string;

  @Column()
  affiliateUrl: string;

  // 제휴사 전환 리포트의 subId 와 매칭되는 클릭 추적 토큰(유저별 식별).
  @Column({ nullable: true })
  @Index()
  trackingId: string;

  @Column({ default: false })
  purchaseConfirmed: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @CreateDateColumn()
  clickedAt: Date;
}
