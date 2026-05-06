import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MarketProduct } from './market-product.entity';

@Entity('exhibitions')
export class Exhibition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column({ nullable: true })
  bannerImageUrl: string;

  @Column({ nullable: true })
  bannerColor: string; // 배경색

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endAt: Date;

  @OneToMany(() => MarketProduct, (p) => p.exhibitionId)
  products: MarketProduct[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
