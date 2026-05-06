'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: '대기중', bg: '#fef3c7', color: '#92400e' },
  confirmed: { label: '확정', bg: '#dbeafe', color: '#1e40af' },
  paid: { label: '지급완료', bg: '#d1fae5', color: '#065f46' },
  cancelled: { label: '취소', bg: '#fee2e2', color: '#991b1b' },
};

export default function CashbackPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) qs.set('status', statusFilter);
      const res = await api(`/cashback/admin/transactions?${qs}`);
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    if (!confirm('이 캐시백을 확정하시겠습니까?')) return;
    try {
      await api(`/cashback/admin/confirm/${id}`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('이 캐시백을 취소하시겠습니까?')) return;
    try {
      await api(`/cashback/admin/cancel/${id}`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1 style={styles.title}>캐시백 관리</h1>

      <div style={styles.filterRow}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={styles.select}
        >
          <option value="">전체 상태</option>
          <option value="pending">대기중</option>
          <option value="confirmed">확정</option>
          <option value="paid">지급완료</option>
          <option value="cancelled">취소</option>
        </select>
        <span style={styles.totalText}>총 {total}건</span>
      </div>

      {loading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>일시</th>
              <th style={styles.th}>플랫폼</th>
              <th style={styles.th}>주문금액</th>
              <th style={styles.th}>수수료</th>
              <th style={styles.th}>캐시백</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>처리</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  캐시백 내역이 없습니다
                </td>
              </tr>
            ) : (
              items.map((item: any) => {
                const status = STATUS_MAP[item.status] || { label: item.status, bg: '#f3f4f6', color: '#374151' };
                return (
                  <tr key={item.id}>
                    <td style={styles.td}>
                      {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td style={styles.td}>{item.platform}</td>
                    <td style={styles.td}>
                      {Number(item.orderAmount).toLocaleString()}원
                    </td>
                    <td style={styles.td}>
                      {Number(item.commissionAmount).toLocaleString()}원
                    </td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#ff6b35' }}>
                      {Number(item.cashbackAmount).toLocaleString()}원
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background: status.bg,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {item.status === 'pending' && (
                        <div style={styles.actionRow}>
                          <button
                            onClick={() => handleConfirm(item.id)}
                            style={styles.confirmBtn}
                          >
                            확정
                          </button>
                          <button
                            onClick={() => handleCancel(item.id)}
                            style={styles.cancelBtn}
                          >
                            취소
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}

      {total > 20 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={styles.pageBtn}
          >
            이전
          </button>
          <span style={styles.pageInfo}>
            {page} / {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
            style={styles.pageBtn}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: '24px', fontWeight: 800, marginBottom: '24px' },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
  },
  totalText: { fontSize: '14px', color: '#6b7280' },
  loading: { padding: '60px', textAlign: 'center', color: '#9ca3af' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    borderBottom: '1px solid #f3f4f6',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  actionRow: { display: 'flex', gap: '6px' },
  confirmBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    background: '#10b981',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
  },
  cancelBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '20px',
  },
  pageBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    fontSize: '13px',
  },
  pageInfo: { fontSize: '14px', color: '#6b7280' },
};
