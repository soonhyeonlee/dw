import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller()
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  // === Public: 홈 화면 데이터 ===

  @Get('home')
  async getHomeData() {
    const data = await this.blocksService.getHomeData();
    return { success: true, data };
  }

  @Get('malls')
  async getActiveMalls() {
    const data = await this.blocksService.getActiveMalls();
    return { success: true, data };
  }

  @Get('malls/:platform')
  async getMallDetail(@Param('platform') platform: string) {
    const data = await this.blocksService.getMallByPlatform(platform);
    return { success: true, data };
  }

  // === Admin: 블록 관리 ===

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/blocks')
  async getAllBlocks() {
    const data = await this.blocksService.getAllBlocks();
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/blocks')
  async createBlock(@Body() dto: any) {
    const data = await this.blocksService.createBlock(dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/blocks/:id')
  async updateBlock(@Param('id') id: string, @Body() dto: any) {
    const data = await this.blocksService.updateBlock(id, dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/blocks/:id')
  async deleteBlock(@Param('id') id: string) {
    await this.blocksService.deleteBlock(id);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/blocks/reorder')
  async reorderBlocks(@Body('ids') ids: string[]) {
    await this.blocksService.reorderBlocks(ids);
    return { success: true };
  }

  // === Admin: 쇼핑몰 관리 ===

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/malls')
  async getAllMalls() {
    const data = await this.blocksService.getAllMalls();
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/malls')
  async createMall(@Body() dto: any) {
    const data = await this.blocksService.createMall(dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/malls/:id')
  async updateMall(@Param('id') id: string, @Body() dto: any) {
    const data = await this.blocksService.updateMall(id, dto);
    return { success: true, data };
  }
}
