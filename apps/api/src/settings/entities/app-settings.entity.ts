import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('app_settings')
export class AppSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 5000 })
  minWithdrawalAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 50 })
  defaultCashbackRate: number; // 플랫폼 수수료 중 사용자 캐시백 비율 (%)

  @Column({ type: 'simple-json', default: '{}' })
  platformRates: Record<string, number>; // { coupang: 60, naver: 50, 11st: 55 }

  @Column({ default: false })
  maintenanceMode: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
