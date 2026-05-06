import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings() {
    const data = await this.settingsService.getSettings();
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch()
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    const data = await this.settingsService.updateSettings(dto);
    return { success: true, data };
  }
}
