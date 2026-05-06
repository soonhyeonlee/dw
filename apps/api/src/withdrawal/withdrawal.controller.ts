import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WithdrawalService } from './withdrawal.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { WithdrawalRequestDto } from './dto/withdrawal-request.dto';

@Controller('withdrawal')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @UseGuards(JwtAuthGuard)
  @Post('request')
  async requestWithdrawal(
    @Request() req,
    @Body() dto: WithdrawalRequestDto,
  ) {
    const data = await this.withdrawalService.requestWithdrawal(
      req.user.id,
      dto.amount,
      dto.bankName,
      dto.accountNumber,
      dto.accountHolder,
    );
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.withdrawalService.getUserWithdrawals(
      req.user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
    return { success: true, data };
  }

  /**
   * 관리자: 전체 출금 요청 목록 조회
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/list')
  async getAllWithdrawals(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const data = await this.withdrawalService.getAllWithdrawals(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      status,
    );
    return { success: true, data };
  }

  /**
   * 관리자: 출금 승인
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/approve/:id')
  async approveWithdrawal(@Param('id') id: string) {
    await this.withdrawalService.approveWithdrawal(id);
    return { success: true, message: '출금이 승인되었습니다' };
  }

  /**
   * 관리자: 출금 거절
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/reject/:id')
  async rejectWithdrawal(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    await this.withdrawalService.rejectWithdrawal(id, reason);
    return { success: true, message: '출금이 거절되었습니다' };
  }
}
