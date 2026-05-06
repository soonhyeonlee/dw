import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { getHomeData, type Mall as ApiMall } from '../../src/api/home';
import { getProducts, type Product as ApiProduct } from '../../src/api/products';
import { PromoCarousel, type PromoSlide } from '../../src/components/PromoCarousel';
import { MallCard } from '../../src/components/MallCard';

function mallLabel(malls: ApiMall[], platform: string): string {
  return malls.find((m) => m.platform === platform)?.name || platform;
}

const QUICK_MENU = [
  { key: 'history', label: '적립내역', icon: 'receipt-outline', tint: '#FF6B35', route: '/(tabs)/cashback' },
  { key: 'alert',   label: '적립알림', icon: 'notifications-outline', tint: '#1673E8', route: '/(tabs)/cashback' },
  { key: 'invite',  label: '친구초대', icon: 'person-add-outline', tint: '#118658', route: '/(tabs)/mypage' },
  { key: 'support', label: '고객센터', icon: 'headset-outline', tint: '#9B77F7', route: '/(tabs)/mypage' },
  { key: 'guide',   label: '이용가이드', icon: 'book-outline', tint: '#E97DCE', route: '/guide' },
] as const;

const SEGMENTS = [
  { key: 'all',     label: '전체',         category: null,        badge: null },
  { key: 'travel',  label: '여행',         category: '여행·예약', badge: 'NEW' },
  { key: 'digital', label: '디지털·가전',  category: '가전·디지털', badge: null },
  { key: 'fashion', label: '패션·뷰티',    category: '패션',      badge: null },
] as const;

const DAILY_LABELS = ['실시간', '오늘', '+1일', '+2일', '+3일', '+4일'] as const;

function formatMoney(v: number) {
  return v.toLocaleString();
}

function calcCashback(price: number, rate: number) {
  return Math.round(price * rate / 100);
}

function PROMO_SLIDES(router: ReturnType<typeof useRouter>): PromoSlide[] {
  return [
    {
      id: 'welcome2x',
      badge: '신규 혜택',
      title: '첫 구매 캐시백 2배',
      subtitle: '이달 한정 · 최대 10,000원',
      bg: ['#FF6B35', '#E55A2B'],
      onPress: () => router.push('/guide'),
    },
    {
      id: 'signup5k',
      badge: '회원가입',
      title: '가입 즉시 5,000원 적립',
      subtitle: '이메일 인증만 완료하면 OK',
      bg: ['#4B4BF4', '#6161FF'],
      onPress: () => router.push('/auth/register' as any),
    },
    {
      id: 'tier-up',
      badge: '협회 회원',
      title: '협회 회원 캐시백 +1%',
      subtitle: '모든 쇼핑몰에서 추가 적립',
      bg: ['#118658', '#176644'],
      onPress: () => router.push('/(tabs)/mypage'),
    },
  ];
}

function DealCard({ p, label, onPress }: { p: ApiProduct; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={dealStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={dealStyles.imgBox}>
        <Image source={{ uri: p.imageUrl }} style={dealStyles.img} resizeMode="cover" />
        <View style={dealStyles.mallBadge}>
          <Text style={dealStyles.mallBadgeText}>{label}</Text>
        </View>
        <TouchableOpacity style={dealStyles.likeBtn}>
          <Ionicons name="heart-outline" size={16} color={COLORS.ink[700]} />
        </TouchableOpacity>
      </View>
      <View style={dealStyles.priceRow}>
        {p.discountRate ? <Text style={dealStyles.discount}>{Number(p.discountRate)}%</Text> : null}
        <Text style={dealStyles.price}>{formatMoney(Number(p.price))}원</Text>
      </View>
      <Text style={dealStyles.name} numberOfLines={2}>{p.title}</Text>
      <Text style={dealStyles.cb}>캐시백 {formatMoney(calcCashback(Number(p.price), Number(p.cashbackRate)))}원</Text>
    </TouchableOpacity>
  );
}

function RecCard({ p, label, onPress }: { p: ApiProduct; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={recStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={recStyles.imgBox}>
        <Image source={{ uri: p.imageUrl }} style={recStyles.img} resizeMode="cover" />
        <View style={recStyles.mallBadge}>
          <Text style={recStyles.mallBadgeText}>{label}</Text>
        </View>
        <TouchableOpacity style={recStyles.likeBtn}>
          <Ionicons name="heart-outline" size={16} color={COLORS.ink[700]} />
        </TouchableOpacity>
      </View>
      <Text style={recStyles.name} numberOfLines={2}>{p.title}</Text>
      <View style={recStyles.priceRow}>
        {p.discountRate ? <Text style={recStyles.discount}>{Number(p.discountRate)}%</Text> : null}
        <Text style={recStyles.price}>{formatMoney(Number(p.price))}원</Text>
      </View>
      <Text style={recStyles.cb}>캐시백 {formatMoney(calcCashback(Number(p.price), Number(p.cashbackRate)))}원</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [malls, setMalls] = useState<ApiMall[]>([]);
  const [segment, setSegment] = useState<typeof SEGMENTS[number]['key']>('all');
  const [dealProducts, setDealProducts] = useState<ApiProduct[]>([]);
  const [recProducts, setRecProducts] = useState<ApiProduct[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [home, products] = await Promise.all([
        getHomeData().catch(() => ({ blocks: [], malls: [] as ApiMall[] })),
        getProducts({ limit: 20 }).catch(() => ({ items: [] as ApiProduct[] })),
      ]);
      setMalls(home.malls || []);
      const items: ApiProduct[] = products.items || [];
      // 오늘의 딜: 할인율 높은 순 상위 6개
      const deals = [...items]
        .filter((p) => Number(p.discountRate || 0) > 0)
        .sort((a, b) => Number(b.discountRate || 0) - Number(a.discountRate || 0))
        .slice(0, 6);
      // 이번 주 추천: 리뷰수 많은 순 상위 6개
      const recs = [...items]
        .sort((a, b) => Number(b.reviewCount || 0) - Number(a.reviewCount || 0))
        .slice(0, 6);
      setDealProducts(deals);
      setRecProducts(recs);
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

  const balance = isAuthenticated ? Number(user?.cashbackBalance || 0) : 0;
  const totalEarned = isAuthenticated ? Number(user?.totalEarned || 0) : 0;
  const monthEarned = isAuthenticated ? Number((user as any)?.monthEarned || 0) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Hero: orange gradient header (greeting + actions + cashback) */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGreeting} numberOfLines={1}>
                {isAuthenticated ? `안녕하세요, ${user?.nickname || '회원'}님` : '안녕하세요!'}
              </Text>
              <Text style={styles.heroSub}>오늘도 캐시백 받고 쇼핑하세요</Text>
            </View>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => router.push('/(tabs)/search')}>
              <Ionicons name="search-outline" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.white} />
              <View style={styles.heroDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroCashRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroCashLabel}>내 캐시백</Text>
              <View style={styles.heroAmountRow}>
                <Text style={styles.heroAmount}>{formatMoney(balance)}</Text>
                <Text style={styles.heroAmountUnit}>원</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.heroWithdraw} onPress={() => router.push('/(tabs)/cashback')}>
              <Text style={styles.heroWithdrawText}>출금</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatKey}>이번 달</Text>
              <Text style={styles.heroStatVal}>{formatMoney(monthEarned)}원</Text>
            </View>
            <View style={styles.heroStatSep} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatKey}>누적</Text>
              <Text style={styles.heroStatVal}>{formatMoney(totalEarned)}원</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Welcome guide banner */}
        <TouchableOpacity
          style={styles.guideBanner}
          activeOpacity={0.85}
          onPress={() => router.push('/guide')}
        >
          <View style={styles.guideBannerIcon}>
            <Ionicons name="book-outline" size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.guideBannerTitle} numberOfLines={1}>
              캐시백 받으며 쇼핑하는 방법을 알려드릴게요
            </Text>
            <Text style={styles.guideBannerSub}>이용 가이드 알아보기</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.ink[400]} />
        </TouchableOpacity>

        {/* Quick action chips (horizontal scroll) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipScroll}
        >
          {QUICK_MENU.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={styles.quickChip}
              onPress={() => router.push(m.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickChipIcon, { backgroundColor: `${m.tint}1A` }]}>
                <Ionicons name={m.icon as any} size={22} color={m.tint} />
              </View>
              <Text style={styles.quickChipLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Segment tabs */}
        <View style={styles.segmentRow}>
          {SEGMENTS.map((s) => {
            const active = segment === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                style={styles.segmentTab}
                onPress={() => setSegment(s.key)}
                activeOpacity={0.7}
              >
                <View style={styles.segmentLabelGroup}>
                  <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{s.label}</Text>
                  {s.badge ? (
                    <View style={styles.segmentBadge}>
                      <Text style={styles.segmentBadgeText}>{s.badge}</Text>
                    </View>
                  ) : null}
                </View>
                {active ? <View style={styles.segmentUnderline} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mall grid */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleGroup}>
            <Text style={styles.sectionTitle}>쇼핑몰 바로가기</Text>
            <Text style={styles.sectionSub}>경유하면 캐시백</Text>
          </View>
          <TouchableOpacity style={styles.moreBtn} onPress={() => router.push('/categories' as any)}>
            <Text style={styles.moreText}>전체</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.ink[500]} />
          </TouchableOpacity>
        </View>
        <View style={styles.mallGrid}>
          {loading && malls.length === 0 ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ width: '100%', paddingVertical: 20 }} />
          ) : (() => {
            const seg = SEGMENTS.find((s) => s.key === segment)!;
            const filtered = seg.category ? malls.filter((m) => m.category === seg.category) : malls;
            if (filtered.length === 0) {
              return (
                <Text style={{ width: '100%', textAlign: 'center', color: COLORS.ink[400], paddingVertical: 20 }}>
                  {seg.category ? `${seg.label} 카테고리 쇼핑몰이 곧 추가됩니다` : '등록된 쇼핑몰이 없습니다'}
                </Text>
              );
            }
            return filtered.map((m) => (
              <MallCard
                key={m.id}
                mall={m}
                variant="home"
                onPress={() => router.push(`/mall/${m.platform}` as any)}
              />
            ));
          })()}
        </View>

        {/* Promo carousel */}
        <View style={{ marginTop: 16 }}>
          <PromoCarousel slides={PROMO_SLIDES(router)} />
        </View>

        <View style={styles.divider} />

        {/* Daily cashback grid */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleGroup}>
            <Text style={styles.sectionTitle}>일자별 인기 캐시백</Text>
            <Text style={styles.sectionSub}>매일 새로 갱신</Text>
          </View>
          <TouchableOpacity style={styles.moreBtn} onPress={() => router.push('/categories' as any)}>
            <Text style={styles.moreText}>전체</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.ink[500]} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dailyScroll}>
          {DAILY_LABELS.map((label, i) => {
            const m = malls[i % Math.max(1, malls.length)];
            if (!m) {
              return (
                <View key={label} style={dailyStyles.cell}>
                  <View style={[dailyStyles.logoBox, { backgroundColor: COLORS.ink[100] }]} />
                  <Text style={dailyStyles.dayLabel}>{label}</Text>
                </View>
              );
            }
            return (
              <TouchableOpacity
                key={`${label}-${m.id}`}
                style={dailyStyles.cell}
                onPress={() => router.push(`/mall/${m.platform}` as any)}
                activeOpacity={0.85}
              >
                <View style={[dailyStyles.logoBox, { backgroundColor: m.color || COLORS.ink[600] }]}>
                  <Text style={dailyStyles.logoText}>{m.name.slice(0, 1)}</Text>
                </View>
                <Text style={dailyStyles.rate}>최대 {Number(m.cashbackRate)}%</Text>
                <Text style={dailyStyles.dayLabel}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.divider, { marginTop: 18 }]} />

        {/* Today's deal */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>오늘의 딜</Text>
          <Text style={styles.timer}>23 : 14 : 02</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dealScroll}
        >
          {loading && dealProducts.length === 0 ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginHorizontal: 60 }} />
          ) : dealProducts.length === 0 ? (
            <Text style={{ color: COLORS.ink[400], paddingVertical: 20 }}>딜 상품이 아직 없습니다</Text>
          ) : (
            dealProducts.map((p) => (
              <DealCard
                key={p.id}
                p={p}
                label={mallLabel(malls, p.platform)}
                onPress={() => router.push(`/product/${p.id}` as any)}
              />
            ))
          )}
        </ScrollView>

        {/* Recommended */}
        <View style={[styles.sectionHead, { paddingTop: 28 }]}>
          <Text style={styles.sectionTitle}>이번 주 추천</Text>
          <TouchableOpacity style={styles.moreBtn}>
            <Text style={styles.moreText}>더보기</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.ink[500]} />
          </TouchableOpacity>
        </View>
        <View style={styles.recGrid}>
          {loading && recProducts.length === 0 ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ width: '100%', paddingVertical: 20 }} />
          ) : recProducts.length === 0 ? (
            <Text style={{ width: '100%', textAlign: 'center', color: COLORS.ink[400], paddingVertical: 20 }}>
              추천 상품이 아직 없습니다
            </Text>
          ) : (
            recProducts.map((p) => (
              <RecCard
                key={p.id}
                p={p}
                label={mallLabel(malls, p.platform)}
                onPress={() => router.push(`/product/${p.id}` as any)}
              />
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryDark },
  container: { flex: 1, backgroundColor: COLORS.background },

  hero: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 12,
    paddingBottom: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  heroGreeting: { fontSize: 17, fontWeight: '700', color: COLORS.white, letterSpacing: -0.3 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  heroIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    position: 'relative',
  },
  heroDot: {
    position: 'absolute', top: 7, right: 8,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#FFD94E',
    borderWidth: 1, borderColor: COLORS.primaryDark,
  },
  heroCashRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 6,
  },
  heroCashLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  heroAmountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  heroAmount: { fontSize: 32, fontWeight: '800', color: COLORS.white, letterSpacing: -0.6 },
  heroAmountUnit: { fontSize: 18, fontWeight: '700', color: COLORS.white, marginLeft: 3 },
  heroWithdraw: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroWithdrawText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  heroStatsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 16, paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.22)',
  },
  heroStat: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  heroStatKey: { fontSize: 11, color: 'rgba(255,255,255,0.78)', fontWeight: '500' },
  heroStatVal: { fontSize: 13, color: COLORS.white, fontWeight: '700' },
  heroStatSep: { width: StyleSheet.hairlineWidth, height: 14, backgroundColor: 'rgba(255,255,255,0.28)', marginHorizontal: 14 },

  guideBanner: {
    marginHorizontal: SPACING.xl,
    marginTop: 16,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.ink[100],
  },
  guideBannerIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  guideBannerTitle: { fontSize: 13, fontWeight: '600', color: COLORS.ink[800] },
  guideBannerSub: { fontSize: 11, color: COLORS.ink[500], marginTop: 2 },


  quickChipScroll: { paddingHorizontal: SPACING.md, paddingVertical: 18, gap: 14 },
  quickChip: { width: 64, alignItems: 'center', gap: 6 },
  quickChipIcon: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  quickChipLabel: { fontSize: 11, color: COLORS.ink[800], fontWeight: '500' },

  segmentRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink[100],
  },
  segmentTab: { paddingVertical: 12, marginRight: 22, alignItems: 'flex-start' },
  segmentLabelGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  segmentLabel: { fontSize: 15, color: COLORS.ink[500], fontWeight: '600', letterSpacing: -0.3 },
  segmentLabelActive: { color: COLORS.ink[900], fontWeight: '800' },
  segmentBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 4,
  },
  segmentBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.white, letterSpacing: 0.3 },
  segmentUnderline: {
    position: 'absolute',
    left: 0, right: 0, bottom: -1,
    height: 2,
    backgroundColor: COLORS.ink[900],
  },

  sectionHead: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitleGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.ink[900], letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: COLORS.ink[500], fontWeight: '500' },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moreText: { fontSize: 12, color: COLORS.ink[500] },
  timer: { fontSize: 12, fontWeight: '700', color: COLORS.primary, fontVariant: ['tabular-nums'] },

  mallGrid: {
    paddingHorizontal: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },

  divider: { height: 8, backgroundColor: COLORS.ink[50], marginTop: 24 },

  dailyScroll: { paddingHorizontal: SPACING.xl, gap: 10, paddingBottom: 4 },

  dealScroll: { paddingHorizontal: SPACING.xl, gap: 12 },
  recGrid: {
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

const dailyStyles = StyleSheet.create({
  cell: { width: 88, alignItems: 'center', gap: 6 },
  logoBox: {
    width: 72, height: 72, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 22, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  rate: { fontSize: 12, fontWeight: '800', color: COLORS.ink[900] },
  dayLabel: { fontSize: 11, color: COLORS.ink[600], fontWeight: '600' },
});

const dealStyles = StyleSheet.create({
  card: { width: 160, gap: 8 },
  imgBox: {
    width: 160, height: 160,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[100],
    overflow: 'hidden',
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  mallBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(17,24,39,0.82)',
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 6,
  },
  mallBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  likeBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  discount: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.ink[900] },
  name: { fontSize: 12, color: COLORS.ink[700], lineHeight: 16 },
  cb: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
});

const recStyles = StyleSheet.create({
  card: { width: '48%', gap: 6 },
  imgBox: {
    width: '100%', aspectRatio: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[100],
    overflow: 'hidden',
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  mallBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(17,24,39,0.82)',
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 6,
  },
  mallBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  likeBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 13, color: COLORS.ink[800], lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  discount: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  price: { fontSize: 14, fontWeight: '800', color: COLORS.ink[900] },
  cb: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
});
