const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let token: string | null = null;

export function setToken(t: string) {
  token = t;
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', t);
  }
}

export function getToken(): string | null {
  if (token) return token;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('admin_token');
  }
  return token;
}

export function clearToken() {
  token = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
  }
}

export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; message?: string }> {
  const t = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (t) {
    headers['Authorization'] = `Bearer ${t}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || '요청에 실패했습니다');
  }
  return json;
}
