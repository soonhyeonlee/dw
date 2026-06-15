import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const BASE_URL = 'https://api-gateway.coupang.com';
const DEEPLINK_PATH =
  '/v2/providers/affiliate_open_api/apis/openapi/deeplink';
const ORDER_REPORT_PATH =
  '/v2/providers/affiliate_open_api/apis/openapi/reports/orders';
const CANCEL_REPORT_PATH =
  '/v2/providers/affiliate_open_api/apis/openapi/reports/cancels';

export interface CoupangOrderRow {
  orderId: string;
  subId: string | null;
  productId: string;
  productName?: string;
  sale: number; // 주문 금액(GMV)
  commission: number; // 파트너스 수수료
  status?: string;
  orderedAt?: string;
}

/**
 * 쿠팡파트너스 Open API 클라이언트 (apps/crawler/crawlers/coupang.py 의 TS 포팅).
 * 환경변수 COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY / COUPANG_PARTNER_ID 가
 * 모두 채워졌을 때만 동작한다. 비어 있으면 isEnabled()=false → 호출부가 폴백.
 */
@Injectable()
export class CoupangPartnersService {
  private readonly logger = new Logger(CoupangPartnersService.name);
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly partnerId: string;

  constructor(private readonly config: ConfigService) {
    this.accessKey = (this.config.get<string>('COUPANG_ACCESS_KEY') || '').trim();
    this.secretKey = (this.config.get<string>('COUPANG_SECRET_KEY') || '').trim();
    this.partnerId = (this.config.get<string>('COUPANG_PARTNER_ID') || '').trim();
  }

  isEnabled(): boolean {
    return Boolean(this.accessKey && this.secretKey);
  }

  /** 쿠팡 CEA HMAC 인증 헤더 생성 */
  private authHeaders(
    method: string,
    urlPath: string,
    query = '',
  ): Record<string, string> {
    const now = this.signedDate();
    const message = `${now}${method}${urlPath}${query}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(message, 'utf8')
      .digest('hex');

    return {
      Authorization:
        `CEA algorithm=HmacSHA256, access-key=${this.accessKey}, ` +
        `signed-date=${now}, signature=${signature}`,
      'Content-Type': 'application/json',
    };
  }

  /** yyMMdd'T'HHmmss'Z' (UTC) — Python strftime("%y%m%dT%H%M%SZ") 와 동일 */
  private signedDate(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return (
      p(d.getUTCFullYear() % 100) +
      p(d.getUTCMonth() + 1) +
      p(d.getUTCDate()) +
      'T' +
      p(d.getUTCHours()) +
      p(d.getUTCMinutes()) +
      p(d.getUTCSeconds()) +
      'Z'
    );
  }

  /**
   * 상품 URL 에 대해 추적 딥링크 생성. subId 는 클릭 추적용(유저별 식별자).
   * 실패/미설정 시 원본 URL 을 그대로 반환한다.
   */
  async generateDeeplink(coupangUrl: string, subId: string): Promise<string> {
    if (!this.isEnabled()) return coupangUrl;

    const headers = this.authHeaders('POST', DEEPLINK_PATH);
    try {
      const res = await fetch(`${BASE_URL}${DEEPLINK_PATH}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ coupangUrls: [coupangUrl], subId }),
      });
      if (!res.ok) {
        this.logger.warn(`딥링크 생성 HTTP ${res.status}`);
        return coupangUrl;
      }
      const data: any = await res.json();
      const links = data?.data ?? [];
      return links[0]?.shortenUrl || links[0]?.landingUrl || coupangUrl;
    } catch (e) {
      this.logger.error(`딥링크 생성 실패: ${e}`);
      return coupangUrl;
    }
  }

  /**
   * 주문 전환 리포트 조회. createdAt 기준 [startDate, endDate] (yyyyMMdd).
   * 반환 행의 subId 로 클릭(유저)을 역추적한다.
   */
  async fetchOrderReports(
    startDate: string,
    endDate: string,
  ): Promise<CoupangOrderRow[]> {
    if (!this.isEnabled()) return [];

    const query = `startDate=${startDate}&endDate=${endDate}`;
    const headers = this.authHeaders('GET', ORDER_REPORT_PATH, query);
    try {
      const res = await fetch(
        `${BASE_URL}${ORDER_REPORT_PATH}?${query}`,
        { method: 'GET', headers },
      );
      if (!res.ok) {
        this.logger.warn(`주문 리포트 HTTP ${res.status}`);
        return [];
      }
      const data: any = await res.json();
      const rows: any[] = data?.data ?? [];
      return rows.map((r) => ({
        orderId: String(r.orderId ?? r.orderid ?? ''),
        subId: r.subId ?? r.subid ?? null,
        productId: String(r.productId ?? r.productid ?? ''),
        productName: r.productName,
        sale: Number(r.sale ?? r.gmv ?? 0),
        commission: Number(r.commission ?? 0),
        status: r.status,
        orderedAt: r.orderedAt ?? r.date,
      }));
    } catch (e) {
      this.logger.error(`주문 리포트 조회 실패: ${e}`);
      return [];
    }
  }

  /** 취소 리포트 — 적립 취소 처리용 (orderId 목록) */
  async fetchCancelReports(
    startDate: string,
    endDate: string,
  ): Promise<string[]> {
    if (!this.isEnabled()) return [];

    const query = `startDate=${startDate}&endDate=${endDate}`;
    const headers = this.authHeaders('GET', CANCEL_REPORT_PATH, query);
    try {
      const res = await fetch(
        `${BASE_URL}${CANCEL_REPORT_PATH}?${query}`,
        { method: 'GET', headers },
      );
      if (!res.ok) return [];
      const data: any = await res.json();
      const rows: any[] = data?.data ?? [];
      return rows.map((r) => String(r.orderId ?? r.orderid ?? '')).filter(Boolean);
    } catch (e) {
      this.logger.error(`취소 리포트 조회 실패: ${e}`);
      return [];
    }
  }
}
