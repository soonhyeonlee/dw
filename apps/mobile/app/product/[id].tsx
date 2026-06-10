import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, QM } from '../../src/constants/theme';
import {
  getProduct,
  clickProduct,
  toggleWishlist as toggleWishlistApi,
  type Product as ApiProduct,
} from '../../src/api/products';
import { useAuth } from '../../src/contexts/AuthContext';

const PLATFORM_LABEL: Record<string, string> = {
  coupang: '쿠팡',
  naver: '네이버',
  '11st': '11번가',
  gmarket: 'G마켓',
  ssg: 'SSG닷컴',
  lotteon: '롯데ON',
  wemakeprice: '위메프',
  tmon: '티몬',
  doublewin: '더블원플러스',
};

const { width } = Dimensions.get('window');

function fmt(v: number) {
  return v.toLocaleString();
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getProduct(id)
      .then((p) => { setProduct(p); setNotFound(false); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!product || notFound) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyBox}>
          <Ionicons name="cube-outline" size={48} color={COLORS.ink[300]} />
          <Text style={styles.emptyText}>상품을 찾을 수 없습니다</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.back()}>
            <Text style={styles.emptyBtnText}>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mallLabel = PLATFORM_LABEL[product.platform] || product.platform;
  const price = Number(product.price);
  const cashbackRate = Number(product.cashbackRate);
  const cashbackAmount = Math.round(price * cashbackRate / 100);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '로그인 후 이용할 수 있어요.');
      return;
    }
    let url = product.affiliateUrl || product.productUrl;
    try {
      const r = await clickProduct(product.id);
      if (r?.affiliateUrl) url = r.affiliateUrl;
    } catch { /* fall through */ }
    router.push({
      pathname: '/activate-cashback',
      params: {
        mall: mallLabel,
        rate: String(cashbackRate),
        url,
      },
    } as any);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '로그인 후 이용할 수 있어요.');
      return;
    }
    try {
      const r = await toggleWishlistApi(product.id);
      setWishlisted(!!r?.wishlisted);
    } catch {
      Alert.alert('오류', '관심 등록에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Floating top bar */}
      <SafeAreaView style={styles.floatBar} edges={['top']} pointerEvents="box-none">
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.ink[900]} />
          </TouchableOpacity>
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.roundBtn}>
              <Ionicons name="share-outline" size={20} color={COLORS.ink[900]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.roundBtn}>
              <Ionicons name="cart-outline" size={20} color={COLORS.ink[900]} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
          <View style={styles.mallBadge}>
            <Text style={styles.mallBadgeText}>{mallLabel}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title}>{product.title}</Text>

          {(product.rating != null || product.reviewCount != null) && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.rating}>{product.rating != null ? Number(product.rating).toFixed(1) : '-'}</Text>
              <Text style={styles.review}>리뷰 {fmt(Number(product.reviewCount ?? 0))}</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            {product.discountRate ? (
              <Text style={styles.discount}>{Math.round(Number(product.discountRate))}%</Text>
            ) : null}
            <Text style={styles.price}>{fmt(price)}</Text>
            <Text style={styles.priceUnit}>원</Text>
          </View>
          {product.originalPrice ? (
            <Text style={styles.original}>{fmt(Number(product.originalPrice))}원</Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* Cashback */}
        <View style={styles.cashbackBox}>
          <View style={styles.cbRow}>
            <View style={styles.cbIconWrap}>
              <Ionicons name="wallet" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cbLabel}>더블원플러스 캐시백</Text>
              <Text style={styles.cbSub}>{mallLabel} 경유 구매 시 적립</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cbAmount}>{fmt(cashbackAmount)}원</Text>
              <Text style={styles.cbRate}>{cashbackRate}% 적립</Text>
            </View>
          </View>
          <View style={styles.cbNote}>
            <Text style={styles.cbNoteText}>
              구매 확정 후 영업일 기준 3~7일 내 캐시백이 자동 적립됩니다.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* How it works */}
        <View style={styles.howto}>
          <Text style={styles.howtoTitle}>캐시백 받는 순서</Text>
          {[
            '구매하기 버튼을 눌러 제휴 쇼핑몰로 이동',
            `${mallLabel}에서 정상 결제 완료`,
            '구매 확정 후 자동 캐시백 적립',
          ].map((t, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBarWrap}>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.wishBtn} onPress={handleWishlist}>
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={24}
              color={wishlisted ? COLORS.primary : COLORS.ink[700]}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyBtn} onPress={handlePurchase} activeOpacity={0.9}>
            <View style={styles.buyBtnInner}>
              <Text style={styles.buyCbText}>{fmt(cashbackAmount)}원 캐시백</Text>
              <Text style={styles.buyText}>구매하러 가기</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: QM.pageBg },
  container: { flex: 1, backgroundColor: QM.pageBg },

  floatBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
  },
  topbar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightActions: { flexDirection: 'row', gap: 8 },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },

  imageWrap: { width, height: width, position: 'relative' },
  image: { width: '100%', height: '100%', backgroundColor: COLORS.ink[100] },
  mallBadge: {
    position: 'absolute', bottom: 16, left: 16,
    backgroundColor: 'rgba(17,24,39,0.85)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6,
  },
  mallBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },

  info: { padding: SPACING.xl, gap: 6, backgroundColor: QM.card },
  brand: { fontSize: 13, fontWeight: '600', color: COLORS.ink[500] },
  title: { fontSize: 18, fontWeight: '800', color: QM.ink, lineHeight: 24, letterSpacing: -0.3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { fontSize: 13, fontWeight: '700', color: COLORS.ink[900] },
  review: { fontSize: 13, color: COLORS.ink[500] },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 },
  discount: { fontSize: 24, fontWeight: '800', color: QM.coral },
  price: { fontSize: 24, fontWeight: '800', color: QM.ink },
  priceUnit: { fontSize: 17, fontWeight: '700', color: COLORS.ink[900] },
  original: { fontSize: 13, color: COLORS.ink[400], textDecorationLine: 'line-through' },

  shipRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  shipText: { fontSize: 12, color: COLORS.ink[700], fontWeight: '500' },

  divider: { height: 12, backgroundColor: QM.pageBg },

  cashbackBox: {
    marginHorizontal: SPACING.xl,
    padding: 18,
    backgroundColor: QM.card,
    borderRadius: 20,
    ...QM.cardShadow,
  },
  cbRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cbIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: QM.coralSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  cbLabel: { fontSize: 14, fontWeight: '800', color: QM.ink },
  cbSub: { fontSize: 12, color: QM.sub, marginTop: 2 },
  cbAmount: { fontSize: 18, fontWeight: '800', color: QM.coral, letterSpacing: -0.3 },
  cbRate: { fontSize: 11, color: QM.sub, fontWeight: '700', marginTop: 2 },
  cbNote: {
    marginTop: 14,
    backgroundColor: QM.coralSoft,
    padding: 12,
    borderRadius: RADIUS.sm,
  },
  cbNoteText: { fontSize: 12, color: QM.ink, lineHeight: 17 },

  howto: {
    marginHorizontal: SPACING.xl,
    padding: 18,
    gap: 14,
    backgroundColor: QM.card,
    borderRadius: 20,
    ...QM.cardShadow,
  },
  howtoTitle: { fontSize: 15, fontWeight: '800', color: QM.ink, marginBottom: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: QM.coral,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  stepText: { fontSize: 13, color: COLORS.ink[700], flex: 1 },

  bottomBarWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    alignItems: 'center',
  },
  wishBtn: {
    width: 52, height: 52,
    borderRadius: 16,
    borderWidth: 1, borderColor: QM.hairline,
    alignItems: 'center', justifyContent: 'center',
  },
  buyBtn: {
    flex: 1,
    height: 52,
    backgroundColor: QM.coral,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    shadowColor: QM.coral,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buyBtnInner: { alignItems: 'flex-start' },
  buyCbText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  buyText: { fontSize: 15, fontWeight: '800', color: COLORS.white, marginTop: 1 },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.ink[500] },
  emptyBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: COLORS.ink[100],
    borderRadius: RADIUS.md,
    marginTop: 8,
  },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[800] },
});
