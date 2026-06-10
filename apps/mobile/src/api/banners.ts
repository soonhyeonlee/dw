import { api } from './client';

export interface ApiBanner {
  id: string;
  placement: string; // 'home' | 'category'
  imageUrl?: string | null;
  badge?: string | null;
  title: string;
  subtitle?: string | null;
  align: string; // 'left' | 'right'
  isActive: boolean;
  sortOrder: number;
}

// 활성 배너만 정렬순으로. 실패 시 빈 배열(호출부에서 하드코딩 폴백).
export async function getBanners(placement: 'home' | 'category'): Promise<ApiBanner[]> {
  try {
    const res = await api<ApiBanner[]>(`/banners?placement=${placement}`);
    return res?.data || [];
  } catch {
    return [];
  }
}
