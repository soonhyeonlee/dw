import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Academy } from './academy.entity';

@Entity('academy_reviews')
export class AcademyReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  academyId: string;

  @ManyToOne(() => Academy)
  @JoinColumn({ name: 'academyId' })
  academy: Academy;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  rating: number; // 1~5

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'simple-json', nullable: true })
  photos: string[];

  @Column({ type: 'boolean', default: false })
  isMomCafe: boolean; // 맘카페 회원 리뷰 여부

  @CreateDateColumn()
  createdAt: Date;
}
