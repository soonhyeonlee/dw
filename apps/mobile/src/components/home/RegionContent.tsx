import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SPACING, RADIUS, QM } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState } from '../EmptyState';
import {
  getAcademies,
  getCoupons,
  downloadCoupon,
  type Academy,
  type Coupon,
} from '../../api/region';

// 세분 카테고리 — 백엔드 ACADEMY_CATEGORY_KEYWORDS 키와 일치(이름 기반 분류).
const CATEGORIES = [
  '전체',
  '어린이집', '유치원',
  '태권도', '복싱', '킥복싱', '주짓수', 'MMA', '합기도', '유도', '검도',
  '헬스클럽', '크로스핏', 'PT샵', '필라테스', '요가', '수영', '골프',
  '영어', '수학', '논술', '과학', '코딩',
  '피아노', '미술', '음악', '무용',
];
const NEARBY_RADIUS_KM = 5;
const PAGE_SIZE = 20;

// 쿠폰북은 제휴 쿠폰 데이터/기능이 준비되면 true 로. 그 전까지 '준비 중' 안내만 노출.
// (학원정보 탭은 Google Places 데이터 수집 완료로 2026-06-11 부터 활성.)
const COUPON_READY = false;

const SORT_OPTIONS = [
  { key: 'popular',  label: '인기순' },
  { key: 'rating',   label: '평점순' },
  { key: 'review',   label: '리뷰많은순' },
  { key: 'distance', label: '가까운순' },
] as const;
type SortKey = typeof SORT_OPTIONS[number]['key'];

type Tab = 'academies' | 'coupons';

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function showActionSheet(title: string, options: string[], onPick: (idx: number) => void) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...options, '취소'],
        cancelButtonIndex: options.length,
      },
      (idx) => {
        if (idx >= 0 && idx < options.length) onPick(idx);
      },
    );
    return;
  }
  Alert.alert(
    title,
    undefined,
    [
      ...options.map((label, idx) => ({ text: label, onPress: () => onPick(idx) })),
      { text: '취소', style: 'cancel' as const },
    ],
  );
}

function CouponCard({ c }: { c: Coupon }) {
  return (
    <View style={couponStyles.card}>
      <View style={couponStyles.leftBar} />
      <View style={couponStyles.body}>
        <View style={couponStyles.typeBadge}>
          <Text style={couponStyles.typeText}>{c.couponType}</Text>
        </View>
        <Text style={couponStyles.title}>{c.title}</Text>
        <Text style={couponStyles.partner}>{c.partnerName}</Text>
        <View style={couponStyles.metaRow}>
          <Ionicons name="time-outline" size={11} color={COLORS.ink[500]} />
          <Text style={couponStyles.meta}>~ {fmtDate(c.expireAt)}</Text>
          <View style={couponStyles.dotSep} />
          <Text style={couponStyles.remain}>잔여 {c.remainingQuantity}매</Text>
        </View>
      </View>
      <View style={couponStyles.right}>
        <Text style={couponStyles.value}>{c.value}</Text>
      </View>
    </View>
  );
}

function formatDistance(km?: number): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function AcademyCard({ a, onPress }: { a: Academy; onPress: () => void }) {
  const thumb = a.photos && a.photos.length ? a.photos[0] : undefined;
  const distance = formatDistance(a.distanceKm);
  return (
    <TouchableOpacity style={aStyles.card} onPress={onPress} activeOpacity={0.8}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={aStyles.img} resizeMode="cover" />
      ) : (
        <View style={[aStyles.img, aStyles.imgEmpty]}>
          <Ionicons name="school-outline" size={32} color={COLORS.ink[300]} />
        </View>
      )}
      <View style={aStyles.body}>
        <View style={aStyles.headRow}>
          {a.category ? (
            <View style={aStyles.catBadge}>
              <Text style={aStyles.catText}>{a.category}</Text>
            </View>
          ) : null}
          {distance ? (
            <View style={aStyles.distBadge}>
              <Ionicons name="navigate" size={10} color={COLORS.primary} />
              <Text style={aStyles.distText}>{distance}</Text>
            </View>
          ) : null}
        </View>
        <Text style={aStyles.name} numberOfLines={1}>{a.name}</Text>
        <View style={aStyles.addrRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.ink[500]} />
          <Text style={aStyles.addr} numberOfLines={1}>{a.address || a.region || ''}</Text>
        </View>
        <View style={aStyles.metaRow}>
          {Number(a.rating) > 0 ? (
            <>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={aStyles.rating}>{Number(a.rating).toFixed(1)}</Text>
              <Text style={aStyles.review}>({a.reviewCount})</Text>
              <View style={aStyles.dot} />
            </>
          ) : (
            <>
              <Text style={aStyles.newBadge}>신규</Text>
              <View style={aStyles.dot} />
            </>
          )}
          <Ionicons name="eye-outline" size={12} color={COLORS.ink[500]} />
          <Text style={aStyles.stat}>{(a.viewCount || 0).toLocaleString()}</Text>
          <View style={aStyles.dot} />
          <Ionicons name="heart" size={12} color={COLORS.primary} />
          <Text style={aStyles.stat}>{a.heartCount || 0}</Text>
        </View>
        {a.tags && a.tags.length ? (
          <View style={aStyles.tagRow}>
            {a.tags.map((t) => (
              <View key={t} style={aStyles.tag}>
                <Text style={aStyles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export type RegionContentHandle = {
  reload: () => Promise<void>;
};

export const RegionContent = forwardRef<RegionContentHandle>((_props, ref) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('academies');
  const [scope, setScope] = useState<'all' | 'nearby'>('all');
  const [category, setCategory] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<SortKey>('popular');
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // 검색어는 입력 즉시가 아니라 디바운스 후 서버에 질의(전체 DB 검색).
  const [kwDebounced, setKwDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setKwDebounced(keyword.trim()), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  // "가까운 지역" 선택 시 위치 권한 요청 + 현재 좌표 1회 취득.
  const ensureLocation = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setLocationError('위치 권한이 거부되어 가까운 학원을 표시할 수 없어요.');
        return null;
      }
      // 현재 위치를 우선 취득(높은 정확도). 실패 시에만 마지막 알려진 위치로 폴백.
      // last-known 을 먼저 쓰면 다른 지역의 오래된 좌표가 잡혀 "내 주변"이 엉뚱하게 나온다.
      let pos: Location.LocationObject | null = null;
      try {
        pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      } catch {
        pos = await Location.getLastKnownPositionAsync();
      }
      if (!pos) {
        setLocationError('현재 위치를 확인할 수 없어요. 기기의 위치 서비스를 켜고 다시 시도해 주세요.');
        return null;
      }
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(next);
      setLocationError(null);
      return next;
    } catch {
      setLocationError('현재 위치를 확인할 수 없어요. 기기의 위치 서비스를 켜고 다시 시도해 주세요.');
      return null;
    }
  }, []);

  // 검색/카테고리/정렬/범위는 모두 서버에 위임(전체 DB 대상). 페이지네이션은 "더보기".
  const buildOpts = useCallback(
    (targetPage: number, geo: { lat: number; lng: number } | null): Parameters<typeof getAcademies>[0] => {
      const opts: Parameters<typeof getAcademies>[0] = {
        limit: PAGE_SIZE,
        page: targetPage,
        category: category !== '전체' ? category : undefined,
        keyword: kwDebounced || undefined,
        sort,
      };
      if (scope === 'nearby' && geo) {
        opts.lat = geo.lat;
        opts.lng = geo.lng;
        opts.radiusKm = NEARBY_RADIUS_KM;
      }
      return opts;
    },
    [category, kwDebounced, sort, scope],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let geo = coords;
      if (scope === 'nearby' && !geo) geo = await ensureLocation();
      const [ac, cp] = await Promise.all([
        getAcademies(buildOpts(1, geo)).catch(() => null),
        getCoupons().catch(() => ({ items: [] as Coupon[] })),
      ]);
      setAcademies((ac?.items as Academy[]) || []);
      setTotal(ac?.total ?? (ac?.items?.length || 0));
      setPage(1);
      setHasMore((ac?.totalPages ?? 1) > 1);
      setCoupons((cp?.items as Coupon[]) || []);
    } finally {
      setLoading(false);
    }
  }, [scope, coords, buildOpts, ensureLocation]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const ac = await getAcademies(buildOpts(next, coords)).catch(() => null);
      if (ac?.items?.length) {
        setAcademies((prev) => [...prev, ...(ac.items as Academy[])]);
        setPage(next);
        setHasMore((ac.totalPages ?? next) > next);
      } else {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, buildOpts, coords]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useImperativeHandle(ref, () => ({ reload: loadData }), [loadData]);

  const hasFilter = kwDebounced.length > 0 || category !== '전체';
  const sortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? '인기순';

  const handleDownload = async (c: Coupon) => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '쿠폰을 받으려면 로그인이 필요합니다.');
      return;
    }
    try {
      await downloadCoupon(c.id);
      Alert.alert('쿠폰 다운로드', `${c.title} 쿠폰이 다운로드되었습니다.`);
      loadData();
    } catch (e: any) {
      Alert.alert('다운로드 실패', e?.message || '쿠폰을 받지 못했습니다.');
    }
  };

  const handlePickSort = () => {
    showActionSheet(
      '정렬 기준',
      SORT_OPTIONS.map((o) => o.label),
      (idx) => {
        const key = SORT_OPTIONS[idx].key;
        setSort(key);
        // 거리순은 내 위치 기준이 있어야 의미가 있으므로 자동으로 '내 주변'으로 전환.
        if (key === 'distance') setScope('nearby');
      },
    );
  };

  const resetAcademyFilters = () => {
    setKeyword('');
    setCategory('전체');
  };

  return (
    <View>
      {/* Segmented tabs */}
      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segItem, tab === 'academies' && styles.segItemActive]}
          onPress={() => setTab('academies')}
        >
          <Text style={[styles.segText, tab === 'academies' && styles.segTextActive]}>학원정보</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segItem, tab === 'coupons' && styles.segItemActive]}
          onPress={() => setTab('coupons')}
        >
          <Text style={[styles.segText, tab === 'coupons' && styles.segTextActive]}>쿠폰북</Text>
        </TouchableOpacity>
      </View>

      {tab === 'coupons' && !COUPON_READY ? (
        <View style={{ paddingTop: 32 }}>
          <EmptyState
            icon="gift-outline"
            title="쿠폰북 준비 중이에요"
            subtitle={'지역 제휴처의 특별 쿠폰을\n곧 선보일 예정이에요.'}
          />
        </View>
      ) : loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
      ) : tab === 'academies' ? (
        <>
          {/* 전체 / 가까운 지역 토글 */}
          <View style={styles.scopeRow}>
            <TouchableOpacity
              style={[styles.scopeBtn, scope === 'all' && styles.scopeBtnActive]}
              onPress={() => setScope('all')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="earth"
                size={14}
                color={scope === 'all' ? COLORS.white : COLORS.ink[600]}
              />
              <Text style={[styles.scopeText, scope === 'all' && styles.scopeTextActive]}>전체 보기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scopeBtn, scope === 'nearby' && styles.scopeBtnActive]}
              onPress={() => setScope('nearby')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="navigate"
                size={14}
                color={scope === 'nearby' ? COLORS.white : COLORS.ink[600]}
              />
              <Text style={[styles.scopeText, scope === 'nearby' && styles.scopeTextActive]}>
                내 주변 {NEARBY_RADIUS_KM}km
              </Text>
            </TouchableOpacity>
          </View>

          {scope === 'nearby' && locationError ? (
            <View style={styles.locWarn}>
              <Ionicons name="alert-circle" size={14} color={COLORS.error} />
              <Text style={styles.locWarnText} numberOfLines={2}>{locationError}</Text>
            </View>
          ) : null}

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={COLORS.ink[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="학원 이름, 지역으로 검색"
              placeholderTextColor={COLORS.ink[400]}
              value={keyword}
              onChangeText={setKeyword}
              returnKeyType="search"
            />
            {keyword.length > 0 && (
              <TouchableOpacity onPress={() => setKeyword('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.ink[400]} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catPill, active && styles.catPillActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catText, active && styles.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.countRow}>
            <Text style={styles.countText}>
              총 <Text style={styles.countStrong}>{total}</Text>개
            </Text>
            <TouchableOpacity style={styles.sortBtn} onPress={handlePickSort}>
              <Text style={styles.sortText}>{sortLabel}</Text>
              <Ionicons name="chevron-down" size={12} color={COLORS.ink[700]} />
            </TouchableOpacity>
          </View>

          {academies.length === 0 ? (
            hasFilter ? (
              <EmptyState
                icon="search-outline"
                title="검색 결과가 없어요"
                subtitle={`'${kwDebounced || category}' 와(과) 일치하는 학원을\n찾지 못했어요. 다른 조건으로 시도해 보세요.`}
                actionLabel="조건 초기화"
                onAction={resetAcademyFilters}
              />
            ) : scope === 'nearby' ? (
              <EmptyState
                icon="navigate-outline"
                title={`내 주변 ${NEARBY_RADIUS_KM}km에 등록된 학원이 없어요`}
                subtitle={'아직 이 지역 정보가 수집되지 않았어요.\n전체 보기로 더 많은 학원을 확인해 보세요.'}
              />
            ) : (
              <EmptyState
                icon="school-outline"
                title="학원 정보를 준비 중이에요"
                subtitle={'우리 동네 학원·어린이집 정보를\n곧 만나보실 수 있어요.'}
              />
            )
          ) : (
            <View style={styles.listWrap}>
              {academies.map((a) => (
                <AcademyCard key={a.id} a={a} onPress={() => router.push(`/region/${a.id}` as any)} />
              ))}
              {hasMore ? (
                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={loadMore}
                  disabled={loadingMore}
                  activeOpacity={0.8}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={QM.coral} />
                  ) : (
                    <>
                      <Text style={styles.moreBtnText}>더보기 ({academies.length}/{total})</Text>
                      <Ionicons name="chevron-down" size={16} color={QM.coral} />
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.couponHero}>
            <View style={styles.couponHeroIcon}>
              <Ionicons name="gift" size={26} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.couponHeroTitle}>파트너 전용 쿠폰</Text>
              <Text style={styles.couponHeroSub}>지역 제휴처의 특별 혜택을 받아가세요</Text>
            </View>
            <View style={styles.couponHeroBadge}>
              <Text style={styles.couponHeroBadgeText}>{coupons.length}</Text>
            </View>
          </View>
          {coupons.length === 0 ? (
            <EmptyState
              icon="gift-outline"
              title="아직 받을 수 있는 쿠폰이 없어요"
              subtitle="새로운 파트너 쿠폰이 곧 등록될 예정이에요."
            />
          ) : (
            <View style={styles.listWrap}>
              {coupons.map((c) => (
                <TouchableOpacity key={c.id} activeOpacity={0.9} onPress={() => handleDownload(c)}>
                  <CouponCard c={c} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
});
RegionContent.displayName = 'RegionContent';

const styles = StyleSheet.create({
  segment: {
    marginHorizontal: SPACING.xl,
    marginTop: 16,
    flexDirection: 'row',
    backgroundColor: QM.fieldBg,
    borderRadius: 12,
    padding: 4,
  },
  segItem: { flex: 1, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segItemActive: {
    backgroundColor: QM.card,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[500] },
  segTextActive: { color: QM.ink, fontWeight: '800' },

  scopeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SPACING.xl,
    paddingTop: 14,
  },
  scopeBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: QM.fieldBg,
  },
  scopeBtnActive: {
    backgroundColor: QM.coral,
  },
  scopeText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[700] },
  scopeTextActive: { color: COLORS.white, fontWeight: '700' },

  locWarn: {
    marginHorizontal: SPACING.xl,
    marginTop: 8,
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFE3E2',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  locWarnText: { flex: 1, fontSize: 12, color: COLORS.error, fontWeight: '600' },

  searchBar: {
    marginHorizontal: SPACING.xl,
    marginTop: 12,
    height: 44,
    backgroundColor: QM.fieldBg,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: QM.ink },

  catRow: { paddingHorizontal: SPACING.xl, gap: 6, paddingVertical: 10 },
  catPill: {
    paddingHorizontal: 13, paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: QM.card,
    borderWidth: 1, borderColor: QM.hairline,
  },
  catPillActive: { backgroundColor: QM.coral, borderColor: QM.coral },
  catText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[700] },
  catTextActive: { color: COLORS.white, fontWeight: '700' },

  countRow: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 10,
    paddingTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: { fontSize: 13, color: COLORS.ink[600] },
  countStrong: { color: QM.coral, fontWeight: '800' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sortText: { fontSize: 13, color: COLORS.ink[700], fontWeight: '500' },

  listWrap: { paddingHorizontal: SPACING.xl, gap: 12 },

  moreBtn: {
    marginTop: 4,
    height: 48,
    borderRadius: 14,
    backgroundColor: QM.coralSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  moreBtnText: { fontSize: 14, fontWeight: '700', color: QM.coral },

  couponHero: {
    marginHorizontal: SPACING.xl,
    marginTop: 16,
    marginBottom: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: QM.coralSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  couponHeroIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: QM.card,
    alignItems: 'center', justifyContent: 'center',
  },
  couponHeroTitle: { fontSize: 16, fontWeight: '800', color: QM.ink, letterSpacing: -0.3 },
  couponHeroSub: { fontSize: 12, color: COLORS.ink[700], marginTop: 3 },
  couponHeroBadge: {
    minWidth: 32, height: 24, borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: QM.coral,
    alignItems: 'center', justifyContent: 'center',
  },
  couponHeroBadgeText: { fontSize: 12, fontWeight: '800', color: COLORS.white, fontVariant: ['tabular-nums'] },
});

const aStyles = StyleSheet.create({
  card: {
    backgroundColor: QM.card,
    borderRadius: 18,
    overflow: 'hidden',
    ...QM.cardShadow,
  },
  img: { width: '100%', height: 140, backgroundColor: COLORS.ink[100] },
  imgEmpty: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 4 },
  headRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 4,
  },
  catBadge: {
    backgroundColor: QM.coralSoft,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  catText: { fontSize: 10, fontWeight: '700', color: QM.coral },
  distBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: QM.fieldBg,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6,
  },
  distText: { fontSize: 10, fontWeight: '700', color: QM.coral, fontVariant: ['tabular-nums'] },
  name: { fontSize: 15, fontWeight: '800', color: QM.ink },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  addr: { fontSize: 12, color: COLORS.ink[500], flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  rating: { fontSize: 12, fontWeight: '700', color: COLORS.ink[900] },
  review: { fontSize: 12, color: COLORS.ink[500] },
  newBadge: { fontSize: 11, fontWeight: '700', color: QM.coral },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.ink[300], marginHorizontal: 4 },
  stat: { fontSize: 11, color: COLORS.ink[600], fontWeight: '500' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: COLORS.ink[100] },
  tagText: { fontSize: 11, color: COLORS.ink[700], fontWeight: '500' },
});

const couponStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: QM.card,
    borderRadius: 18,
    overflow: 'hidden',
    ...QM.cardShadow,
  },
  leftBar: { width: 4, backgroundColor: QM.coral },
  body: { flex: 1, padding: 16, gap: 4 },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: QM.coralSoft,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  typeText: { fontSize: 10, fontWeight: '700', color: QM.coral },
  title: { fontSize: 15, fontWeight: '800', color: QM.ink },
  partner: { fontSize: 12, color: COLORS.ink[500], marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  meta: { fontSize: 11, color: COLORS.ink[500] },
  dotSep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.ink[300], marginHorizontal: 4 },
  remain: { fontSize: 11, color: QM.coral, fontWeight: '700' },
  right: {
    width: 110,
    borderLeftWidth: 1,
    borderLeftColor: QM.hairline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: QM.coralSoft,
  },
  value: { fontSize: 20, fontWeight: '800', color: QM.coral, letterSpacing: -0.5 },
});
