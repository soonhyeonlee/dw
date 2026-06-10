'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface Banner {
  id: string;
  placement: string; // 'home' | 'category'
  imageUrl?: string | null;
  badge?: string | null;
  title: string;
  subtitle?: string | null;
  align: string; // 'left' | 'right'
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

const PLACEMENTS = [
  { key: 'home', label: '홈 배너' },
  { key: 'category', label: '카테고리 배너' },
];

const emptyForm = {
  placement: 'home',
  imageUrl: '' as string,
  badge: '',
  title: '',
  subtitle: '',
  align: 'left',
  sortOrder: '0',
  isActive: true,
};

// 업로드 이미지를 캔버스로 리사이즈/압축해 base64 data URI 로 변환(가로 1400px 상한).
function fileToResizedDataUrl(file: File, maxW = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas 미지원'));
        ctx.drawImage(img, 0, 0, w, h);
        // PNG 투명도가 필요 없으면 JPEG 가 훨씬 작음.
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('이미지를 읽을 수 없습니다'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다'));
    reader.readAsDataURL(file);
  });
}

export default function BannersPage() {
  const [placement, setPlacement] = useState('home');
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api(`/admin/banners?placement=${placement}`);
      setItems(res.data || []);
    } catch (e: any) {
      alert(e.message || '배너 목록을 불러올 수 없습니다');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, placement, sortOrder: String(items.length) });
    setShowModal(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      placement: b.placement,
      imageUrl: b.imageUrl || '',
      badge: b.badge || '',
      title: b.title,
      subtitle: b.subtitle || '',
      align: b.align || 'left',
      sortOrder: String(b.sortOrder ?? 0),
      isActive: b.isActive,
    });
    setShowModal(true);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
    } catch (err: any) {
      alert(err.message || '이미지 처리 실패');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('제목은 필수입니다');
      return;
    }
    const payload: any = {
      placement: form.placement,
      imageUrl: form.imageUrl || null,
      badge: form.badge.trim() || null,
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      align: form.align,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    setSubmitting(true);
    try {
      if (editing) {
        await api(`/admin/banners/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await api('/admin/banners', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      loadData();
    } catch (e: any) {
      alert(e.message || '저장 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (b: Banner) => {
    if (!confirm(`"${b.title}" 배너를 삭제하시겠습니까?`)) return;
    try {
      await api(`/admin/banners/${b.id}`, { method: 'DELETE' });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      await api(`/admin/banners/${b.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !b.isActive }),
      });
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <div style={styles.head}>
        <h1 style={styles.title}>배너 관리</h1>
        <button style={styles.addBtn} onClick={openCreate}>+ 배너 추가</button>
      </div>

      <div style={styles.tabs}>
        {PLACEMENTS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlacement(p.key)}
            style={placement === p.key ? styles.tabActive : styles.tab}
          >
            {p.label}
          </button>
        ))}
        <span style={styles.totalText}>총 {items.length}개</span>
      </div>

      {loading ? (
        <div style={styles.loading}>로딩 중...</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>미리보기</th>
              <th style={styles.th}>태그</th>
              <th style={styles.th}>제목</th>
              <th style={styles.th}>서브내용</th>
              <th style={styles.th}>정렬</th>
              <th style={styles.th}>상태</th>
              <th style={styles.th}>관리</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  등록된 배너가 없습니다. 우측 상단 "+ 배너 추가"로 첫 배너를 등록해보세요.
                </td>
              </tr>
            ) : (
              items.map((b) => (
                <tr key={b.id}>
                  <td style={styles.td}>
                    {b.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.imageUrl} alt={b.title} style={styles.thumb} />
                    ) : (
                      <div style={styles.thumbEmpty}>이미지 없음</div>
                    )}
                  </td>
                  <td style={styles.td}>{b.badge ? <span style={styles.typeBadge}>{b.badge}</span> : '-'}</td>
                  <td style={styles.td}><div style={styles.titleCell} title={b.title}>{b.title}</div></td>
                  <td style={styles.td}><div style={styles.subCell} title={b.subtitle || ''}>{b.subtitle || '-'}</div></td>
                  <td style={styles.td}>{b.sortOrder}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleToggleActive(b)} style={b.isActive ? styles.activeBadge : styles.inactiveBadge}>
                      {b.isActive ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td style={styles.td}>
                    <button onClick={() => openEdit(b)} style={styles.editBtn}>수정</button>
                    <button onClick={() => handleDelete(b)} style={styles.delBtn}>삭제</button>
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
            <h2 style={styles.modalTitle}>{editing ? '배너 수정' : '배너 추가'}</h2>

            <Field label="사진" required>
              <div style={styles.uploadRow}>
                <div style={styles.previewBox}>
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="미리보기" style={styles.previewImg} />
                  ) : (
                    <span style={styles.previewHint}>4.1:1 와이드 권장</span>
                  )}
                  {/* 텍스트 오버레이 미리보기 — 앱과 동일하게 보이도록 */}
                  {form.imageUrl && (form.badge || form.title || form.subtitle) ? (
                    <div style={{ ...styles.previewOverlay, alignItems: form.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      {form.badge ? <span style={styles.previewBadge}>{form.badge}</span> : null}
                      {form.title ? <span style={styles.previewTitle}>{form.title}</span> : null}
                      {form.subtitle ? <span style={styles.previewSub}>{form.subtitle}</span> : null}
                    </div>
                  ) : null}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{ fontSize: 13 }} />
                  <span style={styles.hint}>{uploading ? '이미지 처리 중...' : '업로드 시 자동으로 가로 1400px·JPEG로 압축됩니다.'}</span>
                  {form.imageUrl ? (
                    <button type="button" onClick={() => setForm({ ...form, imageUrl: '' })} style={styles.clearImgBtn}>이미지 제거</button>
                  ) : null}
                </div>
              </div>
            </Field>

            <div style={styles.row}>
              <Field label="노출 위치" required>
                <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} style={styles.input}>
                  {PLACEMENTS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="텍스트 정렬">
                <select value={form.align} onChange={(e) => setForm({ ...form, align: e.target.value })} style={styles.input}>
                  <option value="left">왼쪽</option>
                  <option value="right">오른쪽</option>
                </select>
              </Field>
            </div>

            <Field label="태그 (배지)">
              <input type="text" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} style={styles.input} placeholder="예: 페이백, 여행 BIG" />
            </Field>

            <Field label="제목" required>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={styles.input} placeholder="예: 쇼핑하고 페이백 받기" />
            </Field>

            <Field label="서브 내용">
              <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} style={styles.input} placeholder="예: 더블원플러스 경유 시 캐시 적립" />
            </Field>

            <Field label="정렬 순서 (작을수록 앞)">
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} style={styles.input} />
            </Field>

            <label style={styles.checkRow}>
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span>모바일에 노출 (활성)</span>
            </label>

            <div style={styles.modalActions}>
              <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn} disabled={submitting}>취소</button>
              <button type="submit" style={styles.submitBtn} disabled={submitting || uploading}>
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
  tabs: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  tab: { padding: '8px 16px', borderRadius: '8px', background: '#fff', border: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 600, color: '#374151' },
  tabActive: { padding: '8px 16px', borderRadius: '8px', background: '#ff6b35', border: '1px solid #ff6b35', fontSize: '14px', fontWeight: 700, color: '#fff' },
  totalText: { fontSize: '14px', color: '#6b7280', marginLeft: '8px' },
  loading: { padding: '60px', textAlign: 'center', color: '#9ca3af' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  th: { textAlign: 'left', padding: '14px 16px', fontSize: '12px', fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' },
  td: { padding: '12px 16px', fontSize: '14px', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' },
  thumb: { width: 132, height: 32, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', display: 'block' },
  thumbEmpty: { width: 132, height: 32, borderRadius: 6, background: '#f3f4f6', color: '#9ca3af', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  titleCell: { maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  subCell: { maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#6b7280' },
  typeBadge: { padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#fff7ed', color: '#c2410c' },
  activeBadge: { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', cursor: 'pointer' },
  inactiveBadge: { padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#6b7280', cursor: 'pointer' },
  editBtn: { padding: '6px 12px', borderRadius: 6, background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 600, marginRight: 6 },
  delBtn: { padding: '6px 12px', borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 600 },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 },
  modal: { background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto' },
  modalTitle: { fontSize: 20, fontWeight: 800, marginBottom: 20 },
  row: { display: 'flex', gap: 12, marginBottom: 0 },
  field: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14, flex: 1 },
  label: { fontSize: 12, color: '#374151', fontWeight: 600 },
  input: { padding: '9px 11px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  uploadRow: { display: 'flex', gap: 14, alignItems: 'flex-start' },
  previewBox: { position: 'relative', width: 280, height: Math.round(280 * 414 / 1705), borderRadius: 10, overflow: 'hidden', background: '#f3f4f6', border: '1px solid #e5e7eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  previewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  previewHint: { fontSize: 11, color: '#9ca3af' },
  previewOverlay: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 14px', gap: 3 },
  previewBadge: { background: '#fff', color: '#c2410c', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, alignSelf: 'flex-start' },
  previewTitle: { color: '#fff', fontSize: 13, fontWeight: 800, textShadow: '0 1px 3px rgba(0,0,0,0.4)' },
  previewSub: { color: '#fff', fontSize: 10, fontWeight: 500, textShadow: '0 1px 3px rgba(0,0,0,0.4)' },
  hint: { fontSize: 11, color: '#9ca3af' },
  clearImgBtn: { padding: '5px 10px', borderRadius: 6, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 600, alignSelf: 'flex-start' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 18, fontSize: 14 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 16, borderTop: '1px solid #f3f4f6' },
  cancelBtn: { padding: '10px 20px', borderRadius: 8, background: '#f3f4f6', color: '#374151', fontSize: 14, fontWeight: 600 },
  submitBtn: { padding: '10px 24px', borderRadius: 8, background: '#ff6b35', color: '#fff', fontSize: 14, fontWeight: 700 },
};
