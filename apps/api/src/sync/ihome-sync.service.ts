import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import { Product } from '../products/entities/product.entity';
import { IhomeSyncState } from './entities/ihome-sync-state.entity';
import { MarketProduct } from '../market/entities/market-product.entity';

const PLATFORM = 'ihomemarket';
const ITEM_BASE_URL = 'https://i-homemarket.co.kr';

interface IhomeItemRow {
  it_id: string;
  it_name: string;
  it_basic: string;
  it_cust_price: string;
  it_price: string;
  it_img1: string;
  it_img2: string;
  it_use: string;
  it_soldout: string;
  ca_id: string;
  it_stock_qty: string;
  it_hit: string;
  it_use_cnt: string;
  it_use_avg: string;
  it_update_time: string;
  it_time: string;
  ca_name: string | null;
  it_maker: string | null;
}

interface IhomeItemsResponse {
  ok: boolean;
  rows: IhomeItemRow[];
  count: number;
  next_since: string;
  err?: string;
}

@Injectable()
export class IhomeSyncService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(IhomeSyncService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(IhomeSyncState)
    private readonly stateRepo: Repository<IhomeSyncState>,
    @InjectRepository(MarketProduct)
    private readonly market: Repository<MarketProduct>,
  ) {}

  onApplicationBootstrap(): void {
    if (this.config.get('IHOME_SYNC_ENABLED') !== 'true') {
      this.logger.log('IHOME_SYNC_ENABLED is not "true" — sync disabled');
      return;
    }
    const intervalMs = parseInt(
      this.config.get('IHOME_SYNC_INTERVAL_MS', '600000'),
      10,
    );
    this.logger.log(`ihome sync enabled, interval=${intervalMs}ms`);
    setImmediate(() => this.runOnce().catch(() => undefined));
    this.timer = setInterval(
      () => this.runOnce().catch(() => undefined),
      intervalMs,
    );
  }

  onApplicationShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runOnce(): Promise<{
    synced: number;
    fetched: number;
    cursor: string;
  }> {
    if (this.running) {
      this.logger.warn('previous run still in progress — skipping');
      return { synced: 0, fetched: 0, cursor: '' };
    }
    this.running = true;
    const startedAt = Date.now();
    try {
      const state = await this.loadState();
      let since = state.lastSinceCursor || '';
      let totalFetched = 0;
      let totalUpserted = 0;
      const pageLimit = 100;

      while (true) {
        const resp = await this.callSync('items', {
          since,
          limit: String(pageLimit),
          offset: '0',
        });
        if (!resp || resp.ok !== true) {
          throw new Error(`items returned ok=false: ${resp?.err ?? 'no body'}`);
        }
        const rows = resp.rows || [];
        if (rows.length === 0) {
          break;
        }
        for (const row of rows) {
          await this.upsertProduct(row);
          totalUpserted += 1;
        }
        totalFetched += rows.length;
        const nextCursor = resp.next_since || since;
        // If cursor did not move and we got a full page, advance by stepping
        // past this update_time (cheap heuristic — db likely has duplicates).
        if (nextCursor === since && rows.length === pageLimit) {
          // bump by 1 second to avoid infinite loop
          const d = new Date(since.replace(' ', 'T') + 'Z');
          d.setSeconds(d.getSeconds() + 1);
          since = d.toISOString().slice(0, 19).replace('T', ' ');
        } else {
          since = nextCursor;
        }
        if (rows.length < pageLimit) {
          break;
        }
      }

      await this.stateRepo.save({
        ...state,
        lastSinceCursor: since,
        lastRunAt: new Date(),
        totalSynced: state.totalSynced + totalUpserted,
        lastFetched: totalFetched,
        lastError: null,
      });
      this.logger.log(
        `ihome sync done: fetched=${totalFetched} upserted=${totalUpserted} cursor=${since} elapsed=${Date.now() - startedAt}ms`,
      );
      return { synced: totalUpserted, fetched: totalFetched, cursor: since };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`ihome sync failed: ${msg}`);
      const state = await this.loadState();
      await this.stateRepo.save({
        ...state,
        lastRunAt: new Date(),
        lastError: msg,
      });
      throw e;
    } finally {
      this.running = false;
    }
  }

  async getStatus(): Promise<IhomeSyncState> {
    return this.loadState();
  }

  private async loadState(): Promise<IhomeSyncState> {
    let s = await this.stateRepo.findOne({ where: { id: 1 } });
    if (!s) {
      s = await this.stateRepo.save(
        this.stateRepo.create({
          id: 1,
          lastSinceCursor: '',
          totalSynced: 0,
          lastFetched: 0,
        }),
      );
    }
    return s;
  }

  private async upsertProduct(row: IhomeItemRow): Promise<void> {
    const price = this.asInt(row.it_price);
    const custPrice = this.asInt(row.it_cust_price);
    const discountRate =
      custPrice && custPrice > price
        ? Math.round(((custPrice - price) / custPrice) * 10000) / 100
        : null;
    const useAvg = parseFloat(row.it_use_avg);
    const isActive = row.it_use === '1' && row.it_soldout !== '1';
    const imageUrl = row.it_img1
      ? `${ITEM_BASE_URL}/data/item/${row.it_img1}`
      : '';
    const productUrl = `${ITEM_BASE_URL}/shop/item.php?it_id=${row.it_id}`;
    const category = (row.ca_name || row.ca_id || '기타').trim();
    // it_maker 는 이 쇼핑몰에서 대부분 빈 값/플레이스홀더("상품 상세설명에 표시").
    // 의미 없는 값은 null 로 둬서(앱이 제목 첫 단어로 폴백) 그룹핑 품질을 지킨다.
    const makerRaw = row.it_maker?.trim() || '';
    const brand = makerRaw && !makerRaw.includes('상세설명') ? makerRaw : null;

    const existing = await this.products.findOne({
      where: { platform: PLATFORM, externalId: row.it_id },
    });
    const next: Partial<Product> = {
      platform: PLATFORM,
      externalId: row.it_id,
      title: row.it_name?.trim() || `상품 ${row.it_id}`,
      description: row.it_basic || '',
      price: price as unknown as number,
      originalPrice:
        custPrice && custPrice !== price
          ? (custPrice as unknown as number)
          : (null as unknown as number),
      discountRate: (discountRate ?? null) as unknown as number,
      imageUrl,
      productUrl,
      affiliateUrl: existing?.affiliateUrl ?? productUrl,
      category,
      brand,
      // 신규 상품 기본 캐시백 10% (관리자가 개별 지정 시 보존). 2026-06-11.
      cashbackRate: existing?.cashbackRate ?? 10,
      cashbackAmount: existing?.cashbackAmount ?? Math.round(Number(price) * 0.1),
      rating:
        Number.isFinite(useAvg) && useAvg > 0
          ? (useAvg as unknown as number)
          : (null as unknown as number),
      reviewCount: this.asInt(row.it_use_cnt),
      isActive,
    };
    if (existing) {
      await this.products.update({ id: existing.id }, next);
    } else {
      await this.products.save(this.products.create(next));
    }

    // 번개장터 직접판매 카탈로그 미러 — 같은 아이홈마켓 상품을 market_products 에도 upsert.
    // (번개장터는 market 시스템=체크아웃+포인트를 쓰므로 실제 상품이 여기로 들어와야 한다.)
    const stock = this.asInt(row.it_stock_qty);
    const mp: Partial<MarketProduct> = {
      externalId: row.it_id,
      title: next.title,
      description: next.description,
      price: next.price,
      originalPrice: next.originalPrice,
      discountRate: next.discountRate,
      imageUrl: next.imageUrl,
      category: next.category,
      // market_products.rating 은 NOT NULL — 평점 없는 상품(it_use_avg=0)은 0 으로.
      rating: (next.rating ?? 0) as unknown as number,
      reviewCount: next.reviewCount,
      isActive: next.isActive,
      // youngcart it_stock_qty: 0 은 재고 무제한 취급 → 큰 값으로.
      stockQuantity: stock > 0 ? stock : 9999,
      freeDelivery: true,
    };
    const existingMp = await this.market.findOne({
      where: { externalId: row.it_id },
    });
    if (existingMp) {
      // 카탈로그 필드만 갱신, soldCount 등 운영 누적값은 보존.
      await this.market.update({ id: existingMp.id }, mp);
    } else {
      await this.market.save(this.market.create(mp));
    }
  }

  private async callSync(
    action: string,
    extra: Record<string, string>,
  ): Promise<IhomeItemsResponse> {
    const url = this.config.get<string>('IHOME_SYNC_URL');
    const secret = this.config.get<string>('IHOME_SYNC_SECRET');
    if (!url || !secret) {
      throw new Error('IHOME_SYNC_URL or IHOME_SYNC_SECRET not configured');
    }
    const params: Record<string, string> = {
      action,
      ts: String(Math.floor(Date.now() / 1000)),
      ...extra,
    };
    params.sig = this.sign(params, secret);
    const qs = new URLSearchParams(params).toString();
    const full = `${url}?${qs}`;
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 30_000);
    try {
      const res = await fetch(full, {
        headers: { 'User-Agent': 'doublewin-api-sync/1.0' },
        signal: ac.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      return JSON.parse(text) as IhomeItemsResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  private sign(params: Record<string, string>, secret: string): string {
    // Match PHP http_build_query() default (RFC 1738, space=+) so the
    // signature aligns with the PHP endpoint's canonical form.
    const usp = new URLSearchParams();
    Object.keys(params)
      .filter((k) => k !== 'sig')
      .sort()
      .forEach((k) => usp.append(k, params[k]));
    return createHmac('sha256', secret).update(usp.toString()).digest('hex');
  }

  private asInt(v: string | undefined | null): number {
    const n = parseInt(v ?? '0', 10);
    return Number.isFinite(n) ? n : 0;
  }
}
