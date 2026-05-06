import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Not } from 'typeorm';
import { MarketProduct, MarketBlockType } from './entities/market-product.entity';
import { Exhibition } from './entities/exhibition.entity';
import { MarketOrder, OrderStatus } from './entities/market-order.entity';

@Injectable()
export class MarketService {
  constructor(
    @InjectRepository(MarketProduct)
    private readonly productRepo: Repository<MarketProduct>,
    @InjectRepository(Exhibition)
    private readonly exhibitionRepo: Repository<Exhibition>,
    @InjectRepository(MarketOrder)
    private readonly orderRepo: Repository<MarketOrder>,
  ) {}

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
  }) {
    const product = await this.getProduct(dto.productId);

    if (product.limitQuantity && product.soldCount + dto.quantity > product.limitQuantity) {
      throw new BadRequestException('한정 수량이 초과되었습니다');
    }

    if (product.stockQuantity < dto.quantity) {
      throw new BadRequestException('재고가 부족합니다');
    }

    const totalPrice = Number(product.price) * dto.quantity;

    const { productId, quantity, ...shippingInfo } = dto;
    const order = this.orderRepo.create({
      userId,
      productId,
      quantity,
      totalPrice,
      ...shippingInfo,
    });

    const saved = await this.orderRepo.save(order);

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
