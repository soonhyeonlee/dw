import { api } from './client';

export type MallPromoBadge = 'time_deal' | 'rate_up' | 'welcome' | string;

export interface Mall {
  id: string;
  platform: string;
  name: string;
  iconUrl?: string;
  color: string;
  baseUrl: string;
  affiliateBaseUrl?: string;
  cashbackRate: number;
  appScheme?: string;
  description?: string;
  cashbackNote?: string;
  previousCashbackRate?: number | null;
  promoEndsAt?: string | null;
  promoBadge?: MallPromoBadge | null;
  category?: string | null;
}

export interface HomeBlock {
  id: string;
  blockType: 'mall_grid' | 'topic_products' | 'mall_products' | 'banner';
  title: string;
  subtitle?: string;
  config: any;
  products?: any[];
}

export interface HomeData {
  blocks: HomeBlock[];
  malls: Mall[];
}

export async function getHomeData(): Promise<HomeData> {
  const res = await api('/home');
  return res.data;
}

export async function getMalls(): Promise<Mall[]> {
  const res = await api('/malls');
  return res.data;
}

export async function getMallDetail(platform: string): Promise<Mall> {
  const res = await api(`/malls/${platform}`);
  return res.data;
}
