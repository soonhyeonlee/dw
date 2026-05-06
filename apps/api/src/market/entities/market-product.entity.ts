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

export enum MarketBlockType {
  BANNER = 'banner',       // 배너 블록 (1개 상품 대형)
  TWO_COL = 'two_col',    // 2단 구성 블록
  THREE_SLIDE = 'three_slide', // 3단 슬라이드 블록
}

@Entity('market_products')
export class MarketProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  category: string; // 식품, 생활용품, 건강식품, 뷰티, 패션, 육아

  @Column({ nullable: true })
  origin: string; // 원산지

  @Column({ nullable: true })
  producer: string; // 생산자명

  @Column({ nullable: true })
  deliveryInfo: string; // 배송 정보

  @Column({ type: 'boolean', default: false })
  freeDelivery: boolean;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number; // 재고 수량

  @Column({ type: 'int', default: 0 })
  soldCount: number; // 판매 수량

  @Column({ type: 'int', nullable: true })
  limitQuantity: number; // 한정 수량 (null이면 무제한)

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // 기획전/블록 배치 설정
  @Column({ nullable: true })
  @Index()
  exhibitionId: string; // 소속 기획전

  @Column({ type: 'varchar', nullable: true })
  blockType: MarketBlockType; // 어떤 블록에 노출할지

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  // 한정 특가 타이머
  @Column({ type: 'timestamp', nullable: true })
  saleStartAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  saleEndAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
