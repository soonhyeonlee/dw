'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Mall {
  id: string;
  platform: string;
  name: string;
  iconUrl?: string;
  color?: string;
  baseUrl: string;
  affiliateBaseUrl?: string;
  cashbackRate: number;
  previousCashbackRate?: number;
  appScheme?: string;
  sortOrder: number;
  isActive: boolean;
  description?: string;
  cashbackNote?: string;
  promoBadge?: string;
  category?: string;
}

// 앱 그리드(인기 상향 캐시백)에서 인식하는 배지 값과 동기.
const PROMO_BADGES = [
  { value: '', label: '없음' },
  { value: 'rate_up', label: '상향' },
  { value: 'time_deal', label: '타임특가' },
  { value: 'welcome', label: '웰컴' },
];

// mall.entity.ts category 주석과 동기.
const CATEGORIES = [
  '종합쇼핑',
  '패션',
  '뷰티',
  '식품·생필품',
  '가전·디지털',
  '여행·예약',
  '도서',
  '홈·인테리어',
  '유아동',
];

const emptyForm = {
  platform: '',
  name: '',
  category: '종합쇼핑',
  iconUrl: '',
  color: '',
  baseUrl: '',
  affiliateBaseUrl: '',
  cashbackRate: '5',
  previousCashbackRate: '',
  appScheme: '',
  sortOrder: '0',
  cashbackNote: '',
  description: '',
  promoBadge: '',
  isActive: true,
};

export default function MallsPage() {
  const [items, setItems] = useState<Mall[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Mall | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api('/admin/malls');
      setItems(res.data || []);
    } catch (e: any) {
      alert(e.message || '쇼핑몰 목록을 불러올 수 없습니다');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (m: Mall) => {
    setEditing(m);
    setForm({
      platform: m.platform,
      name: m.name,
      category: m.category || '종합쇼핑',
      iconUrl: m.iconUrl || '',
      color: m.color || '',
      baseUrl: m.baseUrl,
      affiliateBaseUrl: m.affiliateBaseUrl || '',
      cashbackRate: String(m.cashbackRate ?? '0'),
      previousCashbackRate: m.previousCashbackRate != null ? String(m.previousCashbackRate) : '',
      appScheme: m.appScheme || '',
      sortOrder: String(m.sortOrder ?? '0'),
      cashbackNote: m.cashbackNote || '',
      description: m.description || '',
      promoBadge: m.promoBadge || '',
      isActive: m.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.platform.trim() || !form.name.trim() || !form.baseUrl.trim()) {
      alert('플랫폼 ID, 이름, 기본 URL은 필수입니다');
      return;
    }
    const payload: any = {
      platform: form.platform.trim(),
      name: form.name.trim(),
      category: form.category,
      iconUrl: form.iconUrl.trim() || undefined,
      color: form.color.trim() || undefined,
      baseUrl: form.baseUrl.trim(),
      affiliateBaseUrl: form.affiliateBaseUrl.trim() || undefined,
      cashbackRate: Number(form.cashbackRate) || 0,
      previousCashbackRate: form.previousCashbackRate ? Number(form.previousCashbackRate) : null,
      appScheme: form.appScheme.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      cashbackNote: form.cashbackNote.trim() || undefined,
      description: form.description.trim() || undefined,
      promoBadge: form.promoBadge || null,
      isActive: form.isActive,
    };

    setSubmitting(true);
    try {
      if (editing) {
        await api(`/admin/malls/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/admin/malls', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      alert(e.message || '저장 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (m: Mall) => {
    try {
      await api(`/admin/malls/${m.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !m.isActive }),
      });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const badgeLabel = (v?: string) => PROMO_BADGES.find((b) => b.value === (v || ''))?.label || '없음';

  return (
    <div>
      <div style={styles.head}>
        <div>
          <h1 style={styles.title}>쇼핑몰 관리</h1>
          <p style={styles.sub}>
            여기서 등록한 쇼핑몰이 앱 홈 <b>쇼핑 → 인기 상향 캐시백</b> 그리드에 노출됩니다.
            API 연동 전이라도 제휴 링크(affiliate)와 캐시백률만 입력하면 바로 보입니다.
          </p>
        </div>
        <button style={styles.addBtn} onClick={openCreate}>+ 쇼핑몰 추가</button>
      </div>

      {loading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>로고</th>
              <th style={styles.th}>이름 / 플랫폼</th>
              <th style={styles.th}>카테고리</th>
              <th style={styles.th}>캐시백</th>
              <th style={styles.th}>배지</th>
              <th style={styles.th}>제휴 링크</th>
              <th style={styles.th}>순서</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>관리</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  등록된 쇼핑몰이 없습니다. 우측 상단 "+ 쇼핑몰 추가"로 첫 쇼핑몰을 등록해보세요.
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.id}>
                  <td style={styles.td}>
                    {m.iconUrl ? (
                      <img src={m.iconUrl} alt="" style={styles.thumb} />
                    ) : (
                      <div style={{ ...styles.thumbMissing, background: m.color || '#f3f4f6' }}>
                        {m.name?.[0] || '?'}
                      </div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.nameCell}>{m.name}</div>
                    <span style={styles.platformBadge}>{m.platform}</span>
                  </td>
                  <td style={styles.td}>{m.category || '-'}</td>
                  <td style={styles.td}>
                    <b>{Number(m.cashbackRate)}%</b>
                    {m.previousCashbackRate != null ? (
                      <span style={styles.prev}>{Number(m.previousCashbackRate)}%</span>
                    ) : null}
                  </td>
                  <td style={styles.td}>{badgeLabel(m.promoBadge)}</td>
                  <td style={styles.td}>
                    {m.affiliateBaseUrl ? (
                      <span style={styles.linkOk}>● 등록됨</span>
                    ) : (
                      <span style={styles.linkNo}>미등록</span>
                    )}
                  </td>
                  <td style={styles.td}>{m.sortOrder}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleToggleActive(m)}
                      style={m.isActive ? styles.activeBadge : styles.inactiveBadge}
                    >
                      {m.isActive ? '노출' : '숨김'}
                    </button>
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => openEdit(m)} style={styles.editBtn}>수정</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={styles.modalBackdrop} onClick={() => !submitting && setShowModal(false)}>
          <form onSubmit={handleSubmit} style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editing ? '쇼핑몰 수정' : '쇼핑몰 추가'}</h2>

            <div style={styles.row}>
              <Field label="플랫폼 ID (영문, 고유)" required>
                <input
                  type="text"
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  style={styles.input}
                  placeholder="예: coupang"
                  disabled={!!editing}
                />
              </Field>
              <Field label="표시 이름" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={styles.input}
                  placeholder="예: 쿠팡"
                />
              </Field>
            </div>

            <div style={styles.row}>
              <Field label="카테고리">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={styles.input}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="프로모션 배지">
                <select value={form.promoBadge} onChange={(e) => setForm({ ...form, promoBadge: e.target.value })} style={styles.input}>
                  {PROMO_BADGES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </Field>
            </div>

            <Field label="기본 URL (쇼핑몰 주소)" required>
              <input type="url" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} style={styles.input} placeholder="https://www.coupang.com" />
            </Field>

            <Field label="제휴 링크 베이스 URL (선택, API 연동 전 수동 링크)">
              <input type="url" value={form.affiliateBaseUrl} onChange={(e) => setForm({ ...form, affiliateBaseUrl: e.target.value })} style={styles.input} placeholder="https://link.coupang.com/a/..." />
            </Field>

            <Field label="로고 이미지 URL (선택)">
              <input type="url" value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} style={styles.input} placeholder="https://..." />
              {form.iconUrl ? <img src={form.iconUrl} alt="" style={styles.preview} /> : null}
            </Field>

            <div style={styles.row}>
              <Field label="캐시백률 %" required>
                <input type="number" step="0.1" value={form.cashbackRate} onChange={(e) => setForm({ ...form, cashbackRate: e.target.value })} style={styles.input} />
              </Field>
              <Field label="이전 캐시백률 % (선택, 취소선)">
                <input type="number" step="0.1" value={form.previousCashbackRate} onChange={(e) => setForm({ ...form, previousCashbackRate: e.target.value })} style={styles.input} />
              </Field>
              <Field label="노출 순서">
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} style={styles.input} />
              </Field>
            </div>

            <div style={styles.row}>
              <Field label="브랜드 컬러 (선택)">
                <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={styles.input} placeholder="#E4002B" />
              </Field>
              <Field label="앱 딥링크 스킴 (선택)">
                <input type="text" value={form.appScheme} onChange={(e) => setForm({ ...form, appScheme: e.target.value })} style={styles.input} placeholder="coupang://" />
              </Field>
            </div>

            <Field label="캐시백 안내 문구 (선택)">
              <input type="text" value={form.cashbackNote} onChange={(e) => setForm({ ...form, cashbackNote: e.target.value })} style={styles.input} placeholder="구매 확정 후 적립" />
            </Field>

            <Field label="설명 (선택)">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...styles.input, minHeight: 60 }} />
            </Field>

            <label style={styles.checkRow}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span>앱에 노출 (인기 상향 캐시백 그리드)</span>
            </label>

            <div style={styles.modalActions}>
              <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn} disabled={submitting}>취소</button>
              <button type="submit" style={styles.submitBtn} disabled={submitting}>
                {submitting ? '저장 중...' : (editing ? '수정' : '등록')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>
        {label}
        {required ? <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span> : null}
      </span>
      {children}
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: 24 },
  title: { fontSize: '24px', fontWeight: 800 },
  sub: { fontSize: '13px', color: '#6b7280', marginTop: '6px', maxWidth: 640, lineHeight: 1.5 },
  addBtn: { padding: '10px 20px', borderRadius: '8px', background: '#ff6b35', color: '#fff', fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap' },
  loading: { padding: '60px', textAlign: 'center', color: '#9ca3af' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' },
  td: { padding: '12px 16px', fontSize: '14px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' },
  thumb: { width: 44, height: 44, objectFit: 'cover', borderRadius: 10, background: '#f3f4f6' },
  thumbMissing: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 },
  nameCell: { fontWeight: 600, marginBottom: 4 },
  platformBadge: { padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#374151' },
  prev: { marginLeft: 6, color: '#9ca3af', fontSize: 12, textDecoration: 'line-through' },
  linkOk: { color: '#16a34a', fontSize: 12, fontWeight: 700 },
  linkNo: { color: '#9ca3af', fontSize: 12 },
  activeBadge: { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', cursor: 'pointer' },
  inactiveBadge: { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#6b7280', cursor: 'pointer' },
  editBtn: { padding: '6px 12px', borderRadius: 6, background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 600 },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 },
  modal: { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: 20, fontWeight: 800, marginBottom: 20 },
  row: { display: 'flex', gap: 12, marginBottom: 0 },
  field: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14, flex: 1 },
  label: { fontSize: 12, color: '#374151', fontWeight: 600 },
  input: { padding: '9px 11px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  preview: { marginTop: 8, maxWidth: 120, maxHeight: 120, borderRadius: 8, border: '1px solid #e5e7eb' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 18, fontSize: 14 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 16, borderTop: '1px solid #f3f4f6' },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, background: '#f3f4f6', color: '#374151', fontSize: 14, fontWeight: 600 },
  submitBtn: { padding: '10px 24px', borderRadius: 8, background: '#ff6b35', color: '#fff', fontSize: 14, fontWeight: 700 },
};
