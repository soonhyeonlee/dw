'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Coupon {
  id: string;
  title: string;
  description?: string;
  couponType: string;
  value?: string;
  totalQuantity: number;
  remainingQuantity: number;
  serialNumber: string;
  partnerName?: string;
  category?: string;
  startAt: string;
  expireAt: string;
  isActive: boolean;
  createdAt: string;
}

const COUPON_TYPES = ['할인권', '이용권', '무료체험'];
const CATEGORIES = ['태권도', '영어', '수학', '피아노', '미술', '코딩', '음악', '체육', '논술', '과학', '기타'];

const emptyForm = {
  title: '',
  couponType: '할인권',
  value: '',
  partnerName: '',
  category: '태권도',
  totalQuantity: '',
  remainingQuantity: '',
  startAt: '',
  expireAt: '',
  description: '',
  isActive: true,
};

function dateInput(v?: string) {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

export default function CouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '20' });
      if (keyword) qs.set('keyword', keyword);
      if (categoryFilter) qs.set('category', categoryFilter);
      const res = await api(`/region/admin/coupons?${qs}`);
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (e: any) {
      alert(e.message || '쿠폰 목록을 불러올 수 없습니다');
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

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      title: c.title,
      couponType: c.couponType || '할인권',
      value: c.value || '',
      partnerName: c.partnerName || '',
      category: c.category || '태권도',
      totalQuantity: String(c.totalQuantity ?? ''),
      remainingQuantity: String(c.remainingQuantity ?? ''),
      startAt: dateInput(c.startAt),
      expireAt: dateInput(c.expireAt),
      description: c.description || '',
      isActive: c.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('쿠폰명은 필수입니다');
      return;
    }
    if (!form.startAt || !form.expireAt) {
      alert('시작일과 만료일은 필수입니다');
      return;
    }
    const payload: any = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      couponType: form.couponType,
      value: form.value.trim() || undefined,
      partnerName: form.partnerName.trim() || undefined,
      category: form.category,
      totalQuantity: Number(form.totalQuantity) || 0,
      startAt: form.startAt,
      expireAt: form.expireAt,
      isActive: form.isActive,
    };
    if (editing && form.remainingQuantity !== '') {
      payload.remainingQuantity = Number(form.remainingQuantity);
    }

    setSubmitting(true);
    try {
      if (editing) {
        await api(`/region/admin/coupons/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/region/admin/coupons', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      alert(e.message || '저장 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`"${c.title}" 쿠폰을 삭제하시겠습니까?`)) return;
    try {
      await api(`/region/admin/coupons/${c.id}`, { method: 'DELETE' });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    try {
      await api(`/region/admin/coupons/${c.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div style={styles.head}>
        <h1 style={styles.title}>쿠폰 관리</h1>
        <button style={styles.addBtn} onClick={openCreate}>+ 쿠폰 추가</button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); loadData(); }}
        style={styles.searchRow}
      >
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={styles.searchSelect}>
          <option value="">모든 카테고리</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="쿠폰명 검색"
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchBtn}>검색</button>
        <span style={styles.totalText}>총 {total}개</span>
      </form>

      {loading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>쿠폰명</th>
              <th style={styles.th}>유형</th>
              <th style={styles.th}>혜택</th>
              <th style={styles.th}>카테고리</th>
              <th style={styles.th}>잔여/총</th>
              <th style={styles.th}>만료일</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>관리</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  등록된 쿠폰이 없습니다. 우측 상단 "+ 쿠폰 추가"로 첫 쿠폰을 등록해보세요.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td style={styles.td}>
                    <div style={styles.titleCell} title={c.title}>{c.title}</div>
                  </td>
                  <td style={styles.td}><span style={styles.typeBadge}>{c.couponType}</span></td>
                  <td style={styles.td}>{c.value || '-'}</td>
                  <td style={styles.td}>{c.category || '-'}</td>
                  <td style={styles.td}>{c.remainingQuantity} / {c.totalQuantity}</td>
                  <td style={styles.td}>{dateInput(c.expireAt)}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleToggleActive(c)}
                      style={c.isActive ? styles.activeBadge : styles.inactiveBadge}
                    >
                      {c.isActive ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => openEdit(c)} style={styles.editBtn}>수정</button>
                    <button onClick={() => handleDelete(c)} style={styles.delBtn}>삭제</button>
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

      {showModal && (
        <div style={styles.modalBackdrop} onClick={() => !submitting && setShowModal(false)}>
          <form onSubmit={handleSubmit} style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editing ? '쿠폰 수정' : '쿠폰 추가'}</h2>

            <Field label="쿠폰명" required>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={styles.input} placeholder="예: 첫 수업 50% 할인" />
            </Field>

            <div style={styles.row}>
              <Field label="쿠폰 유형" required>
                <select value={form.couponType} onChange={(e) => setForm({ ...form, couponType: e.target.value })} style={styles.input}>
                  {COUPON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="혜택 표시값">
                <input type="text" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} style={styles.input} placeholder="예: 50%, 무료, 30,000원" />
              </Field>
            </div>

            <div style={styles.row}>
              <Field label="카테고리" required>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={styles.input}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="파트너(상호)명">
                <input type="text" value={form.partnerName} onChange={(e) => setForm({ ...form, partnerName: e.target.value })} style={styles.input} />
              </Field>
            </div>

            <div style={styles.row}>
              <Field label="총 발행 수량" required>
                <input type="number" value={form.totalQuantity} onChange={(e) => setForm({ ...form, totalQuantity: e.target.value })} style={styles.input} />
              </Field>
              {editing ? (
                <Field label="잔여 수량">
                  <input type="number" value={form.remainingQuantity} onChange={(e) => setForm({ ...form, remainingQuantity: e.target.value })} style={styles.input} />
                </Field>
              ) : (
                <div style={{ flex: 1 }} />
              )}
            </div>

            <div style={styles.row}>
              <Field label="시작일" required>
                <input type="date" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} style={styles.input} />
              </Field>
              <Field label="만료일" required>
                <input type="date" value={form.expireAt} onChange={(e) => setForm({ ...form, expireAt: e.target.value })} style={styles.input} />
              </Field>
            </div>

            <Field label="설명">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...styles.input, minHeight: 56 }} />
            </Field>

            {editing ? (
              <Field label="시리얼 번호 (자동)">
                <input type="text" value={editing.serialNumber} style={styles.input} disabled />
              </Field>
            ) : null}

            <label style={styles.checkRow}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span>모바일에 노출 (활성)</span>
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
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '24px', fontWeight: 800 },
  addBtn: { padding: '10px 20px', borderRadius: '8px', background: '#ff6b35', color: '#fff', fontSize: '14px', fontWeight: 700 },
  searchRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  searchSelect: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px' },
  searchInput: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', width: '280px' },
  searchBtn: { padding: '8px 16px', borderRadius: '8px', background: '#ff6b35', color: '#fff', fontSize: '14px', fontWeight: 600 },
  totalText: { fontSize: '14px', color: '#6b7280', marginLeft: '8px' },
  loading: { padding: '60px', textAlign: 'center', color: '#9ca3af' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' },
  td: { padding: '12px 16px', fontSize: '14px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' },
  titleCell: { maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  typeBadge: { padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e' },
  activeBadge: { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', cursor: 'pointer' },
  inactiveBadge: { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#6b7280', cursor: 'pointer' },
  editBtn: { padding: '6px 12px', borderRadius: 6, background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 600, marginRight: 6 },
  delBtn: { padding: '6px 12px', borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 600 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '20px' },
  pageBtn: { padding: '8px 16px', borderRadius: '8px', background: '#fff', border: '1px solid #e5e7eb', fontSize: '13px' },
  pageInfo: { fontSize: '14px', color: '#6b7280' },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 },
  modal: { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: 20, fontWeight: 800, marginBottom: 20 },
  row: { display: 'flex', gap: 12, marginBottom: 0 },
  field: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14, flex: 1 },
  label: { fontSize: 12, color: '#374151', fontWeight: 600 },
  input: { padding: '9px 11px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 18, fontSize: 14 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 16, borderTop: '1px solid #f3f4f6' },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, background: '#f3f4f6', color: '#374151', fontSize: 14, fontWeight: 600 },
  submitBtn: { padding: '10px 24px', borderRadius: 8, background: '#ff6b35', color: '#fff', fontSize: 14, fontWeight: 700 },
};
