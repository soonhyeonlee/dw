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

  @Column({ type: 'simple-json', nullable: true })
  photos: string[]; // 사진 URL 배열

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
