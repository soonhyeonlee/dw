import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// 홈/카테고리 프로모 배너. 아이홈마켓(어드민)에서 사진·태그·제목·서브내용 입력 후
// 활성/비활성 토글로 노출 제어. 모바일 PromoCarousel 이 그대로 렌더.
@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 노출 위치: 'home' | 'category'
  @Column({ type: 'varchar', default: 'home' })
  placement: string;

  // 배너 이미지 — data URI(base64) 또는 외부 URL. 풀블리드로 렌더.
  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  // 태그(배지) 텍스트 — 예: "페이백", "여행 BIG"
  @Column({ type: 'varchar', nullable: true })
  badge: string | null;

  // 제목(하단)
  @Column({ type: 'varchar' })
  title: string;

  // 서브 내용
  @Column({ type: 'varchar', nullable: true })
  subtitle: string | null;

  // 텍스트 오버레이 정렬(그래픽 반대편): 'left' | 'right'
  @Column({ type: 'varchar', default: 'left' })
  align: string;

  // 온/오프
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // 정렬 순서(작을수록 앞)
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
