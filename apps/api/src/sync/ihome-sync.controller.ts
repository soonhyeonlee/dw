import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { IhomeSyncService } from './ihome-sync.service';

@Controller('sync/ihome')
export class IhomeSyncController {
  constructor(private readonly sync: IhomeSyncService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('status')
  async status() {
    return { success: true, data: await this.sync.getStatus() };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('run')
  async run() {
    const result = await this.sync.runOnce();
    return { success: true, data: result };
  }
}
