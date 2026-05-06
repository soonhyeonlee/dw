import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BlockType {
  MALL_GRID = 'mall_grid',           // 쇼핑몰 경유 아이콘 리스트
  TOPIC_PRODUCTS = 'topic_products', // 주제별 상품 블록
  MALL_PRODUCTS = 'mall_products',   // 쇼핑몰별 상품 블록
  BANNER = 'banner',                 // 배너 블록
}

@Entity('home_blocks')
export class HomeBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  blockType: BlockType;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number; // 정렬 순서

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // 온/오프

  // 블록별 설정 (JSON)
  @Column({ type: 'simple-json', default: '{}' })
  config: {
    // mall_grid: 표시할 쇼핑몰 목록, 아이콘 개수
    malls?: { platform: string; name: string; iconUrl?: string; cashbackRate: number }[];
    maxItems?: number;
    // topic_products: 카테고리 필터
    category?: string;
    // mall_products: 특정 쇼핑몰
    platform?: string;
    // banner: 배너 정보
    bannerImageUrl?: string;
    bannerColor?: string;
    linkUrl?: string;
    linkType?: 'internal' | 'external';
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
