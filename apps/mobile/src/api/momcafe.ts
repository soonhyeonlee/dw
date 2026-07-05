import { api } from './client';

export interface MomCafe {
  name: string;
  desc: string;
  url: string;
  region: string;
}

export interface MomCafeData {
  items: MomCafe[];
}

export async function getMomCafes(params?: {
  region?: string;
  q?: string;
  limit?: number;
}): Promise<MomCafeData> {
  const query = new URLSearchParams();
  if (params?.region) query.set('region', params.region);
  if (params?.q) query.set('q', params.q);
  query.set('limit', String(params?.limit || 2));

  const qs = query.toString();
  const res = await api<MomCafeData>(`/momcafes${qs ? `?${qs}` : ''}`);
  return res.data || { items: [] };
}
