import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import {
  MOCK_MALLS,
  MOCK_DEAL_PRODUCTS,
  MOCK_REC_PRODUCTS,
  type MockProduct,
} from '../../src/mock/feed';
import { useAuth } from '../../src/contexts/AuthContext';
import { getMallDetail, type Mall as ApiMall } from '../../src/api/home';
import { toggleMallWishlist } from '../../src/api/products';

function fmt(v: number) { return v.toLocaleString(); }

function ProductRow({ p, onPress }: { p: MockProduct; onPress: () => void }) {
  const cb = Math.round(p.price * p.cashbackRate / 100);
  return (
    <TouchableOpacity style={rowStyles.card} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: p.imageUrl }} style={rowStyles.img} resizeMode="cover" />
      <View style={rowStyles.body}>
        {p.brand && <Text style={rowStyles.brand}>{p.brand}</Text>}
        <Text style={rowStyles.title} numberOfLines={2}>{p.title}</Text>
        <View style={rowStyles.priceRow}>
          {p.discountRate ? <Text style={rowStyles.discount}>{p.discountRate}%</Text> : null}
          <Text style={rowStyles.price}>{fmt(p.price)}원</Text>
        </View>
        <Text style={rowStyles.cb}>캐시백 {fmt(cb)}원 ({p.cashbackRate}%)</Text>
      </View>
    </TouchableOpacity>
  );
}

const PROMO_BADGE_LABEL: Record<string, { text: string; bg: string; fg: string }> = {
  time_deal: { text: '타임특가', bg: '#E0311E', fg: '#FFFFFF' },
  rate_up:   { text: '상향 캐시백', bg: '#EEEEFF', fg: '#4B4BF4' },
  welcome:   { text: '웰컴 혜택', bg: '#FFE6DC', fg: '#FF6B35' },
};

export default function MallDetailScreen() {
  const { platform } = useLocalSearchParams<{ platform: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const mockMall = MOCK_MALLS.find((m) => m.platform === platform);
  const [apiMall, setApiMall] = useState<ApiMall | null>(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistBusy, setWishlistBusy] = useState(false);

  useEffect(() => {
    if (!platform) return;
    getMallDetail(platform).then(setApiMall).catch(() => setApiMall(null));
  }, [platform]);

  const mall = mockMall;
  const products = [
    ...MOCK_DEAL_PRODUCTS.filter((p) => p.platform === platform),
    ...MOCK_REC_PRODUCTS.filter((p) => p.platform === platform),
  ];

  const badge = apiMall?.promoBadge ? PROMO_BADGE_LABEL[apiMall.promoBadge] : null;
  const category = apiMall?.category || null;
  const cashbackNote = apiMall?.cashbackNote || '구매 확정 후 30일 이내 적립';

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '관심 쇼핑몰 등록은 로그인 후 가능합니다.');
      return;
    }
    if (!apiMall?.id) {
      Alert.alert('잠시 후 다시 시도해주세요', '쇼핑몰 정보를 불러오는 중입니다.');
      return;
    }
    setWishlistBusy(true);
    try {
      const r = await toggleMallWishlist(apiMall.id);
      setWishlisted(!!r?.wishlisted);
    } catch {
      Alert.alert('오류', '관심 등록에 실패했습니다.');
    } finally {
      setWishlistBusy(false);
    }
  };

  if (!mall) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>쇼핑몰을 찾을 수 없습니다</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.back()}>
            <Text style={styles.emptyBtnText}>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleGo = () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '경유 쇼핑몰로 이동하려면 로그인이 필요합니다.');
      return;
    }
    const urls: Record<string, string> = {
      coupang: 'https://www.coupang.com',
      naver: 'https://shopping.naver.com',
      '11st': 'https://www.11st.co.kr',
      gmarket: 'https://www.gmarket.co.kr',
      ssg: 'https://www.ssg.com',
      lotteon: 'https://www.lotteon.com',
      wemakeprice: 'https://www.wemakeprice.com',
      tmon: 'https://www.tmon.co.kr',
    };
    const url = apiMall?.affiliateBaseUrl || apiMall?.baseUrl || urls[mall.platform] || 'https://www.doublewin.co.kr';
    router.push({
      pathname: '/activate-cashback',
      params: { mall: mall.name, rate: String(mall.cashbackRate), url },
    } as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.topbar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink[900]} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{mall.name}</Text>
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="share-outline" size={22} color={COLORS.ink[900]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleToggleWishlist} disabled={wishlistBusy}>
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={22}
              color={wishlisted ? COLORS.primary : COLORS.ink[900]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroLogo, { backgroundColor: mall.tintColor }]}>
            <Text style={styles.heroLogoText}>{mall.wordmark}</Text>
          </View>
          {category ? (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{category}</Text>
            </View>
          ) : null}
          <Text style={styles.heroName}>{mall.name}</Text>
          {badge ? (
            <View style={[styles.heroBadge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.heroBadgeText, { color: badge.fg }]}>{badge.text}</Text>
            </View>
          ) : null}
          <Text style={styles.heroRateBig}>최대 {mall.cashbackRate}% 캐시백</Text>
          <Text style={styles.heroDesc}>
            {mall.name} 상품을 더블윈에서 경유 결제하면{'\n'}
            구매 금액의 최대 {mall.cashbackRate}%를 캐시백으로 돌려드려요.
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Cashback timeline */}
        <View style={styles.timelineWrap}>
          <Text style={styles.timelineTitle}>캐시백 타임라인</Text>
          <View style={styles.timelineRow}>
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <Text style={styles.timelineLabel}>구매</Text>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineStep}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <Text style={styles.timelineLabel}>적립</Text>
              <Text style={styles.timelineSub}>2일 이내</Text>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineStep}>
              <View style={styles.timelineDot} />
              <Text style={styles.timelineLabel}>승인 완료</Text>
              <Text style={styles.timelineSub}>{cashbackNote}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{mall.name} 인기 상품</Text>
          <Text style={styles.sectionCount}>{products.length}개</Text>
        </View>

        {products.length === 0 ? (
          <View style={styles.emptyProducts}>
            <Ionicons name="cube-outline" size={36} color={COLORS.ink[300]} />
            <Text style={styles.emptyProductsText}>등록된 상품이 없습니다</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {products.map((p) => (
              <ProductRow
                key={p.id}
                p={p}
                onPress={() => router.push(`/product/${p.id}` as any)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBarWrap}>
        <TouchableOpacity style={styles.goBtn} onPress={handleGo} activeOpacity={0.9}>
          <Text style={styles.goBtnText}>{mall.name} 경유해서 쇼핑하기</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  topbar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  topTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink[900] },
  topActions: { flexDirection: 'row' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', paddingTop: 28, paddingBottom: 24, paddingHorizontal: SPACING.xl },
  heroLogo: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  heroLogoText: { fontSize: 24, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  heroName: { fontSize: 20, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  heroRateBox: {
    marginTop: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999,
  },
  heroRateLabel: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  heroRate: { fontSize: 14, color: COLORS.primary, fontWeight: '800' },
  heroDesc: {
    marginTop: 14,
    fontSize: 13, color: COLORS.ink[600],
    textAlign: 'center', lineHeight: 19,
  },
  categoryChip: {
    marginTop: 6, marginBottom: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: COLORS.ink[100],
    borderRadius: 999,
  },
  categoryChipText: { fontSize: 11, color: COLORS.ink[700], fontWeight: '600' },
  heroBadge: {
    marginTop: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '700' },
  heroRateBig: {
    marginTop: 12,
    fontSize: 24, fontWeight: '800', color: COLORS.ink[900],
    letterSpacing: -0.5,
  },

  divider: { height: 8, backgroundColor: COLORS.ink[50] },

  timelineWrap: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: 22,
  },
  timelineTitle: {
    fontSize: 14, fontWeight: '700', color: COLORS.ink[900],
    marginBottom: 18,
  },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineStep: { alignItems: 'center', minWidth: 80 },
  timelineDot: {
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: COLORS.ink[300],
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },
  timelineDotActive: {
    backgroundColor: COLORS.ink[900],
    borderColor: COLORS.ink[900],
  },
  timelineLabel: { fontSize: 12, fontWeight: '700', color: COLORS.ink[800] },
  timelineSub: { fontSize: 10, color: COLORS.ink[500], marginTop: 3, textAlign: 'center' },
  timelineLine: {
    flex: 1, height: 2, backgroundColor: COLORS.ink[200], marginTop: 6,
  },

  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: SPACING.xl, paddingTop: 20, paddingBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink[900] },
  sectionCount: { fontSize: 13, color: COLORS.ink[500], fontWeight: '500' },

  list: { paddingHorizontal: SPACING.xl, gap: 16 },

  emptyProducts: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyProductsText: { fontSize: 13, color: COLORS.ink[500] },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.ink[500] },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.ink[100], borderRadius: RADIUS.md },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[800] },

  bottomBarWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.divider,
    paddingHorizontal: 16, paddingTop: 12,
  },
  goBtn: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
  },
  goBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.white },
});

const rowStyles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12 },
  img: {
    width: 96, height: 96,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[100],
  },
  body: { flex: 1, justifyContent: 'space-between' },
  brand: { fontSize: 11, color: COLORS.ink[500], fontWeight: '600' },
  title: { fontSize: 13, color: COLORS.ink[800], lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  discount: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  price: { fontSize: 14, fontWeight: '800', color: COLORS.ink[900] },
  cb: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
});
