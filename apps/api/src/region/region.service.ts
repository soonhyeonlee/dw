import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Academy } from './entities/academy.entity';
import { AcademyReview } from './entities/academy-review.entity';
import { Coupon } from './entities/coupon.entity';
import { UserCoupon } from './entities/user-coupon.entity';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

@Injectable()
export class RegionService {
  constructor(
    @InjectRepository(Academy)
    private readonly academyRepo: Repository<Academy>,
    @InjectRepository(AcademyReview)
    private readonly reviewRepo: Repository<AcademyReview>,
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
    @InjectRepository(UserCoupon)
    private readonly userCouponRepo: Repository<UserCoupon>,
  ) {}

  // === 학원 ===

  async getAcademies(opts: {
    region?: string;
    category?: string;
    keyword?: string;
    source?: 'manual' | 'google_maps';
    lat?: number;
    lng?: number;
    radiusKm?: number;
    page?: number;
    limit?: number;
  }) {
    const { region, category, keyword, source, lat, lng, radiusKm, page = 1, limit = 20 } = opts;
    const qb = this.academyRepo.createQueryBuilder('a').where('a.isActive = :active', { active: true });

    if (region) qb.andWhere('a.region = :region', { region });
    if (category) qb.andWhere('a.category = :category', { category });
    if (source) qb.andWhere('a.source = :source', { source });
    if (keyword) {
      qb.andWhere('(LOWER(a.name) LIKE LOWER(:kw) OR LOWER(a.address) LIKE LOWER(:kw))', { kw: `%${keyword}%` });
    }

    const hasGeo = lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng);

    if (hasGeo) {
      // Bounding-box 사전 필터(DB 종속성 없음). 위도 1도 ≈ 111km, 경도 1도 ≈ 111*cos(lat) km.
      const radius = radiusKm != null && Number.isFinite(radiusKm) && radiusKm > 0 ? radiusKm : 10;
      const latDelta = radius / 111;
      const lngDelta = radius / (111 * Math.cos((lat! * Math.PI) / 180) || 1);
      qb.andWhere('a.latitude IS NOT NULL AND a.longitude IS NOT NULL');
      qb.andWhere('a.latitude BETWEEN :latMin AND :latMax', {
        latMin: lat! - latDelta,
        latMax: lat! + latDelta,
      });
      qb.andWhere('a.longitude BETWEEN :lngMin AND :lngMax', {
        lngMin: lng! - lngDelta,
        lngMax: lng! + lngDelta,
      });

      // 박스 내 후보 전부 가져온 뒤 Haversine 정확 거리로 재정렬·페이지네이션.
      const candidates = await qb.getMany();
      const withDist = candidates
        .map((a) => ({ ...a, distanceKm: haversineKm(lat!, lng!, Number(a.latitude), Number(a.longitude)) }))
        .filter((a) => a.distanceKm <= radius)
        .sort((x, y) => x.distanceKm - y.distanceKm);

      const total = withDist.length;
      const items = withDist.slice((page - 1) * limit, page * limit);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    qb.orderBy('a.rating', 'DESC').addOrderBy('a.heartCount', 'DESC');
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAcademy(id: string) {
    const academy = await this.academyRepo.findOne({ where: { id } });
    if (!academy) throw new NotFoundException('학원 정보를 찾을 수 없습니다');

    // 조회수 증가
    await this.academyRepo.increment({ id }, 'viewCount', 1);

    return academy;
  }

  async toggleHeart(academyId: string, increment: boolean) {
    if (increment) {
      await this.academyRepo.increment({ id: academyId }, 'heartCount', 1);
    } else {
      await this.academyRepo.decrement({ id: academyId }, 'heartCount', 1);
    }
  }

  // === 리뷰 ===

  async getReviews(academyId: string, page = 1, limit = 20) {
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { academyId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((r) => ({
        ...r,
        user: { id: r.user.id, nickname: r.user.nickname, profileImage: r.user.profileImage },
      })),
      total,
      page,
      limit,
    };
  }

  async createReview(userId: string, dto: { academyId: string; rating: number; content: string; photos?: string[]; isMomCafe?: boolean }) {
    const review = this.reviewRepo.create({ ...dto, userId });
    const saved = await this.reviewRepo.save(review);

    // 평균 별점 업데이트
    const { avg } = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .where('r.academyId = :id', { id: dto.academyId })
      .getRawOne();

    await this.academyRepo.update(dto.academyId, {
      rating: parseFloat(avg).toFixed(1) as any,
      reviewCount: () => '"reviewCount" + 1',
    } as any);

    return saved;
  }

  // === 쿠폰 ===

  async getCoupons(opts: { category?: string; page?: number; limit?: number }) {
    const { category, page = 1, limit = 20 } = opts;
    const now = new Date();

    const qb = this.couponRepo.createQueryBuilder('c')
      .where('c.isActive = :active', { active: true })
      .andWhere('c.expireAt > :now', { now })
      .andWhere('c.remainingQuantity > 0');

    if (category) qb.andWhere('c.category = :category', { category });

    const [items, total] = await qb
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async downloadCoupon(userId: string, couponId: string) {
    const coupon = await this.couponRepo.findOne({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('쿠폰을 찾을 수 없습니다');
    if (coupon.remainingQuantity <= 0) throw new BadRequestException('쿠폰이 모두 소진되었습니다');

    const existing = await this.userCouponRepo.findOne({ where: { userId, couponId } });
    if (existing) throw new ConflictException('이미 다운로드한 쿠폰입니다');

    const userCoupon = this.userCouponRepo.create({ userId, couponId });
    await this.userCouponRepo.save(userCoupon);

    await this.couponRepo.decrement({ id: couponId }, 'remainingQuantity', 1);

    return userCoupon;
  }

  async getMyCoupons(userId: string) {
    return this.userCouponRepo.find({
      where: { userId },
      relations: ['coupon'],
      order: { downloadedAt: 'DESC' },
    });
  }

  async useCoupon(userId: string, userCouponId: string) {
    const uc = await this.userCouponRepo.findOne({ where: { id: userCouponId, userId } });
    if (!uc) throw new NotFoundException('쿠폰을 찾을 수 없습니다');
    if (uc.isUsed) throw new BadRequestException('이미 사용된 쿠폰입니다');

    uc.isUsed = true;
    uc.usedAt = new Date();
    return this.userCouponRepo.save(uc);
  }

  // === 파트너용: 학원/쿠폰 등록 ===

  async createAcademy(partnerId: string, data: Partial<Academy>): Promise<Academy> {
    const academy = this.academyRepo.create({ ...data, partnerId });
    return this.academyRepo.save(academy);
  }

  async updateAcademy(id: string, partnerId: string, data: Partial<Academy>): Promise<Academy> {
    const academy = await this.academyRepo.findOne({ where: { id, partnerId } });
    if (!academy) throw new NotFoundException('학원 정보를 찾을 수 없습니다');
    await this.academyRepo.update(id, data);
    return this.academyRepo.findOne({ where: { id } }) as Promise<Academy>;
  }

  async createCoupon(partnerId: string, partnerName: string, data: Partial<Coupon>): Promise<Coupon> {
    const serialNumber = `CP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const coupon = this.couponRepo.create({
      ...data,
      partnerId,
      partnerName,
      serialNumber,
      remainingQuantity: data.totalQuantity || 0,
    });
    return this.couponRepo.save(coupon);
  }

  // === 어드민 CRUD: 학원 ===

  async adminListAcademies(query: {
    region?: string;
    category?: string;
    keyword?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { region, category, keyword, isActive, page = 1, limit = 50 } = query;
    const qb = this.academyRepo.createQueryBuilder('a');
    if (region) qb.andWhere('a.region = :region', { region });
    if (category) qb.andWhere('a.category = :category', { category });
    if (keyword) {
      qb.andWhere('(LOWER(a.name) LIKE LOWER(:kw) OR LOWER(a.address) LIKE LOWER(:kw))', { kw: `%${keyword}%` });
    }
    if (typeof isActive === 'boolean') qb.andWhere('a.isActive = :isActive', { isActive });
    const [items, total] = await qb
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminCreateAcademy(data: Partial<Academy>): Promise<Academy> {
    const academy = this.academyRepo.create(data);
    return this.academyRepo.save(academy);
  }

  async adminUpdateAcademy(id: string, data: Partial<Academy>): Promise<Academy> {
    const academy = await this.academyRepo.findOne({ where: { id } });
    if (!academy) throw new NotFoundException('학원 정보를 찾을 수 없습니다');
    const { id: _i, createdAt: _c, updatedAt: _u, ...patch } = data as any;
    await this.academyRepo.update(id, patch);
    return this.academyRepo.findOne({ where: { id } }) as Promise<Academy>;
  }

  async adminRemoveAcademy(id: string): Promise<void> {
    const academy = await this.academyRepo.findOne({ where: { id } });
    if (!academy) throw new NotFoundException('학원 정보를 찾을 수 없습니다');
    await this.academyRepo.delete(id);
  }

  // === 어드민 CRUD: 쿠폰 ===

  async adminListCoupons(query: {
    category?: string;
    keyword?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { category, keyword, isActive, page = 1, limit = 50 } = query;
    const qb = this.couponRepo.createQueryBuilder('c');
    if (category) qb.andWhere('c.category = :category', { category });
    if (keyword) qb.andWhere('LOWER(c.title) LIKE LOWER(:kw)', { kw: `%${keyword}%` });
    if (typeof isActive === 'boolean') qb.andWhere('c.isActive = :isActive', { isActive });
    const [items, total] = await qb
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminCreateCoupon(adminId: string, data: Partial<Coupon>): Promise<Coupon> {
    const serialNumber = `CP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const total = Number(data.totalQuantity) || 0;
    const coupon = this.couponRepo.create({
      ...data,
      partnerId: data.partnerId || adminId,
      serialNumber,
      totalQuantity: total,
      remainingQuantity: total,
    });
    return this.couponRepo.save(coupon);
  }

  async adminUpdateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon> {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('쿠폰을 찾을 수 없습니다');
    const { id: _i, serialNumber: _s, createdAt: _c, updatedAt: _u, ...patch } = data as any;
    await this.couponRepo.update(id, patch);
    return this.couponRepo.findOne({ where: { id } }) as Promise<Coupon>;
  }

  async adminRemoveCoupon(id: string): Promise<void> {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('쿠폰을 찾을 수 없습니다');
    await this.couponRepo.delete(id);
  }
}
