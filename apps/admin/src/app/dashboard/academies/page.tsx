'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Academy {
  id: string;
  name: string;
  category?: string;
  description?: string;
  address?: string;
  addressDetail?: string;
  phone?: string;
  region?: string;
  photos?: string[];
  tags?: string[];
  curriculum?: string;
  notice?: string;
  parking?: string;
  sns?: { kakao?: string; instagram?: string; facebook?: string; band?: string };
  adminVideos?: { url: string; title?: string }[];
  rating?: number;
  reviewCount?: number;
  viewCount?: number;
  heartCount?: number;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = ['태권도', '영어', '수학', '피아노', '미술', '코딩', '음악', '체육', '논술', '과학', '기타'];

const emptyForm = {
  name: '',
  category: '태권도',
  region: '',
  address: '',
  addressDetail: '',
  phone: '',
  description: '',
  curriculum: '',
  notice: '',
  parking: '',
  photos: '',
  youtubeVideos: '',
  tags: '',
  snsKakao: '',
  snsInstagram: '',
  snsFacebook: '',
  snsBand: '',
  rating: '',
  reviewCount: '',
  isActive: true,
};

export default function AcademiesPage() {
  const [items, setItems] = useState<Academy[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Academy | null>(null);
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
      const res = await api(`/region/admin/academies?${qs}`);
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (e: any) {
      alert(e.message || '학원 목록을 불러올 수 없습니다');
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

  const openEdit = (a: Academy) => {
    setEditing(a);
    setForm({
      name: a.name,
      category: a.category || '태권도',
      region: a.region || '',
      address: a.address || '',
      addressDetail: a.addressDetail || '',
      phone: a.phone || '',
      description: a.description || '',
      curriculum: a.curriculum || '',
      notice: a.notice || '',
      parking: a.parking || '',
      photos: (a.photos || []).join('\n'),
      youtubeVideos: (a.adminVideos || [])
        .map((v) => (v.title ? `${v.url} | ${v.title}` : v.url))
        .join('\n'),
      tags: (a.tags || []).join(', '),
      snsKakao: a.sns?.kakao || '',
      snsInstagram: a.sns?.instagram || '',
      snsFacebook: a.sns?.facebook || '',
      snsBand: a.sns?.band || '',
      rating: a.rating != null ? String(a.rating) : '',
      reviewCount: a.reviewCount != null ? String(a.reviewCount) : '',
      isActive: a.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('학원명은 필수입니다');
      return;
    }
    const photos = form.photos.split('\n').map((s) => s.trim()).filter(Boolean);
    const tags = form.tags.split(',').map((s) => s.trim()).filter(Boolean);
    // 유튜브 영상: 한 줄에 하나, "링크" 또는 "링크 | 제목" 형식.
    const adminVideos = form.youtubeVideos
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [url, ...rest] = line.split('|');
        const title = rest.join('|').trim();
        return title ? { url: url.trim(), title } : { url: url.trim() };
      })
      .filter((v) => /^https?:\/\//i.test(v.url));
    const sns: Record<string, string> = {};
    if (form.snsKakao.trim()) sns.kakao = form.snsKakao.trim();
    if (form.snsInstagram.trim()) sns.instagram = form.snsInstagram.trim();
    if (form.snsFacebook.trim()) sns.facebook = form.snsFacebook.trim();
    if (form.snsBand.trim()) sns.band = form.snsBand.trim();

    const payload: any = {
      name: form.name.trim(),
      category: form.category,
      region: form.region.trim() || undefined,
      address: form.address.trim() || undefined,
      addressDetail: form.addressDetail.trim() || undefined,
      phone: form.phone.trim() || undefined,
      description: form.description.trim() || undefined,
      curriculum: form.curriculum.trim() || undefined,
      notice: form.notice.trim() || undefined,
      parking: form.parking.trim() || undefined,
      photos,
      tags,
      sns: Object.keys(sns).length ? sns : undefined,
      adminVideos,
      rating: form.rating ? Number(form.rating) : undefined,
      reviewCount: form.reviewCount ? Number(form.reviewCount) : undefined,
      isActive: form.isActive,
    };

    setSubmitting(true);
    try {
      if (editing) {
        await api(`/region/admin/academies/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/region/admin/academies', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      alert(e.message || '저장 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (a: Academy) => {
    if (!confirm(`"${a.name}" 학원을 삭제하시겠습니까?`)) return;
    try {
      await api(`/region/admin/academies/${a.id}`, { method: 'DELETE' });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleActive = async (a: Academy) => {
    try {
      await api(`/region/admin/academies/${a.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !a.isActive }),
      });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div style={styles.head}>
        <h1 style={styles.title}>학원 관리</h1>
        <button style={styles.addBtn} onClick={openCreate}>+ 학원 추가</button>
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
          placeholder="학원명 검색"
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
              <th style={styles.th}>사진</th>
              <th style={styles.th}>학원명</th>
              <th style={styles.th}>카테고리</th>
              <th style={styles.th}>지역</th>
              <th style={styles.th}>평점</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>관리</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  등록된 학원이 없습니다. 우측 상단 "+ 학원 추가"로 첫 학원을 등록해보세요.
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr key={a.id}>
                  <td style={styles.td}>
                    {a.photos && a.photos[0] ? (
                      <img src={a.photos[0]} alt="" style={styles.thumb} />
                    ) : (
                      <div style={styles.thumbMissing}>?</div>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.titleCell} title={a.name}>{a.name}</div>
                  </td>
                  <td style={styles.td}>{a.category || '-'}</td>
                  <td style={styles.td}>{a.region || '-'}</td>
                  <td style={styles.td}>★ {a.rating ?? 0} ({a.reviewCount ?? 0})</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleToggleActive(a)}
                      style={a.isActive ? styles.activeBadge : styles.inactiveBadge}
                    >
                      {a.isActive ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => openEdit(a)} style={styles.editBtn}>수정</button>
                    <button onClick={() => handleDelete(a)} style={styles.delBtn}>삭제</button>
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
            <h2 style={styles.modalTitle}>{editing ? '학원 수정' : '학원 추가'}</h2>

            <div style={styles.row}>
              <Field label="학원명" required>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.input} placeholder="예: 국제 태권도 아카데미" />
              </Field>
              <Field label="카테고리" required>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={styles.input}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            <div style={styles.row}>
              <Field label="지역">
                <input type="text" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} style={styles.input} placeholder="예: 서울 강남구" />
              </Field>
              <Field label="전화번호">
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={styles.input} placeholder="예: 02-123-4567" />
              </Field>
            </div>

            <Field label="주소">
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={styles.input} />
            </Field>
            <Field label="상세 주소">
              <input type="text" value={form.addressDetail} onChange={(e) => setForm({ ...form, addressDetail: e.target.value })} style={styles.input} />
            </Field>

            <Field label="유튜브 영상 (한 줄에 하나, 앱 상세 '학원 정보' 최상단에 노출)">
              <textarea
                value={form.youtubeVideos}
                onChange={(e) => setForm({ ...form, youtubeVideos: e.target.value })}
                style={{ ...styles.input, minHeight: 56 }}
                placeholder={'https://youtu.be/VIDEO_ID&#10;https://www.youtube.com/watch?v=VIDEO_ID | 제목(선택)'}
              />
            </Field>

            <Field label="소개">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...styles.input, minHeight: 56 }} />
            </Field>
            <Field label="수업 내용">
              <textarea value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })} style={{ ...styles.input, minHeight: 56 }} />
            </Field>
            <Field label="안내 및 유의사항">
              <textarea value={form.notice} onChange={(e) => setForm({ ...form, notice: e.target.value })} style={{ ...styles.input, minHeight: 56 }} />
            </Field>
            <Field label="주차 안내">
              <input type="text" value={form.parking} onChange={(e) => setForm({ ...form, parking: e.target.value })} style={styles.input} />
            </Field>

            <Field label="사진 URL (한 줄에 하나)">
              <textarea value={form.photos} onChange={(e) => setForm({ ...form, photos: e.target.value })} style={{ ...styles.input, minHeight: 56 }} placeholder="https://...&#10;https://..." />
            </Field>
            <Field label="태그 (쉼표로 구분)">
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} style={styles.input} placeholder="체험수업, 셔틀운행, 소수정예" />
            </Field>

            <div style={styles.row}>
              <Field label="카카오톡 문의 링크">
                <input type="url" value={form.snsKakao} onChange={(e) => setForm({ ...form, snsKakao: e.target.value })} style={styles.input} placeholder="http://pf.kakao.com/..." />
              </Field>
              <Field label="인스타그램">
                <input type="url" value={form.snsInstagram} onChange={(e) => setForm({ ...form, snsInstagram: e.target.value })} style={styles.input} />
              </Field>
            </div>
            <div style={styles.row}>
              <Field label="페이스북">
                <input type="url" value={form.snsFacebook} onChange={(e) => setForm({ ...form, snsFacebook: e.target.value })} style={styles.input} />
              </Field>
              <Field label="밴드">
                <input type="url" value={form.snsBand} onChange={(e) => setForm({ ...form, snsBand: e.target.value })} style={styles.input} />
              </Field>
            </div>

            <div style={styles.row}>
              <Field label="평점 (0~5)">
                <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} style={styles.input} />
              </Field>
              <Field label="리뷰 수">
                <input type="number" value={form.reviewCount} onChange={(e) => setForm({ ...form, reviewCount: e.target.value })} style={styles.input} />
              </Field>
            </div>

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
  titleCell: { maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
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
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 18, fontSize: 14 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 16, borderTop: '1px solid #f3f4f6' },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, background: '#f3f4f6', color: '#374151', fontSize: 14, fontWeight: 600 },
  submitBtn: { padding: '10px 24px', borderRadius: 8, background: '#ff6b35', color: '#fff', fontSize: 14, fontWeight: 700 },
};
