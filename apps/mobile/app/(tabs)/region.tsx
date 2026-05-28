import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Image,
  StatusBar,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { EmptyState } from '../../src/components/EmptyState';
import {
  getAcademies,
  getCoupons,
  downloadCoupon,
  type Academy,
  type Coupon,
} from '../../src/api/region';

const CATEGORIES = ['전체', '태권도', '영어', '수학', '피아노', '미술', '코딩'];

const LOCATION_OPTIONS = ['서울 강남구', '서울 서초구', '서울 송파구', '서울 마포구', '경기 성남시 분당구'];
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

function AcademyCard({ a, onPress }: { a: Academy; onPress: () => void }) {
  const thumb = a.photos && a.photos.length ? a.photos[0] : undefined;
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
        {a.category ? (
          <View style={aStyles.catBadge}>
            <Text style={aStyles.catText}>{a.category}</Text>
          </View>
        ) : null}
        <Text style={aStyles.name} numberOfLines={1}>{a.name}</Text>
        <View style={aStyles.addrRow}>
          <Ionicons name="location-outline" size={12} color={COLORS.ink[500]} />
          <Text style={aStyles.addr} numberOfLines={1}>{a.address || a.region || ''}</Text>
        </View>
        <View style={aStyles.metaRow}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={aStyles.rating}>{a.rating}</Text>
          <Text style={aStyles.review}>({a.reviewCount})</Text>
          <View style={aStyles.dot} />
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

export default function RegionScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('academies');
  const [category, setCategory] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(LOCATION_OPTIONS[0]);
  const [sort, setSort] = useState<SortKey>('popular');
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [ac, cp] = await Promise.all([
        getAcademies({ limit: 50 } as any).catch(() => ({ items: [] as Academy[] })),
        getCoupons().catch(() => ({ items: [] as Coupon[] })),
      ]);
      setAcademies((ac?.items as Academy[]) || []);
      setCoupons((cp?.items as Coupon[]) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredAcademies = academies.filter((a) => {
    const matchCat = category === '전체' || a.category === category;
    const kw = keyword.trim();
    const matchKeyword =
      !kw || a.name.includes(kw) || (a.address || '').includes(kw) || (a.region || '').includes(kw);
    return matchCat && matchKeyword;
  });

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

  const handlePickLocation = () => {
    showActionSheet('지역 선택', LOCATION_OPTIONS, (idx) => setLocation(LOCATION_OPTIONS[idx]));
  };

  const handlePickSort = () => {
    showActionSheet(
      '정렬 기준',
      SORT_OPTIONS.map((o) => o.label),
      (idx) => setSort(SORT_OPTIONS[idx].key),
    );
  };

  const resetAcademyFilters = () => {
    setKeyword('');
    setCategory('전체');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.topbar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>우리지역</Text>
            <TouchableOpacity style={styles.locRow} onPress={handlePickLocation} activeOpacity={0.7}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.loc}>{location}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.ink[500]} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/search')}>
            <Ionicons name="search-outline" size={22} color={COLORS.ink[800]} />
          </TouchableOpacity>
        </View>

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

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
        ) : tab === 'academies' ? (
          <>
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
                총 <Text style={styles.countStrong}>{filteredAcademies.length}</Text>개
              </Text>
              <TouchableOpacity style={styles.sortBtn} onPress={handlePickSort}>
                <Text style={styles.sortText}>{sortLabel}</Text>
                <Ionicons name="chevron-down" size={12} color={COLORS.ink[700]} />
              </TouchableOpacity>
            </View>

            {academies.length === 0 ? (
              <EmptyState
                icon="school-outline"
                title="등록된 학원이 없어요"
                subtitle={'관리자 페이지에서 학원을 등록하면\n이곳에 노출됩니다.'}
              />
            ) : filteredAcademies.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title="검색 결과가 없어요"
                subtitle={`'${keyword || category}' 와(과) 일치하는 학원을\n찾지 못했어요. 다른 조건으로 시도해 보세요.`}
                actionLabel="조건 초기화"
                onAction={resetAcademyFilters}
              />
            ) : (
              <View style={styles.listWrap}>
                {filteredAcademies.map((a) => (
                  <AcademyCard key={a.id} a={a} onPress={() => router.push(`/region/${a.id}` as any)} />
                ))}
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },

  topbar: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 6,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.5 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-start' },
  loc: { fontSize: 13, color: COLORS.ink[700], fontWeight: '600' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.ink[50],
  },

  segment: {
    marginHorizontal: SPACING.xl,
    flexDirection: 'row',
    backgroundColor: COLORS.ink[100],
    borderRadius: 10,
    padding: 4,
  },
  segItem: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segItemActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[500] },
  segTextActive: { color: COLORS.ink[900], fontWeight: '700' },

  searchBar: {
    marginHorizontal: SPACING.xl,
    marginTop: 12,
    height: 40,
    backgroundColor: COLORS.ink[100],
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.ink[900] },

  catRow: { paddingHorizontal: SPACING.xl, gap: 6, paddingVertical: 10 },
  catPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.ink[200],
  },
  catPillActive: { backgroundColor: COLORS.ink[900], borderColor: COLORS.ink[900] },
  catText: { fontSize: 13, fontWeight: '500', color: COLORS.ink[700] },
  catTextActive: { color: COLORS.white, fontWeight: '600' },

  countRow: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 10,
    paddingTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: { fontSize: 13, color: COLORS.ink[600] },
  countStrong: { color: COLORS.ink[900], fontWeight: '700' },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sortText: { fontSize: 13, color: COLORS.ink[700], fontWeight: '500' },

  listWrap: { paddingHorizontal: SPACING.xl, gap: 12 },

  couponHero: {
    marginHorizontal: SPACING.xl,
    marginTop: 16,
    marginBottom: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  couponHeroIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  couponHeroTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  couponHeroSub: { fontSize: 12, color: COLORS.ink[700], marginTop: 3 },
  couponHeroBadge: {
    minWidth: 32, height: 24, borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  couponHeroBadgeText: { fontSize: 12, fontWeight: '800', color: COLORS.white, fontVariant: ['tabular-nums'] },
});

const aStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
  },
  img: { width: '100%', height: 140, backgroundColor: COLORS.ink[100] },
  imgEmpty: { alignItems: 'center', justifyContent: 'center' },
  body: { padding: 14, gap: 4 },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  catText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.ink[900] },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  addr: { fontSize: 12, color: COLORS.ink[500], flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  rating: { fontSize: 12, fontWeight: '700', color: COLORS.ink[900] },
  review: { fontSize: 12, color: COLORS.ink[500] },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.ink[300], marginHorizontal: 4 },
  stat: { fontSize: 11, color: COLORS.ink[600], fontWeight: '500' },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: COLORS.ink[100] },
  tagText: { fontSize: 11, color: COLORS.ink[700], fontWeight: '500' },
});

const couponStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
  },
  leftBar: { width: 4, backgroundColor: COLORS.primary },
  body: { flex: 1, padding: 16, gap: 4 },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  typeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.ink[900] },
  partner: { fontSize: 12, color: COLORS.ink[500], marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  meta: { fontSize: 11, color: COLORS.ink[500] },
  dotSep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.ink[300], marginHorizontal: 4 },
  remain: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  right: {
    width: 110,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.divider,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink[50],
  },
  value: { fontSize: 20, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
});
