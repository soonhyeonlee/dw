'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Stats {
  pendingWithdrawals: number;
  pendingCashbacks: number;
  recentTransactions: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    pendingWithdrawals: 0,
    pendingCashbacks: 0,
    recentTransactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [withdrawals, cashbacks] = await Promise.all([
        api('/withdrawal/admin/list?status=requested&limit=5'),
        api('/cashback/admin/transactions?status=pending&limit=5'),
      ]);

      setStats({
        pendingWithdrawals: withdrawals.data?.total || 0,
        pendingCashbacks: cashbacks.data?.total || 0,
        recentTransactions: cashbacks.data?.items || [],
      });
    } catch {
      // 에러 무시
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>로딩 중...</div>;
  }

  return (
    <div>
      <h1 style={styles.title}>대시보드</h1>

      <div style={styles.cardGrid}>
        <div style={{ ...styles.card, borderLeft: '4px solid #f59e0b' }}>
          <div style={styles.cardLabel}>대기 중 출금 요청</div>
          <div style={styles.cardValue}>{stats.pendingWithdrawals}건</div>
          <a href="/dashboard/withdrawals" style={styles.cardLink}>
            관리하기 →
          </a>
        </div>
        <div style={{ ...styles.card, borderLeft: '4px solid #ff6b35' }}>
          <div style={styles.cardLabel}>대기 중 캐시백</div>
          <div style={styles.cardValue}>{stats.pendingCashbacks}건</div>
          <a href="/dashboard/cashback" style={styles.cardLink}>
            관리하기 →
          </a>
        </div>
      </div>

      {stats.recentTransactions.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>최근 대기 캐시백</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>플랫폼</th>
                <th style={styles.th}>주문금액</th>
                <th style={styles.th}>캐시백</th>
                <th style={styles.th}>상태</th>
                <th style={styles.th}>일시</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions.map((tx: any) => (
                <tr key={tx.id}>
                  <td style={styles.td}>{tx.platform}</td>
                  <td style={styles.td}>
                    {Number(tx.orderAmount).toLocaleString()}원
                  </td>
                  <td style={styles.td}>
                    {Number(tx.cashbackAmount).toLocaleString()}원
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{tx.status}</span>
                  </td>
                  <td style={styles.td}>
                    {new Date(tx.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: { padding: '60px', textAlign: 'center', color: '#9ca3af' },
  title: { fontSize: '24px', fontWeight: 800, marginBottom: '24px' },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  cardLabel: { fontSize: '13px', color: '#6b7280', marginBottom: '8px' },
  cardValue: { fontSize: '32px', fontWeight: 800, color: '#111827' },
  cardLink: {
    display: 'inline-block',
    marginTop: '12px',
    fontSize: '13px',
    color: '#ff6b35',
    fontWeight: 600,
  },
  section: { marginTop: '16px' },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '12px',
  },
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
    background: '#fef3c7',
    color: '#92400e',
  },
};
