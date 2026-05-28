import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ihome_sync_state')
export class IhomeSyncState {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  lastSinceCursor: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastRunAt: Date | null;

  @Column({ default: 0 })
  totalSynced: number;

  @Column({ default: 0 })
  lastFetched: number;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
