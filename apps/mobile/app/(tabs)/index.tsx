import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  useWindowDimensions,
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
import { MallLogo } from '../../src/components/MallLogo';
import { MarketContent } from '../../src/components/home/MarketContent';
import { RegionContent } from '../../src/components/home/RegionContent';

function mallLabel(malls: ApiMall[], platform: string): string {
  return malls.find((m) => m.platform === platform)?.name || platform;
}

const QUICK_MENU = [
  { key: 'welcome', emoji: '✨', label: '웰컴 혜택',     route: '/guide',          highlight: true },
  { key: 'travel',  emoji: '✈️', label: '여행 특가',     route: '/(tabs)/search'  },
  { key: 'history', emoji: '🧾', label: '적립내역',       route: '/(tabs)/cashback' },
  { key: 'support', emoji: '💬', label: '고객센터',       route: '/(tabs)/mypage'  },
] as const;

// 홈 상단 폴더형 탭. 모두 홈 내부에서 콘텐츠 교체.
// 탭 누르면 탭 윗단이 화면 상단에 붙도록 스크롤 (sticky tab).
const FOLDER_TABS = [
  { key: 'shop',   label: '쇼핑' },
  { key: 'market', label: '번개장터' },
  { key: 'region', label: '우리지역' },
  { key: 'travel', label: '여행' },
] as const;
type FolderTabKey = typeof FOLDER_TABS[number]['key'];

const DAILY_LABELS = ['실시간', '오늘', '+1일', '+2일', '+3일', '+4일'] as const;

const PROMO_BADGE_LABEL: Record<string, { text: string; bg: string; fg: string }> = {
  time_deal: { text: '타임특가', bg: '#E0311E', fg: '#FFFFFF' },
  rate_up:   { text: '상향', bg: '#EEEEFF', fg: '#4B4BF4' },
  welcome:   { text: '웰컴', bg: '#FFE6DC', fg: '#FF6B35' },
};

function formatMoney(v: number) {
  return v.toLocaleString();
}

function calcCashback(price: number, rate: number) {
  return Math.round(price * rate / 100);
}

function PROMO_SLIDES(router: ReturnType<typeof useRouter>): PromoSlide[] {
  return [
    {
      id: 'guide5',
      badge: '5월 쇼핑 가이드',
      title: '한정 보너스 챙겨왔어요!',
      subtitle: '쇼핑하기 딱 좋은 5월 · 매일 캐시백 적립',
      image: require('../../assets/images/banner-guide.jpg'),
      onPress: () => router.push('/guide'),
    },
    {
      id: 'tier-up',
      badge: '협회 회원',
      title: '협회 회원 캐시백 +1%',
      subtitle: '모든 쇼핑몰에서 추가 적립',
      image: require('../../assets/images/banner-tier.jpg'),
      onPress: () => router.push('/(tabs)/mypage'),
    },
  ];
}

// 실시간 인기 쇼핑몰 — 랭킹 행
function RankRow({ rank, mall, onPress }: { rank: number; mall: ApiMall; onPress: () => void }) {
  return (
    <TouchableOpacity style={rankStyles.row} onPress={onPress} activeOpacity={0.8}>
      <Text style={[rankStyles.rank, rank <= 3 && rankStyles.rankTop]}>{rank}</Text>
      <MallLogo mall={mall} size={46} radius={13} />
      <View style={{ flex: 1 }}>
        <Text style={rankStyles.name} numberOfLines={1}>{mall.name}</Text>
        <Text style={rankStyles.rate}>최대 {Number(mall.cashbackRate)}% 캐시백</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.ink[400]} />
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
  const { height: windowH } = useWindowDimensions();
  const { user, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [malls, setMalls] = useState<ApiMall[]>([]);
  const [homeTab, setHomeTab] = useState<FolderTabKey>('shop');
  const scrollRef = useRef<ScrollView>(null);
  const tabBarYRef = useRef(0);
  const [dailyTabIdx, setDailyTabIdx] = useState(0);
  const [dealProducts, setDealProducts] = useState<ApiProduct[]>([]);
  const [recProducts, setRecProducts] = useState<ApiProduct[]>([]);
  const [dealCountdown, setDealCountdown] = useState('00 : 00 : 00');

  const loadData = useCallback(async () => {
    try {
      const [home, products] = await Promise.all([
        getHomeData().catch(() => ({ blocks: [], malls: [] as ApiMall[] })),
        getProducts({ limit: 20 }).catch(() => ({ items: [] as ApiProduct[] })),
      ]);
      // 위메프는 서비스 불안정 — 노출 제외
      setMalls((home.malls || []).filter((m) => m.platform !== 'wemakeprice'));
      const items: ApiProduct[] = products.items || [];
      const deals = [...items]
        .filter((p) => Number(p.discountRate || 0) > 0)
        .sort((a, b) => Number(b.discountRate || 0) - Number(a.discountRate || 0))
        .slice(0, 6);
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

  // 오늘의 딜 — 자정까지 실시간 카운트다운
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setDealCountdown(`${pad(h)} : ${pad(m)} : ${pad(s)}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // 실시간 인기 쇼핑몰: 캐시백률 높은 순 상위 6
  const popularMalls = [...malls]
    .sort((a, b) => Number(b.cashbackRate || 0) - Number(a.cashbackRate || 0))
    .slice(0, 6);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Hero: refined orange gradient header (compact) */}
        <LinearGradient
          colors={['#FFA862', '#FF6B35', '#E5511A']}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <Text style={styles.heroGreeting} numberOfLines={1}>
              {isAuthenticated ? `안녕하세요, ${user?.nickname || '회원'}님` : '안녕하세요'}
            </Text>
            <TouchableOpacity style={styles.heroSearchBtn} onPress={() => router.push('/(tabs)/search')}>
              <Ionicons name="search" size={21} color={COLORS.ink[800]} />
            </TouchableOpacity>
          </View>

          {!isAuthenticated ? (
            <TouchableOpacity
              style={styles.heroGuestRow}
              activeOpacity={0.85}
              onPress={() => router.push('/auth/register' as any)}
            >
              <Text style={styles.heroGuestText} numberOfLines={1}>
                처음 오셨나요? 지금 바로 캐시백 적립을 받아보세요
              </Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
            </TouchableOpacity>
          ) : null}
        </LinearGradient>

        {/* Promo carousel */}
        <View style={{ marginTop: 16 }}>
          <PromoCarousel slides={PROMO_SLIDES(router)} />
        </View>

        {/* Folder-style tabs: 쇼핑 / 번개장터 / 우리지역 / 여행
            ⚠️ stickyHeaderIndices 가 직접 자식 View 의 flexDirection 을 무시하는 RN 버그가
            있어 wrapper View 로 감싸고 안쪽 segmentBar 에 flex 를 적용. */}
        <View onLayout={(e) => { tabBarYRef.current = e.nativeEvent.layout.y; }}>
          <View style={styles.segmentBar}>
            {FOLDER_TABS.map((t) => {
              const active = homeTab === t.key;
              return (
                <View key={t.key} style={styles.segmentCell}>
                  <TouchableOpacity
                    style={[styles.segmentTab, active ? styles.segmentTabActive : styles.segmentTabIdle]}
                    onPress={() => {
                      setHomeTab(t.key);
                      // 콘텐츠 교체 후 레이아웃이 반영된 다음 프레임에 스크롤해야
                      // 짧은 탭(여행/로딩 중)도 탭바가 상단에 정확히 고정됨
                      requestAnimationFrame(() => {
                        scrollRef.current?.scrollTo({ y: tabBarYRef.current, animated: true });
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.segmentTabText, active && styles.segmentTabTextActive]}
                      numberOfLines={1}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* 탭 콘텐츠 영역. minHeight 로 화면 높이만큼 스크롤 여유를 확보해야
            콘텐츠가 짧은 탭에서도 위 탭바가 화면 상단에 고정될 수 있음 */}
        <View style={{ minHeight: windowH }}>
        {homeTab === 'travel' ? (
          /* 여행 탭 — 준비 중 */
          <View style={styles.comingSoon}>
            <View style={styles.comingSoonIcon}>
              <Ionicons name="airplane-outline" size={38} color={COLORS.primary} />
            </View>
            <Text style={styles.comingSoonTitle}>여행 준비 중</Text>
            <Text style={styles.comingSoonSub}>
              항공·숙소·투어 캐시백 혜택을{'\n'}곧 만나보실 수 있어요.
            </Text>
          </View>
        ) : homeTab === 'market' ? (
          /* 번개장터 탭 — 인라인 콘텐츠 */
          <MarketContent />
        ) : homeTab === 'region' ? (
          /* 우리지역 탭 — 인라인 콘텐츠 */
          <RegionContent />
        ) : (
          /* 쇼핑 탭 */
          <>
            {/* Quick action chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipScroll}
            >
              {QUICK_MENU.map((m) => {
                const highlight = (m as any).highlight === true;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.quickChip, highlight ? styles.quickChipHi : styles.quickChipNeutral]}
                    onPress={() => router.push(m.route as any)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.quickChipEmoji}>{m.emoji}</Text>
                    <Text style={[styles.quickChipLabel, highlight && styles.quickChipLabelHi]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

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

            {/* 실시간 인기 쇼핑몰 */}
            <View style={styles.sectionHead}>
              <View style={styles.sectionTitleGroup}>
                <Text style={styles.sectionTitle}>실시간 인기 쇼핑몰</Text>
                <Text style={styles.sectionSub}>방금 업데이트</Text>
              </View>
              <TouchableOpacity style={styles.moreBtn} onPress={() => router.push('/(tabs)/categories' as any)}>
                <Text style={styles.moreText}>전체</Text>
                <Ionicons name="chevron-forward" size={12} color={COLORS.ink[500]} />
              </TouchableOpacity>
            </View>
            <View style={styles.rankList}>
              {loading && popularMalls.length === 0 ? (
                <ActivityIndicator size="small" color={COLORS.primary} style={{ paddingVertical: 20 }} />
              ) : popularMalls.length === 0 ? (
                <Text style={styles.emptyText}>등록된 쇼핑몰이 없습니다</Text>
              ) : (
                popularMalls.map((m, i) => (
                  <RankRow
                    key={m.id}
                    rank={i + 1}
                    mall={m}
                    onPress={() => router.push(`/mall/${m.platform}` as any)}
                  />
                ))
              )}
            </View>

            <View style={styles.divider} />

            {/* 인기 상향 캐시백 */}
            <View style={styles.sectionHead}>
              <View style={styles.sectionTitleGroup}>
                <Text style={styles.sectionTitle}>인기 상향 캐시백</Text>
                <Text style={styles.sectionSub}>매일 새로 갱신</Text>
              </View>
              <TouchableOpacity style={styles.moreBtn} onPress={() => router.push('/(tabs)/categories' as any)}>
                <Text style={styles.moreText}>전체</Text>
                <Ionicons name="chevron-forward" size={12} color={COLORS.ink[500]} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabScroll}>
              {DAILY_LABELS.map((label, i) => {
                const active = i === dailyTabIdx;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[styles.dayTab, active && styles.dayTabActive]}
                    onPress={() => setDailyTabIdx(i)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayTabText, active && styles.dayTabTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={dailyStyles.scroll}>
              {(() => {
                const offset = dailyTabIdx;
                const ordered = malls.length ? [...malls.slice(offset), ...malls.slice(0, offset)] : [];
                return ordered.slice(0, 6).map((m) => {
                  const badge = m.promoBadge ? PROMO_BADGE_LABEL[m.promoBadge] : null;
                  const prev = m.previousCashbackRate != null ? Number(m.previousCashbackRate) : null;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={dailyStyles.bigCard}
                      onPress={() => router.push(`/mall/${m.platform}` as any)}
                      activeOpacity={0.9}
                    >
                      <View style={dailyStyles.bigLogoWrap}>
                        <MallLogo mall={m} size={132} radius={18} />
                        {badge ? (
                          <View style={[dailyStyles.bigBadge, { backgroundColor: badge.bg }]}>
                            <Text style={[dailyStyles.bigBadgeText, { color: badge.fg }]}>{badge.text}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={dailyStyles.bigName} numberOfLines={1}>{m.name}</Text>
                      <View style={dailyStyles.bigRateRow}>
                        <Text style={dailyStyles.bigRate}>최대 {Number(m.cashbackRate)}%</Text>
                        {prev != null ? <Text style={dailyStyles.bigPrev}>{prev}%</Text> : null}
                      </View>
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>

            <View style={[styles.divider, { marginTop: 18 }]} />

            {/* 오늘의 딜 */}
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>오늘의 딜</Text>
              <Text style={styles.timer}>{dealCountdown}</Text>
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

            {/* 이번 주 추천 */}
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
          </>
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
    paddingBottom: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroGreeting: { flex: 1, fontSize: 19, fontWeight: '800', color: COLORS.white, letterSpacing: -0.4 },
  heroSearchBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white,
  },

  heroGuestRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10,
  },
  heroGuestText: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.white, letterSpacing: -0.3 },

  guideBanner: {
    marginHorizontal: SPACING.xl,
    marginTop: 8,
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

  // Folder-style tabs
  segmentBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.ink[50],
    paddingHorizontal: 10,
    paddingTop: 14,
    gap: 4,
  },
  segmentCell: { flex: 1 },
  segmentTab: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  segmentTabActive: {
    backgroundColor: COLORS.white,
    paddingVertical: 13,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: -1 },
    elevation: 3,
  },
  segmentTabIdle: {
    backgroundColor: '#E4E4E7',
    paddingVertical: 10,
  },
  segmentTabText: { fontSize: 13.5, fontWeight: '700', color: COLORS.ink[500], letterSpacing: -0.3 },
  segmentTabTextActive: { color: COLORS.ink[900], fontWeight: '800' },

  // Quick chips
  quickChipScroll: { paddingHorizontal: SPACING.xl, paddingTop: 16, paddingBottom: 4, gap: 8 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  quickChipHi: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  quickChipNeutral: { backgroundColor: COLORS.white, borderColor: COLORS.ink[200] },
  quickChipEmoji: { fontSize: 13 },
  quickChipLabel: { fontSize: 12.5, fontWeight: '700', color: COLORS.ink[700] },
  quickChipLabelHi: { color: COLORS.primary },

  sectionHead: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitleGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: COLORS.ink[500], fontWeight: '500' },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moreText: { fontSize: 12, color: COLORS.ink[500] },
  timer: { fontSize: 12, fontWeight: '700', color: COLORS.primary, fontVariant: ['tabular-nums'] },

  emptyText: { textAlign: 'center', color: COLORS.ink[400], paddingVertical: 20, fontSize: 13 },

  rankList: { paddingHorizontal: SPACING.xl, gap: 4 },

  divider: { height: 8, backgroundColor: COLORS.ink[50], marginTop: 24 },

  dayTabScroll: { paddingHorizontal: SPACING.xl, gap: 8, paddingBottom: 12 },
  dayTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.ink[50],
  },
  dayTabActive: { backgroundColor: COLORS.ink[900] },
  dayTabText: { fontSize: 12, fontWeight: '700', color: COLORS.ink[600] },
  dayTabTextActive: { color: COLORS.white },

  dealScroll: { paddingHorizontal: SPACING.xl, gap: 12 },
  recGrid: {
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  comingSoon: {
    minHeight: 380,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  comingSoonIcon: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  comingSoonTitle: { fontSize: 18, fontWeight: '800', color: COLORS.ink[900] },
  comingSoonSub: { fontSize: 13, color: COLORS.ink[500], textAlign: 'center', lineHeight: 20 },
});

const rankStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
  },
  rank: {
    width: 22,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink[400],
    fontVariant: ['tabular-nums'],
  },
  rankTop: { color: COLORS.primary },
  logo: {
    width: 46, height: 46, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 18, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  name: { fontSize: 14, fontWeight: '700', color: COLORS.ink[900] },
  rate: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginTop: 2 },
});

const dailyStyles = StyleSheet.create({
  scroll: { paddingHorizontal: SPACING.xl, gap: 12, paddingBottom: 4 },
  bigCard: { width: 132, gap: 8 },
  bigLogoWrap: { position: 'relative', width: 132, height: 132 },
  bigBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 6,
  },
  bigBadgeText: { fontSize: 10, fontWeight: '800' },
  bigName: { fontSize: 13, fontWeight: '700', color: COLORS.ink[900] },
  bigRateRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  bigRate: { fontSize: 14, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.3 },
  bigPrev: { fontSize: 11, color: COLORS.ink[400], textDecorationLine: 'line-through' },
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
