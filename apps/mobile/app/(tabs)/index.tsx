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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { getHomeData, type Mall as ApiMall } from '../../src/api/home';
import { getProducts, type Product as ApiProduct } from '../../src/api/products';

// 쇼핑몰 아이콘 매핑 (DB에 logoUrl 컬럼 없어 당분간 Clearbit 로고 + platform 기준 wordmark)
const MALL_DISPLAY_OVERRIDE: Record<string, { wordmark: string }> = {
  coupang: { wordmark: 'C' },
  naver: { wordmark: 'N' },
  '11st': { wordmark: '11' },
  gmarket: { wordmark: 'G' },
  ssg: { wordmark: 'SSG' },
  lotteon: { wordmark: 'L' },
  wemakeprice: { wordmark: '위메프' },
  tmon: { wordmark: '티몬' },
};

function mallLogoUrl(baseUrl?: string): string | undefined {
  if (!baseUrl) return undefined;
  try {
    const u = new URL(baseUrl);
    return `https://logo.clearbit.com/${u.hostname}?size=120`;
  } catch {
    return undefined;
  }
}

function mallLabel(malls: ApiMall[], platform: string): string {
  return malls.find((m) => m.platform === platform)?.name || platform;
}

const QUICK_MENU = [
  { key: 'history', label: '적립내역', icon: 'receipt-outline', route: '/(tabs)/cashback' },
  { key: 'alert', label: '적립알림', icon: 'notifications-outline', route: '/(tabs)/cashback' },
  { key: 'invite', label: '친구초대', icon: 'person-add-outline', route: '/(tabs)/mypage' },
  { key: 'support', label: '고객센터', icon: 'headset-outline', route: '/(tabs)/mypage' },
] as const;

function formatMoney(v: number) {
  return v.toLocaleString();
}

function calcCashback(price: number, rate: number) {
  return Math.round(price * rate / 100);
}

const PROMO_BADGE_LABEL: Record<string, { text: string; bg: string; fg: string }> = {
  time_deal: { text: '타임특가', bg: '#E0311E', fg: '#FFFFFF' },
  rate_up:   { text: '상향 캐시백', bg: '#EEEEFF', fg: '#4B4BF4' },
  welcome:   { text: '웰컴 혜택', bg: '#FFE6DC', fg: '#FF6B35' },
};

function formatPromoCountdown(endsAt?: string | null): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  const diff = end - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}시간 후 종료`;
  const days = Math.floor(hours / 24);
  return `${days}일 후 종료`;
}

function MallCell({ mall, onPress }: { mall: ApiMall; onPress: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoUrl = mallLogoUrl(mall.baseUrl);
  const useImage = !!logoUrl && !imgFailed;
  const wordmark = MALL_DISPLAY_OVERRIDE[mall.platform]?.wordmark ?? mall.name.slice(0, 1);
  const badge = mall.promoBadge ? PROMO_BADGE_LABEL[mall.promoBadge] : null;
  const countdown = formatPromoCountdown(mall.promoEndsAt);
  const prevRate = mall.previousCashbackRate != null ? Number(mall.previousCashbackRate) : null;
  return (
    <TouchableOpacity style={mallStyles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={mallStyles.logoWrap}>
        <View style={[mallStyles.logoBox, !useImage && { backgroundColor: mall.color, borderColor: mall.color }]}>
          {useImage ? (
            <Image
              source={{ uri: logoUrl }}
              style={mallStyles.logoImg}
              resizeMode="contain"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <Text style={mallStyles.logoFallback} numberOfLines={1}>{wordmark}</Text>
          )}
        </View>
        {badge ? (
          <View style={[mallStyles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[mallStyles.badgeText, { color: badge.fg }]}>{badge.text}</Text>
          </View>
        ) : null}
      </View>
      <Text style={mallStyles.name} numberOfLines={1}>{mall.name}</Text>
      <View style={mallStyles.rateRow}>
        <Text style={mallStyles.rateText}>최대 {Number(mall.cashbackRate)}%</Text>
        {prevRate != null ? (
          <Text style={mallStyles.prevRateText}>{prevRate}%</Text>
        ) : null}
      </View>
      {countdown ? <Text style={mallStyles.countdownText}>{countdown}</Text> : null}
    </TouchableOpacity>
  );
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Top bar */}
        <View style={styles.topbar}>
          <Text style={styles.logo}>더블윈</Text>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/search')}>
              <Ionicons name="search-outline" size={24} color={COLORS.ink[800]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.ink[800]} />
              <View style={styles.dot} />
            </TouchableOpacity>
          </View>
        </View>

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

        {/* Cashback card */}
        <View style={styles.cashcard}>
          <View style={styles.cashcardRow}>
            <Text style={styles.cashcardLabel}>내 캐시백</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/cashback')} style={styles.moreLinkRow}>
              <Text style={styles.cashcardMore}>전체보기</Text>
              <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
          <View style={styles.cashcardAmountRow}>
            <Text style={styles.cashcardAmount}>{formatMoney(balance)}</Text>
            <Text style={styles.cashcardUnit}>원</Text>
          </View>
          <View style={styles.cashcardStats}>
            <View style={styles.stat}>
              <Text style={styles.statKey}>이번 달 적립</Text>
              <Text style={styles.statVal}>{formatMoney(monthEarned)}원</Text>
            </View>
            <View style={styles.statSep} />
            <View style={styles.stat}>
              <Text style={styles.statKey}>누적 적립</Text>
              <Text style={styles.statVal}>{formatMoney(totalEarned)}원</Text>
            </View>
            <TouchableOpacity style={styles.withdraw} onPress={() => router.push('/(tabs)/cashback')}>
              <Text style={styles.withdrawText}>출금하기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick menu */}
        <View style={styles.quickmenu}>
          {QUICK_MENU.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={styles.quickItem}
              onPress={() => router.push(m.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.quickIcon}>
                <Ionicons name={m.icon as any} size={22} color={COLORS.ink[800]} />
              </View>
              <Text style={styles.quickLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
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
          ) : malls.length === 0 ? (
            <Text style={{ width: '100%', textAlign: 'center', color: COLORS.ink[400], paddingVertical: 20 }}>
              등록된 쇼핑몰이 없습니다
            </Text>
          ) : (
            malls.map((m) => (
              <MallCell
                key={m.id}
                mall={m}
                onPress={() => router.push(`/mall/${m.platform}` as any)}
              />
            ))
          )}
        </View>

        {/* Promo banner */}
        <TouchableOpacity style={styles.promo} activeOpacity={0.9}>
          <View style={{ flex: 1 }}>
            <View style={styles.promoBadge}>
              <Text style={styles.promoBadgeText}>신규 혜택</Text>
            </View>
            <Text style={styles.promoTitle}>첫 구매 캐시백 2배</Text>
            <Text style={styles.promoSub}>4월 한정 · 최대 10,000원</Text>
          </View>
          <View style={styles.promoArt}>
            <Ionicons name="gift-outline" size={36} color={COLORS.primary} />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

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
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },

  topbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  logo: { fontSize: 22, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.5 },
  topActions: { flexDirection: 'row', gap: SPACING.lg },
  iconBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  dot: { position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },

  guideBanner: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xs,
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

  cashcard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.ink[900],
    borderRadius: RADIUS.xl,
    padding: 22,
    overflow: 'hidden',
  },
  cashcardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashcardLabel: { fontSize: 13, color: COLORS.ink[400], fontWeight: '500' },
  moreLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cashcardMore: { fontSize: 12, color: COLORS.ink[300] },
  cashcardAmountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
  cashcardAmount: { fontSize: 32, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  cashcardUnit: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginLeft: 2 },
  cashcardStats: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: { gap: 3 },
  statKey: { fontSize: 11, color: COLORS.ink[400], fontWeight: '500' },
  statVal: { fontSize: 15, color: COLORS.white, fontWeight: '600' },
  statSep: { width: StyleSheet.hairlineWidth, height: 24, backgroundColor: 'rgba(255,255,255,0.14)', marginHorizontal: 14 },
  withdraw: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  withdrawText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },

  quickmenu: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: 24 },
  quickItem: { flex: 1, alignItems: 'center', gap: 8 },
  quickIcon: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.ink[100],
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 12, color: COLORS.ink[700], fontWeight: '500' },

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

  promo: {
    marginHorizontal: SPACING.xl,
    marginTop: 16,
    backgroundColor: '#FAF6F0',
    borderRadius: RADIUS.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.primarySoft,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, marginBottom: 8,
  },
  promoBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  promoTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink[900], marginBottom: 4 },
  promoSub: { fontSize: 12, color: COLORS.ink[600] },
  promoArt: {
    width: 88, height: 88, borderRadius: 18,
    backgroundColor: '#FFE5D6',
    alignItems: 'center', justifyContent: 'center',
  },

  divider: { height: 8, backgroundColor: COLORS.ink[50], marginTop: 24 },

  dealScroll: { paddingHorizontal: SPACING.xl, gap: 12 },
  recGrid: {
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

const mallStyles = StyleSheet.create({
  item: { width: '25%', alignItems: 'center', gap: 4 },
  logoWrap: { position: 'relative' },
  logoBox: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.ink[200],
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  logoImg: { width: 40, height: 40 },
  logoFallback: { fontSize: 16, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  badge: {
    position: 'absolute',
    top: -4,
    left: -2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
  name: { fontSize: 12, fontWeight: '500', color: COLORS.ink[800], marginTop: 2 },
  rateRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  rateText: { fontSize: 11, fontWeight: '800', color: COLORS.ink[900] },
  prevRateText: {
    fontSize: 10,
    color: COLORS.ink[400],
    textDecorationLine: 'line-through',
  },
  countdownText: { fontSize: 9, color: COLORS.error, fontWeight: '600' },
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
