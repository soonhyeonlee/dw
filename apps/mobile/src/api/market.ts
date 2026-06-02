import { api } from './client';

export interface MarketProduct {
  id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl?: string;
  category?: string;
  origin?: string;
  producer?: string;
  deliveryInfo?: string;
  freeDelivery: boolean;
  stockQuantity: number;
  soldCount: number;
  limitQuantity?: number;
  rating: number;
  reviewCount: number;
  blockType?: string;
  saleEndAt?: string;
}

export interface Exhibition {
  id: string;
  title: string;
  subtitle?: string;
  bannerColor?: string;
  category?: string;
  products?: MarketProduct[];
}

export interface MarketHome {
  bannerProducts: MarketProduct[];
  twoColProducts: MarketProduct[];
  slideProducts: MarketProduct[];
  exhibitions: Exhibition[];
  recentProducts: MarketProduct[];
}

export async function getMarketHome(): Promise<MarketHome> {
  const res = await api('/market');
  return res.data;
}

export async function getMarketProduct(id: string): Promise<MarketProduct> {
  const res = await api(`/market/products/${id}`);
  return res.data;
}

export interface MarketCategory {
  category: string;
  count: number;
}

/** 활성 직접판매 상품이 있는 카테고리만(개수 포함) — 동적 칩 구성용. */
export async function getMarketCategories(): Promise<MarketCategory[]> {
  const res = await api('/market/categories');
  return (res.data as MarketCategory[]) || [];
}

export interface MarketProductList {
  items: MarketProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** 번개장터 직접판매 상품 평면 목록(선택 카테고리/키워드 검색, 페이지네이션). */
export async function getMarketProducts(params?: {
  category?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}): Promise<MarketProductList> {
  const q = new URLSearchParams();
  if (params?.category) q.set('category', params.category);
  if (params?.keyword) q.set('keyword', params.keyword);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  const res = await api(`/market/products${qs ? `?${qs}` : ''}`);
  return res.data;
}

export async function getExhibition(id: string): Promise<Exhibition & { products: MarketProduct[] }> {
  const res = await api(`/market/exhibitions/${id}`);
  return res.data;
}

export async function getMarketCategory(category: string, page = 1) {
  const res = await api(`/market/category/${encodeURIComponent(category)}?page=${page}`);
  return res.data;
}

export async function createOrder(dto: {
  productId: string;
  quantity: number;
  recipientName: string;
  recipientPhone: string;
  address: string;
  addressDetail?: string;
  zipCode: string;
  deliveryMemo?: string;
  usePoint?: number; // 번개장터 포인트 사용액 (번개장터 전용)
}) {
  const res = await api('/market/orders', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return res.data;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface MarketOrderItem {
  id: string;
  quantity: number;
  totalPrice: number;
  usedPoint: number;
  pointEarned: number;
  status: OrderStatus;
  recipientName?: string;
  trackingNumber?: string;
  createdAt: string;
  product?: MarketProduct;
}

export interface MarketOrderList {
  items: MarketOrderItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getMyOrders(page = 1): Promise<MarketOrderList> {
  const res = await api(`/market/orders?page=${page}`);
  return res.data;
}
