'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api('/settings');
      setSettings(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          minWithdrawalAmount: Number(settings.minWithdrawalAmount),
          defaultCashbackRate: Number(settings.defaultCashbackRate),
          maintenanceMode: settings.maintenanceMode,
        }),
      });
      setMessage('설정이 저장되었습니다');
    } catch (err: any) {
      setMessage(`오류: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>로딩 중...</div>;
  }

  if (!settings) {
    return <div style={styles.loading}>설정을 불러올 수 없습니다</div>;
  }

  return (
    <div>
      <h1 style={styles.title}>앱 설정</h1>

      <div style={styles.card}>
        <div style={styles.field}>
          <label style={styles.label}>최소 출금 금액 (원)</label>
          <input
            type="number"
            value={settings.minWithdrawalAmount}
            onChange={(e) =>
              setSettings({ ...settings, minWithdrawalAmount: e.target.value })
            }
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>기본 캐시백 비율 (%)</label>
          <input
            type="number"
            value={settings.defaultCashbackRate}
            onChange={(e) =>
              setSettings({ ...settings, defaultCashbackRate: e.target.value })
            }
            style={styles.input}
          />
          <span style={styles.hint}>
            플랫폼 수수료 중 사용자에게 돌려주는 비율
          </span>
        </div>

        <div style={styles.field}>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) =>
                setSettings({ ...settings, maintenanceMode: e.target.checked })
              }
            />
            <span>유지보수 모드</span>
          </label>
          <span style={styles.hint}>
            활성화하면 앱에서 서비스 이용이 제한됩니다
          </span>
        </div>

        {message && (
          <div
            style={{
              ...styles.message,
              background: message.startsWith('오류') ? '#fee2e2' : '#d1fae5',
              color: message.startsWith('오류') ? '#991b1b' : '#065f46',
            }}
          >
            {message}
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
          {saving ? '저장 중...' : '설정 저장'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: { padding: '60px', textAlign: 'center', color: '#9ca3af' },
  title: { fontSize: '24px', fontWeight: 800, marginBottom: '24px' },
  card: {
    background: '#fff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '560px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: 600, color: '#374151' },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '15px',
  },
  hint: { fontSize: '12px', color: '#9ca3af' },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
  },
  message: {
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
  },
  saveBtn: {
    padding: '14px',
    borderRadius: '8px',
    background: '#ff6b35',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
  },
};
