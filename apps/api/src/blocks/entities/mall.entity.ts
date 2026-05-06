import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('malls')
export class Mall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  platform: string; // coupang, naver, 11st, gmarket, ssg, ...

  @Column()
  name: string; // 표시 이름

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ nullable: true })
  color: string; // 브랜드 컬러 (#E4002B)

  @Column()
  baseUrl: string; // 쇼핑몰 기본 URL

  @Column({ nullable: true })
  affiliateBaseUrl: string; // 제휴 링크 베이스 URL

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  cashbackRate: number; // 기본 캐시백 비율

  @Column({ nullable: true })
  appScheme: string; // 앱 딥링크 스킴 (coupang://)

  @Column({ nullable: true })
  appPackage: string; // 안드로이드 패키지명

  @Column({ nullable: true })
  appStoreId: string; // iOS 앱스토어 ID

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'text' })
  description: string; // 캐시백 안내 등

  @Column({ nullable: true })
  cashbackNote: string; // "구매 후 30일 적립" 등

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  previousCashbackRate: number; // 상향 전 이전 캐시백 비율 (취소선 표시용)

  @Column({ type: 'timestamp', nullable: true })
  promoEndsAt: Date; // 프로모션 종료 시각 (카운트다운 표시용)

  @Column({ nullable: true })
  promoBadge: string; // 'time_deal' | 'rate_up' | 'welcome' 등 (UI 배지)

  @Column({ nullable: true })
  @Index()
  category: string; // 종합쇼핑 | 패션 | 뷰티 | 식품·생필품 | 가전·디지털 | 여행·예약 | 도서 | 홈·인테리어 | 유아동

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
