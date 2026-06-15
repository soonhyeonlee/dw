import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Product } from './entities/product.entity';
import { ClickLog } from './entities/click-log.entity';
import { Wishlist } from './entities/wishlist.entity';
import { MallWishlist } from './entities/mall-wishlist.entity';
import { Mall } from '../blocks/entities/mall.entity';
import { CoupangPartnersService } from '../affiliate/coupang-partners.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ClickLog)
    private readonly clickLogRepo: Repository<ClickLog>,
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,
    @InjectRepository(MallWishlist)
    private readonly mallWishlistRepo: Repository<MallWishlist>,
    @InjectRepository(Mall)
    private readonly mallRepo: Repository<Mall>,
    private readonly coupang: CoupangPartnersService,
  ) {}

  async findAll(query: {
    platform?: string;
    category?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }) {
    const { platform, category, keyword, page = 1, limit = 20 } = query;
    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.isActive = :active', { active: true });

    if (platform) {
      const parts = platform
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length > 1) {
        qb.andWhere('p.platform IN (:...platforms)', { platforms: parts });
      } else if (parts.length === 1) {
        qb.andWhere('p.platform = :platform', { platform: parts[0] });
      }
    }
    if (category) qb.andWhere('p.category = :category', { category });
    if (keyword) qb.andWhere('LOWER(p.title) LIKE LOWER(:keyword)', { keyword: `%${keyword}%` });

    const [items, total] = await qb
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 활성 상품이 실제로 들어와 있는 distinct 카테고리 + 개수.
   * 상품이 들어오고 빠짐에 따라 목록이 바뀌므로, 클라이언트는 이걸로
   * 카테고리 탭/칩을 동적으로 구성한다(고정 목록 X).
   */
  async getCategories(platform?: string) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .select('p.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('p.isActive = :active', { active: true })
      .andWhere("p.category IS NOT NULL AND p.category <> ''");

    if (platform) {
      const parts = platform
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length > 1) {
        qb.andWhere('p.platform IN (:...platforms)', { platforms: parts });
      } else if (parts.length === 1) {
        qb.andWhere('p.platform = :platform', { platform: parts[0] });
      }
    }

    const rows = await qb
      .groupBy('p.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    return rows.map((r) => ({ category: r.category, count: Number(r.count) }));
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다');
    return product;
  }

  // === Admin CRUD ===

  async adminFindAll(query: {
    platform?: string;
    category?: string;
    keyword?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { platform, category, keyword, isActive, page = 1, limit = 50 } = query;
    const qb = this.productRepo.createQueryBuilder('p');
    if (platform) qb.andWhere('p.platform = :platform', { platform });
    if (category) qb.andWhere('p.category = :category', { category });
    if (keyword) qb.andWhere('LOWER(p.title) LIKE LOWER(:keyword)', { keyword: `%${keyword}%` });
    if (typeof isActive === 'boolean') qb.andWhere('p.isActive = :isActive', { isActive });
    const [items, total] = await qb
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(data: Partial<Product>): Promise<Product> {
    const externalId =
      data.externalId && data.externalId.trim().length > 0
        ? data.externalId
        : `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const product = this.productRepo.create({ ...data, externalId });
    return this.productRepo.save(product);
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    await this.findById(id);
    const { id: _ignore, createdAt: _c, updatedAt: _u, ...patch } = data as any;
    await this.productRepo.update(id, patch);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.productRepo.delete(id);
  }

  async logClick(userId: string, productId: string): Promise<ClickLog> {
    const product = await this.findById(productId);

    // 클릭별 고유 추적 토큰 — 제휴사 전환 리포트의 subId 로 되돌아온다.
    const trackingId = crypto.randomBytes(10).toString('hex'); // 20 chars

    let affiliateUrl = product.affiliateUrl || product.productUrl;

    // 쿠팡 + 키 설정됨 → 유저별 subId(=trackingId) 추적 딥링크 생성.
    if (
      (product.platform || '').toLowerCase() === 'coupang' &&
      this.coupang.isEnabled()
    ) {
      const target = product.productUrl || product.affiliateUrl;
      if (target) {
        affiliateUrl = await this.coupang.generateDeeplink(target, trackingId);
      }
    }

    const log = this.clickLogRepo.create({
      userId,
      productId,
      platform: product.platform,
      affiliateUrl,
      trackingId,
    });
    return this.clickLogRepo.save(log);
  }

  // 찜하기 토글
  async toggleWishlist(userId: string, productId: string): Promise<{ wishlisted: boolean }> {
    const existing = await this.wishlistRepo.findOne({
      where: { userId, productId },
    });

    if (existing) {
      await this.wishlistRepo.remove(existing);
      return { wishlisted: false };
    }

    await this.findById(productId); // 상품 존재 확인
    const item = this.wishlistRepo.create({ userId, productId });
    await this.wishlistRepo.save(item);
    return { wishlisted: true };
  }

  // 찜한 상품 목록
  async getWishlist(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.wishlistRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['product'],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((w) => w.product),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 최근 본 상품 (클릭 로그 기반)
  async getRecentlyViewed(userId: string, limit = 20) {
    const logs = await this.clickLogRepo.find({
      where: { userId },
      order: { clickedAt: 'DESC' },
      take: limit * 2,
    });

    if (logs.length === 0) return { items: [] };

    // 중복 제거 (최근 클릭 우선)
    const seen = new Set<string>();
    const uniqueProductIds: string[] = [];
    for (const log of logs) {
      if (!seen.has(log.productId) && uniqueProductIds.length < limit) {
        seen.add(log.productId);
        uniqueProductIds.push(log.productId);
      }
    }

    const products = await this.productRepo
      .createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids: uniqueProductIds })
      .getMany();

    // 원래 순서 유지
    const productMap = new Map(products.map((p) => [p.id, p]));
    const sorted = uniqueProductIds
      .map((id) => productMap.get(id))
      .filter(Boolean);

    return { items: sorted };
  }

  // === 관심 쇼핑몰 ===

  async toggleMallWishlist(userId: string, mallId: string): Promise<{ wishlisted: boolean }> {
    const existing = await this.mallWishlistRepo.findOne({ where: { userId, mallId } });

    if (existing) {
      await this.mallWishlistRepo.remove(existing);
      return { wishlisted: false };
    }

    const mall = await this.mallRepo.findOne({ where: { id: mallId } });
    if (!mall) throw new NotFoundException('쇼핑몰을 찾을 수 없습니다');

    const item = this.mallWishlistRepo.create({ userId, mallId });
    await this.mallWishlistRepo.save(item);
    return { wishlisted: true };
  }

  async getMallWishlist(userId: string) {
    const items = await this.mallWishlistRepo.find({
      where: { userId },
      relations: ['mall'],
      order: { createdAt: 'DESC' },
    });
    return { items: items.map((w) => w.mall) };
  }
}
