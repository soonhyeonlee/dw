import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClickLog } from '../products/entities/click-log.entity';
import { Product } from '../products/entities/product.entity';
import { CashbackService } from '../cashback/cashback.service';
import { CoupangPartnersService } from './coupang-partners.service';

export interface IngestResult {
  enabled: boolean;
  message?: string;
  range?: { start: string; end: string };
  orders?: number;
  accrued?: number; // 신규 적립 건수
  skipped?: number; // 이미 적립됨(멱등)
  unmatched?: number; // subId 로 클릭 못 찾음
  cancelled?: number; // 취소 반영 건수
}

/**
 * 제휴사 전환 리포트를 수집해 유저별 캐시백으로 적립한다("포인트 쌓기" 핵심).
 * 현재는 쿠팡파트너스만. 키 미설정이면 enabled:false 로 무동작.
 *
 * 호출: 어드민 트리거 또는 EC2 cron (POST /affiliate/coupang/ingest).
 */
@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(
    private readonly coupang: CoupangPartnersService,
    private readonly cashback: CashbackService,
    @InjectRepository(ClickLog)
    private readonly clickLogRepo: Repository<ClickLog>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  /** yyyyMMdd (쿠팡 리포트 날짜 포맷) */
  private fmtDate(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  }

  private defaultRange(start?: string, end?: string) {
    if (start && end) return { start, end };
    const now = new Date();
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { start: this.fmtDate(from), end: this.fmtDate(now) };
  }

  async ingestCoupangConversions(
    start?: string,
    end?: string,
  ): Promise<IngestResult> {
    if (!this.coupang.isEnabled()) {
      return { enabled: false, message: '쿠팡파트너스 API 키 미설정' };
    }

    const range = this.defaultRange(start, end);
    const orders = await this.coupang.fetchOrderReports(range.start, range.end);

    let accrued = 0;
    let skipped = 0;
    let unmatched = 0;

    for (const row of orders) {
      if (!row.subId) {
        unmatched++;
        continue;
      }
      const click = await this.clickLogRepo.findOne({
        where: { trackingId: row.subId },
      });
      if (!click) {
        unmatched++;
        continue;
      }

      // 적립액 = 주문금액 × 상품 캐시백률(유저에게 약속한 비율).
      const product = click.productId
        ? await this.productRepo.findOne({ where: { id: click.productId } })
        : null;
      const rate = product ? Number(product.cashbackRate) || 0 : 0;
      const cashbackAmount = Math.round((row.sale * rate) / 100);

      const res = await this.cashback.recordConversion({
        userId: click.userId,
        productId: click.productId,
        platform: 'coupang',
        orderAmount: row.sale,
        commissionAmount: row.commission,
        cashbackAmount,
        externalOrderId: `coupang:${row.orderId}`,
      });

      if (res.created) {
        accrued++;
        if (!click.purchaseConfirmed) {
          click.purchaseConfirmed = true;
          await this.clickLogRepo.save(click);
        }
      } else {
        skipped++;
      }
    }

    // 취소 리포트 → 적립 취소(차감)
    const cancelIds = await this.coupang.fetchCancelReports(
      range.start,
      range.end,
    );
    let cancelled = 0;
    for (const orderId of cancelIds) {
      const ok = await this.cashback.cancelByExternalOrder(`coupang:${orderId}`);
      if (ok) cancelled++;
    }

    this.logger.log(
      `쿠팡 전환 수집 [${range.start}~${range.end}] orders=${orders.length} accrued=${accrued} skipped=${skipped} unmatched=${unmatched} cancelled=${cancelled}`,
    );

    return {
      enabled: true,
      range,
      orders: orders.length,
      accrued,
      skipped,
      unmatched,
      cancelled,
    };
  }
}
