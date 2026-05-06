import { Controller, Get, Patch, Post, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    const { password, ...result } = user;
    return { success: true, data: result };
  }

  // === 회원체계 API ===

  @Get('associations')
  async getAssociations() {
    const data = await this.usersService.getAssociations();
    return { success: true, data };
  }

  @Get('partners')
  async getPartners(@Query('associationId') associationId?: string) {
    const data = await this.usersService.getPartners(associationId);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/children')
  async getMyChildren(@Request() req) {
    const data = await this.usersService.getChildren(req.user.id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/stats')
  async getMyStats(@Request() req) {
    const data = await this.usersService.getMemberStats(req.user.id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/parent')
  async changeParent(
    @Request() req,
    @Body('parentId') parentId: string | undefined,
  ) {
    const user = await this.usersService.changeParent(req.user.id, parentId);
    const { password, ...result } = user;
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/list')
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('keyword') keyword?: string,
  ) {
    const data = await this.usersService.getAllUsers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      keyword,
    );
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/:id/role')
  async setRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    await this.usersService.setRole(id, role);
    return { success: true, message: '권한이 변경되었습니다' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateProfile(
    @Request() req,
    @Body()
    dto: {
      nickname?: string;
      phone?: string;
      profileImage?: string;
      bankName?: string;
      accountNumber?: string;
      accountHolder?: string;
    },
  ) {
    const user = await this.usersService.updateProfile(req.user.id, dto);
    const { password, ...result } = user;
    return { success: true, data: result };
  }
}
