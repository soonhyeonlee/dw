'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function UsersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (keyword) qs.set('keyword', keyword);
      const res = await api(`/users/admin/list?${qs}`);
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleRoleChange = async (userId: string, role: string) => {
    if (!confirm(`이 사용자를 ${role === 'admin' ? '관리자' : '일반 유저'}로 변경하시겠습니까?`)) return;
    try {
      await api(`/users/admin/${userId}/role`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1 style={styles.title}>유저 관리</h1>

      <form onSubmit={handleSearch} style={styles.searchRow}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="이메일 또는 닉네임 검색"
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchBtn}>검색</button>
        <span style={styles.totalText}>총 {total}명</span>
      </form>

      {loading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>닉네임</th>
              <th style={styles.th}>이메일</th>
              <th style={styles.th}>권한</th>
              <th style={styles.th}>잔액</th>
              <th style={styles.th}>총 적립</th>
              <th style={styles.th}>가입일</th>
              <th style={styles.th}>관리</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  유저가 없습니다
                </td>
              </tr>
            ) : (
              items.map((user: any) => (
                <tr key={user.id}>
                  <td style={styles.td}>{user.nickname}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                      color: user.role === 'admin' ? '#1e40af' : '#374151',
                    }}>
                      {user.role === 'admin' ? '관리자' : '일반'}
                    </span>
                  </td>
                  <td style={styles.td}>{Number(user.cashbackBalance).toLocaleString()}원</td>
                  <td style={styles.td}>{Number(user.totalEarned).toLocaleString()}원</td>
                  <td style={styles.td}>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td style={styles.td}>
                    {user.role === 'admin' ? (
                      <button
                        onClick={() => handleRoleChange(user.id, 'user')}
                        style={styles.demoteBtn}
                      >
                        일반으로
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(user.id, 'admin')}
                        style={styles.promoteBtn}
                      >
                        관리자로
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {total > 20 && (
        <div style={styles.pagination}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={styles.pageBtn}>이전</button>
          <span style={styles.pageInfo}>{page} / {Math.ceil(total / 20)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} style={styles.pageBtn}>다음</button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: '24px', fontWeight: 800, marginBottom: '24px' },
  searchRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  searchInput: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', width: '280px' },
  searchBtn: { padding: '8px 16px', borderRadius: '8px', background: '#ff6b35', color: '#fff', fontSize: '14px', fontWeight: 600 },
  totalText: { fontSize: '14px', color: '#6b7280', marginLeft: '8px' },
  loading: { padding: '60px', textAlign: 'center', color: '#9ca3af' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' },
  td: { padding: '14px 16px', fontSize: '14px', borderBottom: '1px solid #f3f4f6' },
  badge: { display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 },
  promoteBtn: { padding: '6px 12px', borderRadius: '6px', background: '#dbeafe', color: '#1e40af', fontSize: '12px', fontWeight: 600 },
  demoteBtn: { padding: '6px 12px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b', fontSize: '12px', fontWeight: 600 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '20px' },
  pageBtn: { padding: '8px 16px', borderRadius: '8px', background: '#fff', border: '1px solid #e5e7eb', fontSize: '13px' },
  pageInfo: { fontSize: '14px', color: '#6b7280' },
};
