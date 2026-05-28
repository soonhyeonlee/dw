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
  photos?: string[];
  tags?: string[];
  curriculum?: string;
  notice?: string;
  parking?: string;
  sns?: { kakao?: string; instagram?: string; facebook?: string; band?: string };
  rating: number;
  reviewCount: number;
  viewCount: number;
  momViewCount: number;
  heartCount: number;
  isActive?: boolean;
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

export async function getAcademies(opts?: { region?: string; category?: string; keyword?: string; page?: number }) {
  const params = new URLSearchParams();
  if (opts?.region) params.set('region', opts.region);
  if (opts?.category) params.set('category', opts.category);
  if (opts?.keyword) params.set('keyword', opts.keyword);
  if (opts?.page) params.set('page', String(opts.page));
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

export async function getMyCoupons() {
  const res = await api('/region/my-coupons');
  return res.data;
}
