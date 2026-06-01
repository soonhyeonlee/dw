import { api } from './client';

export interface Product {
  id: string;
  platform: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl: string;
  productUrl: string;
  affiliateUrl: string;
  category: string;
  cashbackRate: number;
  cashbackAmount: number;
  rating?: number;
  reviewCount?: number;
}

export async function getProducts(params?: {
  platform?: string;
  category?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.platform) query.set('platform', params.platform);
  if (params?.category) query.set('category', params.category);
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const res = await api(`/products${qs ? `?${qs}` : ''}`);
  return res.data;
}

export interface ProductCategory {
  category: string;
  count: number;
}

/** 실제 활성 상품이 있는 카테고리만 (개수 포함). platform 미지정 시 전체. */
export async function getProductCategories(platform?: string): Promise<ProductCategory[]> {
  const qs = platform ? `?platform=${encodeURIComponent(platform)}` : '';
  const res = await api(`/products/categories${qs}`);
  return (res.data as ProductCategory[]) || [];
}

export async function getProduct(id: string) {
  const res = await api(`/products/${id}`);
  return res.data;
}

export async function clickProduct(id: string) {
  const res = await api(`/products/${id}/click`, { method: 'POST' });
  return res.data;
}

export async function toggleWishlist(id: string) {
  const res = await api(`/products/${id}/wishlist`, { method: 'POST' });
  return res.data;
}

export async function getWishlist(page = 1, limit = 20) {
  const res = await api(`/products/user/wishlist?page=${page}&limit=${limit}`);
  return res.data;
}

export async function getRecentlyViewed() {
  const res = await api('/products/user/recent');
  return res.data;
}

export async function toggleMallWishlist(mallId: string) {
  const res = await api(`/products/mall/${mallId}/wishlist`, { method: 'POST' });
  return res.data;
}

export async function getMallWishlist() {
  const res = await api('/products/user/mall-wishlist');
  return res.data;
}
