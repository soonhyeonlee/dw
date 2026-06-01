import { api, setToken, removeToken } from './client';

export async function login(email: string, password: string) {
  const res = await api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.data?.token) {
    await setToken(res.data.token);
  }
  return res.data;
}

export interface RegisterData {
  email: string;
  password: string;
  nickname: string;
  phone?: string;
  memberType?: 'association' | 'partner' | 'user';
  parentId?: string;
  associationName?: string;
  businessNumber?: string;
  businessName?: string;
  businessCategory?: string;
  businessAddress?: string;
}

export async function register(data: RegisterData) {
  const res = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.data?.token) {
    await setToken(res.data.token);
  }
  return res.data;
}

export async function getAssociations() {
  const res = await api('/users/associations');
  return res.data;
}

export async function getPartners(associationId?: string) {
  const url = associationId
    ? `/users/partners?associationId=${associationId}`
    : '/users/partners';
  const res = await api(url);
  return res.data;
}

export async function logout() {
  await removeToken();
}

export async function getProfile() {
  const res = await api('/users/me');
  return res.data;
}

export async function socialLogin(data: {
  provider: string;
  providerId: string;
  email: string;
  nickname: string;
  profileImage?: string;
}) {
  const res = await api('/auth/social', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.data?.token) {
    await setToken(res.data.token);
  }
  return res.data;
}

export async function ihomeLogin(data: {
  mbId: string;
  email: string;
  nickname: string;
  ts: string;
  sig: string;
}) {
  const res = await api('/auth/ihome', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.data?.token) {
    await setToken(res.data.token);
  }
  return res.data;
}

export async function updatePushToken(pushToken: string) {
  const res = await api('/auth/push-token', {
    method: 'POST',
    body: JSON.stringify({ pushToken }),
  });
  return res.data;
}
