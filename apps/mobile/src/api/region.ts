import { api } from './client';

export interface Academy {
  id: string;
  name: string;
  category?: string;
  description?: string;
  address?: string;
  addressDetail?: string;
  region?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  googlePlaceId?: string | null;
  source?: 'manual' | 'google_maps';
  photos?: string[];
  tags?: string[];
  curriculum?: string;
  notice?: string;
  parking?: string;
  sns?: { kakao?: string; instagram?: string; facebook?: string; band?: string };
  /** Google Places opening_hours.weekday_text */
  businessHours?: string[];
  /** 홈페이지 */
  website?: string;
  /** 구글 실제 리뷰 (Place Details) */
  googleReviews?: {
    author: string;
    rating: number;
    text: string;
    relativeTime?: string;
    profilePhoto?: string;
  }[];
  /** 관련 유튜브 영상 (자동 수집) */
  videos?: { id: string; title: string; thumbnail: string; channel?: string }[];
  /** 어드민이 수동 등록한 유튜브 영상 (상세 '학원 정보' 최상단에 노출) */
  adminVideos?: { url: string; title?: string }[];
  rating: number;
  reviewCount: number;
  viewCount: number;
  momViewCount: number;
  heartCount: number;
  isActive?: boolean;
  /** /region/academies?lat=&lng= 호출 시에만 응답에 포함 */
  distanceKm?: number;
}

export interface AcademyReview {
  id: string;
  rating: number;
  content: string;
  photos?: string[];
  isMomCafe: boolean;
  createdAt: string;
  user: { id: string; nickname: string; profileImage?: string };
}

export interface Coupon {
  id: string;
  title: string;
  description?: string;
  couponType: string;
  value: string;
  totalQuantity: number;
  remainingQuantity: number;
  partnerName?: string;
  category?: string;
  expireAt: string;
}

export interface AcademyList {
  items: Academy[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAcademies(opts?: {
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
}): Promise<AcademyList> {
  const params = new URLSearchParams();
  if (opts?.region) params.set('region', opts.region);
  if (opts?.category) params.set('category', opts.category);
  if (opts?.keyword) params.set('keyword', opts.keyword);
  if (opts?.source) params.set('source', opts.source);
  if (opts?.sort) params.set('sort', opts.sort);
  if (opts?.lat != null) params.set('lat', String(opts.lat));
  if (opts?.lng != null) params.set('lng', String(opts.lng));
  if (opts?.radiusKm != null) params.set('radiusKm', String(opts.radiusKm));
  if (opts?.page) params.set('page', String(opts.page));
  if (opts?.limit) params.set('limit', String(opts.limit));
  const res = await api(`/region/academies?${params}`);
  return res.data;
}

export async function getAcademy(id: string): Promise<Academy> {
  const res = await api(`/region/academies/${id}`);
  return res.data;
}

export async function getReviews(academyId: string, page = 1) {
  const res = await api(`/region/academies/${academyId}/reviews?page=${page}`);
  return res.data;
}

export async function createReview(academyId: string, dto: { rating: number; content: string }) {
  const res = await api(`/region/academies/${academyId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return res.data;
}

export async function toggleHeart(academyId: string, increment: boolean) {
  const res = await api(`/region/academies/${academyId}/heart`, {
    method: 'POST',
    body: JSON.stringify({ increment }),
  });
  return res.data;
}

export async function getCoupons(opts?: { category?: string; page?: number }) {
  const params = new URLSearchParams();
  if (opts?.category) params.set('category', opts.category);
  if (opts?.page) params.set('page', String(opts.page));
  const res = await api(`/region/coupons?${params}`);
  return res.data;
}

export async function downloadCoupon(couponId: string) {
  const res = await api(`/region/coupons/${couponId}/download`, { method: 'POST' });
  return res.data;
}

export interface MyCoupon {
  id: string; // userCoupon id
  couponId: string;
  isUsed: boolean;
  usedAt?: string;
  downloadedAt: string;
  coupon: Coupon;
}

export async function getMyCoupons(): Promise<MyCoupon[]> {
  const res = await api('/region/my-coupons');
  return res.data;
}

export async function useCoupon(userCouponId: string) {
  const res = await api(`/region/my-coupons/${userCouponId}/use`, { method: 'POST' });
  return res.data;
}
