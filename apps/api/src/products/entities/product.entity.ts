import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('products')
@Index(['platform', 'externalId'], { unique: true })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  platform: string; // coupang | naver | 11st

  @Column()
  externalId: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountRate: number;

  @Column()
  imageUrl: string;

  @Column()
  productUrl: string;

  @Column({ nullable: true })
  affiliateUrl: string;

  @Column()
  @Index()
  category: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  brand: string | null; // 제조사/브랜드 (영카트 it_maker). 카테고리 그룹핑에 사용.

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  cashbackRate: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cashbackAmount: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating: number;

  @Column({ nullable: true })
  reviewCount: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
