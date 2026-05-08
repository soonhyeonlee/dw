'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Product {
  id: string;
  platform: string;
  externalId: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl: string;
  productUrl: string;
  affiliateUrl?: string;
  category: string;
  cashbackRate: number;
  cashbackAmount?: number;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: string;
}

const PLATFORMS = ['coupang', 'naver', '11st', 'gmarket', 'ssg', 'lotteon', 'wemakeprice', 'tmon'];
const CATEGORIES = ['의류', '식품', '디지털', '뷰티', '생활', '도서', '여행', '스포츠', '유아동', '기타'];

const emptyForm = {
  platform: 'coupang',
  externalId: '',
  title: '',
  description: '',
  price: '',
  originalPrice: '',
  discountRate: '',
  imageUrl: '',
  productUrl: '',
  affiliateUrl: '',
  category: '의류',
  cashbackRate: '3',
  rating: '',
  reviewCount: '',
  isActive: true,
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
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
      if (platformFilter) qs.set('platform', platformFilter);
      const res = await api(`/products/admin/all?${qs}`);
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (e: any) {
      alert(e.message || '상품 목록을 불러올 수 없습니다');
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

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      platform: p.platform,
      externalId: p.externalId,
      title: p.title,
      description: p.description || '',
      price: String(p.price ?? ''),
      originalPrice: p.originalPrice != null ? String(p.originalPrice) : '',
      discountRate: p.discountRate != null ? String(p.discountRate) : '',
      imageUrl: p.imageUrl,
      productUrl: p.productUrl,
      affiliateUrl: p.affiliateUrl || '',
      category: p.category,
      cashbackRate: String(p.cashbackRate ?? '3'),
      rating: p.rating != null ? String(p.rating) : '',
      reviewCount: p.reviewCount != null ? String(p.reviewCount) : '',
      isActive: p.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.imageUrl.trim() || !form.productUrl.trim()) {
      alert('제목, 이미지 URL, 상품 URL은 필수입니다');
      return;
    }
    const payload: any = {
      platform: form.platform,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price) || 0,
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      discountRate: form.discountRate ? Number(form.discountRate) : undefined,
      imageUrl: form.imageUrl.trim(),
      productUrl: form.productUrl.trim(),
      affiliateUrl: form.affiliateUrl.trim() || undefined,
      category: form.category,
      cashbackRate: Number(form.cashbackRate) || 0,
      rating: form.rating ? Number(form.rating) : undefined,
      reviewCount: form.reviewCount ? Number(form.reviewCount) : undefined,
      isActive: form.isActive,
    };
    if (form.externalId.trim()) payload.externalId = form.externalId.trim();

    setSubmitting(true);
    try {
      if (editing) {
        await api(`/products/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/products', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      alert(e.message || '저장 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`"${p.title}" 상품을 삭제하시겠습니까?`)) return;
    try {
      await api(`/products/${p.id}`, { method: 'DELETE' });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      await api(`/products/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div style={styles.head}>
        <h1 style={styles.title}>상품 관리</h1>
        <button style={styles.addBtn} onClick={openCreate}>+ 상품 추가</button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); loadData(); }}
        style={styles.searchRow}
      >
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          style={styles.searchSelect}
        >
          <option value="">모든 플랫폼</option>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="상품명 검색"
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
              <th style={styles.th}>이미지</th>
              <th style={styles.th}>플랫폼</th>
              <th style={styles.th}>상품명</th>
              <th style={styles.th}>카테고리</th>
              <th style={styles.th}>가격</th>
              <th style={styles.th}>캐시백</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>관리</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  등록된 상품이 없습니다. 우측 상단 "+ 상품 추가"로 첫 상품을 등록해보세요.
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id}>
                  <td style={styles.td}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" style={styles.thumb} />
                    ) : (
                      <div style={styles.thumbMissing}>?</div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.platformBadge}>{p.platform}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.titleCell} title={p.title}>{p.title}</div>
                  </td>
                  <td style={styles.td}>{p.category}</td>
                  <td style={styles.td}>
                    {Number(p.price).toLocaleString()}원
                    {p.discountRate ? (
                      <span style={styles.discount}>{Number(p.discountRate)}%</span>
                    ) : null}
                  </td>
                  <td style={styles.td}>{Number(p.cashbackRate)}%</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleToggleActive(p)}
                      style={p.isActive ? styles.activeBadge : styles.inactiveBadge}
                    >
                      {p.isActive ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => openEdit(p)} style={styles.editBtn}>수정</button>
                    <button onClick={() => handleDelete(p)} style={styles.delBtn}>삭제</button>
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
          <form
            onSubmit={handleSubmit}
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={styles.modalTitle}>{editing ? '상품 수정' : '상품 추가'}</h2>

            <div style={styles.row}>
              <Field label="플랫폼" required>
                <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} style={styles.input}>
                  {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="카테고리" required>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={styles.input}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            <Field label="상품명" required>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={styles.input} placeholder="예: 나이키 에어맥스 270" />
            </Field>

            <Field label="설명">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...styles.input, minHeight: 60 }} />
            </Field>

            <Field label="이미지 URL" required>
              <input type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} style={styles.input} placeholder="https://..." />
              {form.imageUrl ? <img src={form.imageUrl} alt="" style={styles.preview} /> : null}
            </Field>

            <Field label="상품 URL" required>
              <input type="url" value={form.productUrl} onChange={(e) => setForm({ ...form, productUrl: e.target.value })} style={styles.input} placeholder="https://..." />
            </Field>

            <Field label="제휴 링크 URL (선택)">
              <input type="url" value={form.affiliateUrl} onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })} style={styles.input} placeholder="https://... (없으면 상품 URL 사용)" />
            </Field>

            <div style={styles.row}>
              <Field label="가격 (원)" required>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={styles.input} />
              </Field>
              <Field label="원가 (선택)">
                <input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} style={styles.input} />
              </Field>
              <Field label="할인율 % (선택)">
                <input type="number" step="0.1" value={form.discountRate} onChange={(e) => setForm({ ...form, discountRate: e.target.value })} style={styles.input} />
              </Field>
            </div>

            <div style={styles.row}>
              <Field label="캐시백률 %" required>
                <input type="number" step="0.1" value={form.cashbackRate} onChange={(e) => setForm({ ...form, cashbackRate: e.target.value })} style={styles.input} />
              </Field>
              <Field label="평점 (선택)">
                <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} style={styles.input} />
              </Field>
              <Field label="리뷰 수 (선택)">
                <input type="number" value={form.reviewCount} onChange={(e) => setForm({ ...form, reviewCount: e.target.value })} style={styles.input} />
              </Field>
            </div>

            <Field label="외부 ID (선택, 비워두면 자동 생성)">
              <input type="text" value={form.externalId} onChange={(e) => setForm({ ...form, externalId: e.target.value })} style={styles.input} disabled={!!editing} />
            </Field>

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
  thumb: { width: 56, height: 56, objectFit: 'cover', borderRadius: 8, background: '#f3f4f6' },
  thumbMissing: { width: 56, height: 56, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' },
  platformBadge: { padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#374151' },
  titleCell: { maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  discount: { marginLeft: 6, color: '#ff6b35', fontWeight: 700, fontSize: 12 },
  activeBadge: { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', cursor: 'pointer' },
  inactiveBadge: { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#6b7280', cursor: 'pointer' },
  editBtn: { padding: '6px 12px', borderRadius: 6, background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 600, marginRight: 6 },
  delBtn: { padding: '6px 12px', borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 600 },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '20px' },
  pageBtn: { padding: '8px 16px', borderRadius: '8px', background: '#fff', border: '1px solid #e5e7eb', fontSize: '13px' },
  pageInfo: { fontSize: '14px', color: '#6b7280' },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 },
  modal: { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: 20, fontWeight: 800, marginBottom: 20 },
  row: { display: 'flex', gap: 12, marginBottom: 0 },
  field: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14, flex: 1 },
  label: { fontSize: 12, color: '#374151', fontWeight: 600 },
  input: { padding: '9px 11px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  preview: { marginTop: 8, maxWidth: 160, maxHeight: 160, borderRadius: 8, border: '1px solid #e5e7eb' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 18, fontSize: 14 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 16, borderTop: '1px solid #f3f4f6' },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, background: '#f3f4f6', color: '#374151', fontSize: 14, fontWeight: 600 },
  submitBtn: { padding: '10px 24px', borderRadius: 8, background: '#ff6b35', color: '#fff', fontSize: 14, fontWeight: 700 },
};
