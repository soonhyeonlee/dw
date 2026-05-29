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

@Entity('academies')
export class Academy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  category: string; // 태권도, 영어, 수학, 피아노, 미술, 코딩 등

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  addressDetail: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  @Index()
  region: string; // 서울 강남구, 서울 서초구 등

  // 위치 (Google Places 기반 자동 수집/수동 입력 둘 다 가능)
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  // Google Places place_id (자동 수집 데이터 중복 방지용 유니크 키)
  @Column({ nullable: true, unique: true })
  @Index()
  googlePlaceId: string | null;

  // 데이터 출처: 'manual' (어드민/파트너 직접 입력) | 'google_maps' (크롤러)
  @Column({ default: 'manual' })
  @Index()
  source: 'manual' | 'google_maps';

  @Column({ type: 'simple-json', nullable: true })
  photos: string[]; // 사진 URL 배열

  @Column({ type: 'simple-json', nullable: true })
  tags: string[]; // 체험수업, 셔틀운행, 소수정예 등

  @Column({ nullable: true, type: 'text' })
  curriculum: string; // 수업 내용

  @Column({ nullable: true, type: 'text' })
  notice: string; // 안내 및 유의사항

  @Column({ nullable: true, type: 'text' })
  parking: string; // 주차 안내

  @Column({ type: 'simple-json', nullable: true })
  sns: { kakao?: string; instagram?: string; facebook?: string; band?: string }; // 카톡/SNS 링크

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number; // 일반 조회수

  @Column({ type: 'int', default: 0 })
  momViewCount: number; // 맘카페 조회수

  @Column({ type: 'int', default: 0 })
  heartCount: number; // 좋아요

  // 파트너(학원 관장) 연결
  @Column({ nullable: true })
  partnerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'partnerId' })
  partner: User;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
