import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettings } from './entities/app-settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(AppSettings)
    private readonly settingsRepo: Repository<AppSettings>,
  ) {}

  async getSettings(): Promise<AppSettings> {
    let settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = this.settingsRepo.create({
        id: 1,
        minWithdrawalAmount: 5000,
        defaultCashbackRate: 50,
        platformRates: { coupang: 60, naver: 50, '11st': 55 },
      });
      await this.settingsRepo.save(settings);
    }
    return settings;
  }

  async updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
    await this.settingsRepo.update(1, data);
    return this.getSettings();
  }
}
