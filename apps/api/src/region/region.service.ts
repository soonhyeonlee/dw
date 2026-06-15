import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Academy } from './entities/academy.entity';
import { AcademyReview } from './entities/academy-review.entity';
import { Coupon } from './entities/coupon.entity';
import { UserCoupon } from './entities/user-coupon.entity';

// 세분 카테고리 → 업체명에 포함될 키워드. Google Places 로 수집된 학원은 category 가
// 'academy'/'gym' 등 넓게만 들어와 있어, 이름 기반으로 세부 종목/과목을 구분한다.
// (예: "○○주짓수아카데미" → 주짓수, "○○영어학원" → 영어)
export const ACADEMY_CATEGORY_KEYWORDS: Record<string, string[]> = {
  // 격투/무술
  복싱: ['복싱', 'boxing'],
  킥복싱: ['킥복싱', 'kickboxing'],
  주짓수: ['주짓수', '브라질리언', 'jiujitsu', 'bjj'],
  MMA: ['mma', '종합격투', '이종격투'],
  합기도: ['합기도'],
  유도: ['유도'],
  태권도: ['태권도'],
  검도: ['검도'],
  // 헬스/피트니스
  헬스클럽: ['헬스', '피트니스', 'fitness', 'gym'],
  크로스핏: ['크로스핏', 'crossfit'],
  PT샵: ['pt', '퍼스널', 'personal'],
  필라테스: ['필라테스', 'pilates'],
  요가: ['요가', 'yoga'],
  수영: ['수영', '스위밍', 'swim'],
  골프: ['골프', 'golf'],
  // 교과
  영어: ['영어', 'english', '잉글리시'],
  수학: ['수학', 'math'],
  논술: ['논술', '국어'],
  과학: ['과학'],
  코딩: ['코딩', '소프트웨어', 'sw', '로봇'],
  // 예체능
  피아노: ['피아노', 'piano'],
  미술: ['미술', '아트', 'art'],
  음악: ['음악', '실용음악'],
  무용: ['무용', '발레', '댄스', 'dance'],
  // 유아
  어린이집: ['어린이집'],
  유치원: ['유치원', '유아'],
};

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
  private readonly logger = new Logger(RegionService.name);

  constructor(
    @InjectRepository(Academy)
    private readonly academyRepo: Repository<Academy>,
    @InjectRepository(AcademyReview)
    private readonly reviewRepo: Repository<AcademyReview>,
    @InjectRepository(Coupon)
    private readonly couponRepo: Repository<Coupon>,
    @InjectRepository(UserCoupon)
    private readonly userCouponRepo: Repository<UserCoupon>,
    private readonly config: ConfigService,
  ) {}

  private get placesKey(): string {
    return this.config.get<string>('GOOGLE_PLACES_API_KEY', '');
  }
  private get youtubeKey(): string {
    return this.config.get<string>('YOUTUBE_API_KEY', '');
  }
  private get publicApiUrl(): string {
    // 사진 프록시 절대 URL 생성용 (모바일이 직접 접근). 끝 슬래시 제거.
    return this.config.get<string>('PUBLIC_API_URL', 'https://api-dev.sumbodyweb.com').replace(/\/+$/, '');
  }

  // === 학원 ===

  async getAcademies(opts: {
    region?: string;
    category?: string;
    keyword?: string;
    source?: 'manual' | 'google_maps';
    sort?: 'popular' | 'rating' | 'review' | 'distance';
    lat?: number;
    lng?: number;
    radiusKm?: number;
    page?: number;
    limit?: number;
  }) {
    const { region, category, keyword, source, sort = 'popular', lat, lng, radiusKm, page = 1, limit = 20 } = opts;
    const qb = this.academyRepo.createQueryBuilder('a').where('a.isActive = :active', { active: true });

    if (region) qb.andWhere('a.region = :region', { region });
    if (category) {
      // 세분 카테고리는 이름 키워드 OR 매칭, 그 외(어린이집/유치원 등 큰 분류)는 category 컬럼 일치.
      const keywords = ACADEMY_CATEGORY_KEYWORDS[category];
      if (keywords?.length) {
        const ors = keywords
          .map((_, i) => `LOWER(a.name) LIKE LOWER(:catkw${i})`)
          .join(' OR ');
        const params: Record<string, string> = {};
        keywords.forEach((k, i) => (params[`catkw${i}`] = `%${k}%`));
        qb.andWhere(`(${ors})`, params);
      } else {
        qb.andWhere('a.category = :category', { category });
      }
    }
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

    // 정렬: 거리순은 좌표가 없으면 의미가 없어 인기순으로 폴백.
    if (sort === 'rating') {
      qb.orderBy('a.rating', 'DESC').addOrderBy('a.reviewCount', 'DESC');
    } else if (sort === 'review') {
      qb.orderBy('a.reviewCount', 'DESC').addOrderBy('a.rating', 'DESC');
    } else {
      qb.orderBy('a.heartCount', 'DESC').addOrderBy('a.rating', 'DESC').addOrderBy('a.viewCount', 'DESC');
    }
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAcademy(id: string) {
    const academy = await this.academyRepo.findOne({ where: { id } });
    if (!academy) throw new NotFoundException('학원 정보를 찾을 수 없습니다');

    // 조회수 증가
    await this.academyRepo.increment({ id }, 'viewCount', 1);

    // 최초 진입 시 Google Places + YouTube 로 사진/내용/영상 1회 보강 (캐시)
    if (this.shouldEnrich(academy)) {
      try {
        await this.enrichAcademy(academy);
        const fresh = await this.academyRepo.findOne({ where: { id } });
        if (fresh) return fresh;
      } catch (e) {
        this.logger.warn(`학원 보강 실패 (${academy.name}): ${(e as Error).message}`);
      }
    }

    return academy;
  }

  // === Google Places / YouTube 보강 ===

  private shouldEnrich(a: Academy): boolean {
    return !!a.googlePlaceId && !a.enrichedAt && !!this.placesKey;
  }

  /**
   * Google Place Details 1회 호출로 사진/전화/영업시간/웹사이트/구글리뷰를 채우고,
   * YouTube 검색으로 관련 영상을 채워 DB 에 캐시한다. enrichedAt 로 1회만 수행.
   */
  async enrichAcademy(a: Academy): Promise<void> {
    const fields = [
      'photos',
      'formatted_phone_number',
      'international_phone_number',
      'opening_hours',
      'website',
      'editorial_summary',
      'reviews',
      'rating',
      'user_ratings_total',
    ].join(',');
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(a.googlePlaceId!)}` +
      `&fields=${fields}&language=ko&reviews_sort=most_relevant&key=${this.placesKey}`;

    const res = await fetch(url);
    const json: any = await res.json();
    if (json.status !== 'OK') {
      throw new Error(`Place Details ${json.status}: ${json.error_message || ''}`);
    }
    const d = json.result || {};

    const patch: Partial<Academy> = { enrichedAt: new Date() };

    // 사진: photo_reference 최대 5장 저장 + 프록시 URL 생성
    const refs: string[] = (d.photos || [])
      .map((p: any) => p.photo_reference)
      .filter(Boolean)
      .slice(0, 5);
    if (refs.length) {
      patch.photoRefs = refs;
      patch.photos = refs.map((_, i) => `${this.publicApiUrl}/region/academies/${a.id}/photo/${i}`);
    }

    // 전화 (기존 값 없을 때만 채움)
    if (!a.phone && (d.formatted_phone_number || d.international_phone_number)) {
      patch.phone = d.formatted_phone_number || d.international_phone_number;
    }

    // 영업시간
    if (d.opening_hours?.weekday_text?.length) {
      patch.businessHours = d.opening_hours.weekday_text;
    }

    // 웹사이트
    if (d.website) patch.website = String(d.website).slice(0, 500);

    // 소개 (구글 editorial summary)
    if (!a.description && d.editorial_summary?.overview) {
      patch.description = d.editorial_summary.overview;
    }

    // 구글 실제 리뷰 (최대 5)
    if (Array.isArray(d.reviews) && d.reviews.length) {
      patch.googleReviews = d.reviews.slice(0, 5).map((r: any) => ({
        author: r.author_name || '구글 사용자',
        rating: Number(r.rating) || 0,
        text: r.text || '',
        relativeTime: r.relative_time_description || '',
        profilePhoto: r.profile_photo_url || '',
      }));
    }

    // 평점/리뷰수 갱신 (구글 기준, 자체 리뷰 없을 때 신뢰값)
    if (d.rating != null && (!a.rating || Number(a.rating) === 0)) {
      patch.rating = Number(d.rating);
    }
    if (d.user_ratings_total != null && (!a.reviewCount || a.reviewCount === 0)) {
      patch.reviewCount = Number(d.user_ratings_total);
    }

    // 관련 유튜브 영상
    try {
      const videos = await this.searchYoutube(`${a.name} ${a.category || ''} 학원`.trim());
      if (videos.length) patch.videos = videos;
    } catch (e) {
      this.logger.warn(`YouTube 검색 실패 (${a.name}): ${(e as Error).message}`);
    }

    await this.academyRepo.update(a.id, patch as any);
  }

  /** YouTube Data API v3 검색 → 영상 메타 목록 (키 없으면 빈 배열) */
  async searchYoutube(query: string): Promise<Academy['videos']> {
    if (!this.youtubeKey) return [];
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&type=video&maxResults=6&order=relevance&regionCode=KR&relevanceLanguage=ko` +
      `&q=${encodeURIComponent(query)}&key=${this.youtubeKey}`;
    const res = await fetch(url);
    const json: any = await res.json();
    if (!Array.isArray(json.items)) return [];
    return json.items
      .filter((it: any) => it.id?.videoId)
      .map((it: any) => ({
        id: it.id.videoId,
        title: it.snippet?.title || '',
        thumbnail: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || '',
        channel: it.snippet?.channelTitle || '',
      }));
  }

  /**
   * 사진 프록시: photo_reference → Google Place Photo API(IP 제한 키, EC2 서버에서만 호출) →
   * 302 location(googleusercontent, 키 불필요)을 반환. 클라이언트는 그 URL 로 이미지를 직접 로드.
   */
  async resolvePhotoUrl(id: string, idx: number, maxWidth = 800): Promise<string | null> {
    if (!this.placesKey) return null;
    const a = await this.academyRepo.findOne({ where: { id }, select: ['id', 'photoRefs'] });
    const ref = a?.photoRefs?.[idx];
    if (!ref) return null;
    const w = Math.min(Math.max(Number(maxWidth) || 800, 100), 1600);
    const url =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=${w}&photo_reference=${encodeURIComponent(ref)}&key=${this.placesKey}`;
    const res = await fetch(url, { redirect: 'manual' });
    const location = res.headers.get('location');
    return location || null;
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
