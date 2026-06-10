import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BannersService } from './banners.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller()
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  // === Public: 모바일 노출용(활성 배너) ===
  @Get('banners')
  async list(@Query('placement') placement?: string) {
    const data = await this.bannersService.getActive(placement || 'home');
    return { success: true, data };
  }

  // === Admin: 배너 관리 ===
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/banners')
  async adminList(@Query('placement') placement?: string) {
    const data = await this.bannersService.getAll(placement);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/banners')
  async create(@Body() dto: any) {
    const data = await this.bannersService.create(dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/banners/:id')
  async update(@Param('id') id: string, @Body() dto: any) {
    const data = await this.bannersService.update(id, dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/banners/:id')
  async remove(@Param('id') id: string) {
    await this.bannersService.remove(id);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/banners/reorder')
  async reorder(@Body('ids') ids: string[]) {
    await this.bannersService.reorder(ids);
    return { success: true };
  }
}
