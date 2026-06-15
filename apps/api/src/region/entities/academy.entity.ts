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
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @Index()
  googlePlaceId: string | null;

  // 데이터 출처: 'manual' (어드민/파트너 직접 입력) | 'google_maps' (크롤러)
  @Column({ type: 'varchar', length: 20, default: 'manual' })
  @Index()
  source: 'manual' | 'google_maps';

  @Column({ type: 'simple-json', nullable: true })
  photos: string[]; // 사진 URL 배열 (Google Places 보강 시 사진 프록시 URL)

  // Google Places photo_reference 원본 (사진 프록시 엔드포인트가 실제 이미지로 해석)
  @Column({ type: 'simple-json', nullable: true })
  photoRefs: string[];

  // 영업시간 (Google Places opening_hours.weekday_text)
  @Column({ type: 'simple-json', nullable: true })
  businessHours: string[];

  // 홈페이지/웹사이트 (Google Places website)
  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string;

  // 구글 실제 리뷰 (Place Details reviews, 최대 5개)
  @Column({ type: 'simple-json', nullable: true })
  googleReviews: {
    author: string;
    rating: number;
    text: string;
    relativeTime?: string;
    profilePhoto?: string;
  }[];

  // 관련 유튜브 영상 (YouTube Data API 검색 결과)
  @Column({ type: 'simple-json', nullable: true })
  videos: { id: string; title: string; thumbnail: string; channel?: string }[];

  // Google 보강을 수행한 시각 (null이면 미보강 → 상세 진입 시 1회 보강)
  @Column({ type: 'timestamp', nullable: true })
  enrichedAt: Date | null;

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
