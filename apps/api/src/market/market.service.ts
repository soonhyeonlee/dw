import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MarketProduct, MarketBlockType } from './entities/market-product.entity';
import { MarketWishlist } from './entities/market-wishlist.entity';
import { Exhibition } from './entities/exhibition.entity';
import { MarketOrder, OrderStatus } from './entities/market-order.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class MarketService {
  constructor(
    @InjectRepository(MarketProduct)
    private readonly productRepo: Repository<MarketProduct>,
    @InjectRepository(Exhibition)
    private readonly exhibitionRepo: Repository<Exhibition>,
    @InjectRepository(MarketOrder)
    private readonly orderRepo: Repository<MarketOrder>,
    @InjectRepository(MarketWishlist)
    private readonly wishlistRepo: Repository<MarketWishlist>,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  // === 찜 (번개장터 직접판매 상품) ===

  async toggleWishlist(userId: string, productId: string): Promise<{ wishlisted: boolean }> {
    await this.getProduct(productId); // 존재 검증(없으면 404)
    const existing = await this.wishlistRepo.findOne({ where: { userId, productId } });
    if (existing) {
      await this.wishlistRepo.remove(existing);
      return { wishlisted: false };
    }
    await this.wishlistRepo.save(this.wishlistRepo.create({ userId, productId }));
    return { wishlisted: true };
  }

  async getWishlist(userId: string) {
    const items = await this.wishlistRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    // product 는 eager 로딩됨. 활성 상품만 반환.
    return { items: items.map((w) => w.product).filter((p) => p && p.isActive) };
  }

  async getWishlistedIds(userId: string): Promise<string[]> {
    const items = await this.wishlistRepo.find({
      where: { userId },
      select: { productId: true },
    });
    return items.map((w) => w.productId);
  }

  // 번개장터 적립률(%) — 기본 2%. 결제 현금액 기준으로 적립.
  private marketPointRate(): number {
    return this.config.get<number>('MARKET_POINT_RATE_PERCENT', 2) / 100;
  }

  // === 메인 페이지 데이터 ===

  async getMarketHome() {
    const now = new Date();

    const [bannerProducts, twoColProducts, slideProducts, exhibitions, recentProducts] =
      await Promise.all([
        this.productRepo.find({
          where: { isActive: true, blockType: MarketBlockType.BANNER },
          order: { sortOrder: 'ASC' },
          take: 3,
        }),
        this.productRepo.find({
          where: { isActive: true, blockType: MarketBlockType.TWO_COL },
          order: { sortOrder: 'ASC' },
          take: 4,
        }),
        this.productRepo.find({
          where: { isActive: true, blockType: MarketBlockType.THREE_SLIDE },
          order: { sortOrder: 'ASC' },
          take: 6,
        }),
        this.exhibitionRepo.find({
          where: { isActive: true },
          order: { sortOrder: 'ASC' },
          take: 6,
        }),
        this.productRepo.find({
          where: { isActive: true },
          order: { createdAt: 'DESC' },
          take: 10,
        }),
      ]);

    return {
      bannerProducts,
      twoColProducts,
      slideProducts,
      exhibitions,
      recentProducts,
    };
  }

  // === 상품 ===

  async getProduct(id: string): Promise<MarketProduct> {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('상품을 찾을 수 없습니다');
    return product;
  }

  async getProductsByExhibition(exhibitionId: string): Promise<MarketProduct[]> {
    return this.productRepo.find({
      where: { exhibitionId, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  // 활성 상품이 실제로 들어있는 카테고리만(개수 포함) — 동적 칩 구성용.
  async getCategories(): Promise<{ category: string; count: number }[]> {
    const rows = await this.productRepo
      .createQueryBuilder('p')
      .select('p.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('p.isActive = :active', { active: true })
      .andWhere('p.category IS NOT NULL')
      .andWhere("p.category <> ''")
      .groupBy('p.category')
      .orderBy('count', 'DESC')
      .getRawMany();
    return rows.map((r) => ({ category: r.category, count: Number(r.count) }));
  }

  // 평면 상품 목록(선택 카테고리/키워드 검색) — 번개장터 진열·검색(직접판매)용.
  async listProducts(category?: string, keyword?: string, page = 1, limit = 30) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.isActive = :active', { active: true });
    if (category) qb.andWhere('p.category = :category', { category });
    if (keyword && keyword.trim()) {
      qb.andWhere('p.title ILIKE :kw', { kw: `%${keyword.trim()}%` });
    }
    qb.orderBy('p.sortOrder', 'ASC')
      .addOrderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getProductsByCategory(category: string, page = 1, limit = 20) {
    const [items, total] = await this.productRepo.findAndCount({
      where: { category, isActive: true },
      order: { sortOrder: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // === 기획전 ===

  async getExhibition(id: string) {
    const exhibition = await this.exhibitionRepo.findOne({ where: { id } });
    if (!exhibition) throw new NotFoundException('기획전을 찾을 수 없습니다');
    const products = await this.getProductsByExhibition(id);
    return { ...exhibition, products };
  }

  // === 주문 ===

  async createOrder(userId: string, dto: {
    productId: string;
    quantity: number;
    recipientName: string;
    recipientPhone: string;
    address: string;
    addressDetail?: string;
    zipCode: string;
    deliveryMemo?: string;
    usePoint?: number;
  }) {
    const product = await this.getProduct(dto.productId);

    if (product.limitQuantity && product.soldCount + dto.quantity > product.limitQuantity) {
      throw new BadRequestException('한정 수량이 초과되었습니다');
    }

    if (product.stockQuantity < dto.quantity) {
      throw new BadRequestException('재고가 부족합니다');
    }

    const totalPrice = Number(product.price) * dto.quantity;

    // 번개장터 포인트 사용 — 보유 잔액과 주문 금액 안에서만.
    const user = await this.usersService.findById(userId);
    const balance = Number(user.marketPointBalance) || 0;
    const usedPoint = Math.max(0, Math.min(Number(dto.usePoint) || 0, balance, totalPrice));
    const payable = totalPrice - usedPoint;

    // 적립 — 실제 현금 결제액 기준.
    const pointEarned = Math.floor(payable * this.marketPointRate());

    const { productId, quantity, usePoint, ...shippingInfo } = dto;
    const order = this.orderRepo.create({
      userId,
      productId,
      quantity,
      totalPrice,
      usedPoint,
      pointEarned,
      // 번개장터 포인트/즉시정산 결제 — 별도 PG 없이 결제 즉시 완료 처리.
      status: OrderStatus.PAID,
      ...shippingInfo,
    });

    const saved = await this.orderRepo.save(order);

    // 포인트 차감(사용) 후 적립 — 둘 다 번개장터 전용 지갑만 변동.
    if (usedPoint > 0) await this.usersService.spendMarketPoint(userId, usedPoint);
    if (pointEarned > 0) await this.usersService.addMarketPoint(userId, pointEarned);

    // 판매수/재고 업데이트
    await this.productRepo.update(dto.productId, {
      soldCount: () => `"soldCount" + ${dto.quantity}`,
      stockQuantity: () => `"stockQuantity" - ${dto.quantity}`,
    } as any);

    return saved;
  }

  async getMyOrders(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.orderRepo.findAndCount({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrder(id: string, userId: string) {
    const order = await this.orderRepo.findOne({
      where: { id, userId },
      relations: ['product'],
    });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다');
    return order;
  }

  // 사용자 본인 주문 취소 — 배송 시작 전(pending/paid)만 가능. 포인트·재고 원복.
  async cancelOrder(id: string, userId: string) {
    const order = await this.orderRepo.findOne({ where: { id, userId } });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다');
    if (![OrderStatus.PENDING, OrderStatus.PAID].includes(order.status)) {
      throw new BadRequestException('배송이 시작되었거나 이미 취소된 주문은 취소할 수 없습니다');
    }
    await this.reverseOrder(order);
    await this.orderRepo.update(id, { status: OrderStatus.CANCELLED });
    return this.orderRepo.findOne({ where: { id }, relations: ['product'] });
  }

  // 주문 원복 — 사용 포인트 환급 + 적립 포인트 회수 + 판매수/재고 복원. (취소/환불 공통)
  private async reverseOrder(order: MarketOrder) {
    const used = Number(order.usedPoint) || 0;
    const earned = Number(order.pointEarned) || 0;
    if (used > 0) await this.usersService.addMarketPoint(order.userId, used); // 사용분 환급
    if (earned > 0) await this.usersService.spendMarketPoint(order.userId, earned); // 적립분 회수
    await this.productRepo.update(order.productId, {
      soldCount: () => `GREATEST("soldCount" - ${order.quantity}, 0)`,
      stockQuantity: () => `"stockQuantity" + ${order.quantity}`,
    } as any);
  }

  // === Admin ===

  async createProduct(data: Partial<MarketProduct>): Promise<MarketProduct> {
    if (data.originalPrice && data.price) {
      data.discountRate = Math.round(
        ((Number(data.originalPrice) - Number(data.price)) / Number(data.originalPrice)) * 100,
      );
    }
    const product = this.productRepo.create(data);
    return this.productRepo.save(product);
  }

  async updateProduct(id: string, data: Partial<MarketProduct>): Promise<MarketProduct> {
    if (data.originalPrice && data.price) {
      data.discountRate = Math.round(
        ((Number(data.originalPrice) - Number(data.price)) / Number(data.originalPrice)) * 100,
      );
    }
    await this.productRepo.update(id, data);
    return this.getProduct(id);
  }

  async createExhibition(data: Partial<Exhibition>): Promise<Exhibition> {
    const ex = this.exhibitionRepo.create(data);
    return this.exhibitionRepo.save(ex);
  }

  async updateExhibition(id: string, data: Partial<Exhibition>): Promise<Exhibition> {
    await this.exhibitionRepo.update(id, data);
    const ex = await this.exhibitionRepo.findOne({ where: { id } });
    if (!ex) throw new NotFoundException('기획전을 찾을 수 없습니다');
    return ex;
  }

  async updateOrderStatus(id: string, status: OrderStatus, trackingNumber?: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('주문을 찾을 수 없습니다');

    // 취소/환불로 전환될 때 포인트·재고 원복 (한 번만).
    const wasReversed = [OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(order.status);
    const willReverse = [OrderStatus.CANCELLED, OrderStatus.REFUNDED].includes(status);
    if (willReverse && !wasReversed) {
      await this.reverseOrder(order);
    }

    const update: any = { status };
    if (trackingNumber) update.trackingNumber = trackingNumber;
    await this.orderRepo.update(id, update);
    return this.orderRepo.findOne({ where: { id }, relations: ['product'] });
  }

  async getAllOrders(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await this.orderRepo.findAndCount({
      where,
      relations: ['product', 'user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
