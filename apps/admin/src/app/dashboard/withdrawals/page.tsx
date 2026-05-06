'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  requested: { label: '대기중', bg: '#fef3c7', color: '#92400e' },
  processing: { label: '처리중', bg: '#dbeafe', color: '#1e40af' },
  completed: { label: '완료', bg: '#d1fae5', color: '#065f46' },
  rejected: { label: '거절', bg: '#fee2e2', color: '#991b1b' },
};

export default function WithdrawalsPage() {
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
      const res = await api(`/withdrawal/admin/list?${qs}`);
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('이 출금 요청을 승인하시겠습니까?')) return;
    try {
      await api(`/withdrawal/admin/approve/${id}`, { method: 'POST' });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('거절 사유를 입력하세요:');
    if (!reason) return;
    try {
      await api(`/withdrawal/admin/reject/${id}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1 style={styles.title}>출금 관리</h1>

      <div style={styles.filterRow}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={styles.select}
        >
          <option value="">전체 상태</option>
          <option value="requested">대기중</option>
          <option value="processing">처리중</option>
          <option value="completed">완료</option>
          <option value="rejected">거절</option>
        </select>
        <span style={styles.totalText}>총 {total}건</span>
      </div>

      {loading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>요청일</th>
              <th style={styles.th}>금액</th>
              <th style={styles.th}>은행</th>
              <th style={styles.th}>계좌번호</th>
              <th style={styles.th}>예금주</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>처리</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  출금 요청이 없습니다
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
                    <td style={{ ...styles.td, fontWeight: 700 }}>
                      {Number(item.amount).toLocaleString()}원
                    </td>
                    <td style={styles.td}>{item.bankName}</td>
                    <td style={styles.td}>{item.accountNumber}</td>
                    <td style={styles.td}>{item.accountHolder}</td>
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
                      {item.status === 'requested' && (
                        <div style={styles.actionRow}>
                          <button
                            onClick={() => handleApprove(item.id)}
                            style={styles.approveBtn}
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(item.id)}
                            style={styles.rejectBtn}
                          >
                            거절
                          </button>
                        </div>
                      )}
                      {item.status === 'rejected' && (
                        <span style={{ fontSize: '12px', color: '#991b1b' }}>
                          {item.rejectionReason}
                        </span>
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
  approveBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    background: '#10b981',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
  },
  rejectBtn: {
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
