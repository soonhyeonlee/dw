'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api<{ token: string; user: { role: string } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.data?.user?.role !== 'admin') {
        setError('관리자 계정만 접근할 수 있습니다');
        return;
      }

      setToken(res.data.token);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>더블윈 관리자</h1>
        <p style={styles.subtitle}>관리자 계정으로 로그인하세요</p>

        {error && <div style={styles.error}>{error}</div>}

        <label style={styles.label}>이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />

        <label style={styles.label}>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          required
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f3f4f6',
  },
  form: {
    background: '#fff',
    padding: '48px',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#ff6b35',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '16px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '15px',
    outline: 'none',
  },
  button: {
    marginTop: '8px',
    padding: '14px',
    borderRadius: '8px',
    background: '#ff6b35',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 700,
    border: 'none',
  },
  error: {
    background: '#fef2f2',
    color: '#ef4444',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
  },
};
