import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AffiliateService } from './affiliate.service';
import { CoupangPartnersService } from './coupang-partners.service';

@Controller('affiliate')
export class AffiliateController {
  constructor(
    private readonly affiliate: AffiliateService,
    private readonly coupang: CoupangPartnersService,
  ) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('coupang/status')
  status() {
    return {
      success: true,
      data: { enabled: this.coupang.isEnabled() },
    };
  }

  /**
   * 쿠팡 전환 리포트 수집 → 유저별 캐시백 적립.
   * 어드민 또는 EC2 cron 에서 호출. start/end = yyyyMMdd (생략 시 최근 7일).
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('coupang/ingest')
  async ingest(@Query('start') start?: string, @Query('end') end?: string) {
    const data = await this.affiliate.ingestCoupangConversions(start, end);
    return { success: true, data };
  }
}
