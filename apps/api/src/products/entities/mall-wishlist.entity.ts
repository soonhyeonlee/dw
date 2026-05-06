import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Mall } from '../../blocks/entities/mall.entity';

@Entity('mall_wishlists')
@Index(['userId', 'mallId'], { unique: true })
export class MallWishlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  mallId: string;

  @ManyToOne(() => Mall, { eager: true })
  @JoinColumn({ name: 'mallId' })
  mall: Mall;

  @CreateDateColumn()
  createdAt: Date;
}
