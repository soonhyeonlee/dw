import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MarketProduct } from './market-product.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

@Entity('market_orders')
export class MarketOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  productId: string;

  @ManyToOne(() => MarketProduct)
  @JoinColumn({ name: 'productId' })
  product: MarketProduct;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;

  // 이 주문에 사용한 번개장터 포인트(현금 차감액) / 이 주문으로 적립된 포인트.
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  usedPoint: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  pointEarned: number;

  @Column({ type: 'varchar', default: OrderStatus.PENDING })
  status: OrderStatus;

  // 배송 정보
  @Column({ nullable: true })
  recipientName: string;

  @Column({ nullable: true })
  recipientPhone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  addressDetail: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  deliveryMemo: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
