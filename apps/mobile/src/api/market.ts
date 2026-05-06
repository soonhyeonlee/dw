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
}) {
  const res = await api('/market/orders', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  return res.data;
}

export async function getMyOrders(page = 1) {
  const res = await api(`/market/orders?page=${page}`);
  return res.data;
}
