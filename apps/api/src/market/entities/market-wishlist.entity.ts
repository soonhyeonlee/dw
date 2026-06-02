import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MarketProduct } from './market-product.entity';

// 번개장터(직접판매) 상품 찜. 제휴 products 찜(wishlists)과 별개 — market_products 참조.
@Entity('market_wishlists')
@Index(['userId', 'productId'], { unique: true })
export class MarketWishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  productId: string;

  @ManyToOne(() => MarketProduct, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: MarketProduct;

  @CreateDateColumn()
  createdAt: Date;
}
