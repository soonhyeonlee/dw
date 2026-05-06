import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CashbackService } from './cashback.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('cashback')
export class CashbackController {
  constructor(
    private readonly cashbackService: CashbackService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.cashbackService.getUserTransactions(
      req.user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
    return { success: true, data };
  }

  /**
   * 구매 확정 웹훅 - 쇼핑몰에서 구매 확정 시 호출
   * x-webhook-secret 헤더로 인증
   */
  @Post('webhook/confirm')
  async webhookConfirm(
    @Headers('x-webhook-secret') secret: string,
    @Body()
    body: {
      userId: string;
      productId?: string;
      platform: string;
      orderAmount: number;
      commissionAmount: number;
    },
  ) {
    const webhookSecret = this.configService.get<string>('WEBHOOK_SECRET', 'doublewin-webhook-secret');
    if (secret !== webhookSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    const tx = await this.cashbackService.createTransaction(body);
    await this.cashbackService.confirmTransaction(tx.id);

    return { success: true, data: { transactionId: tx.id } };
  }

  /**
   * 관리자: 전체 캐시백 내역 조회
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/transactions')
  async getAllTransactions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const data = await this.cashbackService.getAllTransactions(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      status,
    );
    return { success: true, data };
  }

  /**
   * 관리자: 수동 캐시백 확정
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/confirm/:id')
  async adminConfirm(@Param('id') id: string) {
    await this.cashbackService.confirmTransaction(id);
    return { success: true, message: '캐시백이 확정되었습니다' };
  }

  /**
   * 관리자: 캐시백 취소
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/cancel/:id')
  async adminCancel(@Param('id') id: string) {
    await this.cashbackService.cancelTransaction(id);
    return { success: true, message: '캐시백이 취소되었습니다' };
  }
}
