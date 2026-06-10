import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS, QM } from '../../src/constants/theme';
import {
  getMarketProduct,
  toggleMarketWishlist,
  getMarketWishlist,
  type MarketProduct,
} from '../../src/api/market';
import { useAuth } from '../../src/contexts/AuthContext';

// T3 Quiet Mono — accent 코랄. (구 보라 #6633CC 대체)
const PURPLE = QM.coral;

export default function MarketProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<MarketProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    getMarketWishlist()
      .then((w) => setWishlisted((w.ids || []).includes(id)))
      .catch(() => {});
  }, [isAuthenticated, id]);

  const loadProduct = async () => {
    try {
      const data = await getMarketProduct(id!);
      setProduct(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  const handleWish = async () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '찜하려면 로그인이 필요합니다', [
        { text: '취소' },
        { text: '로그인', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    if (wishBusy) return;
    setWishBusy(true);
    const prev = wishlisted;
    setWishlisted(!prev); // 낙관적
    try {
      const r = await toggleMarketWishlist(id!);
      setWishlisted(!!r?.wishlisted);
    } catch {
      setWishlisted(prev); // 롤백
    } finally {
      setWishBusy(false);
    }
  };

  const handleBuy = () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '구매하려면 로그인이 필요합니다', [
        { text: '취소' },
        { text: '로그인', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    router.push(`/market/checkout?id=${product!.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>상품 정보를 불러올 수 없습니다</Text>
      </View>
    );
  }

  const discountRate = product.originalPrice
    ? Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={8}>
            <Ionicons name="share-outline" size={22} color={COLORS.gray[700]} />
          </TouchableOpacity>
        </View>

        {/* Image */}
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={{ fontSize: 64 }}>📦</Text>
          </View>
        )}

        {/* Product Info */}
        <View style={styles.infoSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>더블원플러스 인증</Text>
          </View>

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceRow}>
            {discountRate > 0 && <Text style={styles.discount}>{discountRate}%</Text>}
            <Text style={styles.price}>{Number(product.price).toLocaleString()}원</Text>
            {product.originalPrice && (
              <Text style={styles.origPrice}>{Number(product.originalPrice).toLocaleString()}원</Text>
            )}
          </View>
          <View style={styles.earnPill}>
            <Text style={styles.earnText}>💰 구매 시 {Math.floor(Number(product.price) * 0.02).toLocaleString()} P 적립 (2%)</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>판매량</Text>
            <Text style={styles.statValue}>{product.soldCount.toLocaleString()}개</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>별점</Text>
            <Text style={styles.statValue}>{product.rating} ★</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>리뷰</Text>
            <Text style={styles.statValue}>{product.reviewCount}건</Text>
          </View>
        </View>

        {/* Delivery */}
        <View style={styles.deliveryCard}>
          <Text style={{ fontSize: 16 }}>🚚</Text>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryText}>
              {product.freeDelivery ? '무료배송' : '배송비 별도'}
              {product.deliveryInfo ? `  |  ${product.deliveryInfo}` : ''}
            </Text>
            {product.producer && (
              <Text style={styles.deliveryOrigin}>
                생산자: {product.producer}
                {product.origin ? `  |  원산지: ${product.origin}` : ''}
              </Text>
            )}
          </View>
        </View>

        {/* Seller */}
        <View style={styles.sellerCard}>
          <View style={styles.sellerIcon}>
            <Text style={styles.sellerIconText}>D</Text>
          </View>
          <View>
            <Text style={styles.sellerName}>더블원플러스 위탁판매</Text>
            <Text style={styles.sellerDesc}>더블원플러스가 품질을 보증하는 상품입니다</Text>
          </View>
        </View>

        {product.description && (
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>상품 설명</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity style={styles.heartBtn} onPress={handleWish} disabled={wishBusy}>
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={24}
            color={wishlisted ? '#FF4040' : COLORS.gray[600]}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyBtn} onPress={handleBuy} activeOpacity={0.8}>
          <Text style={styles.buyText}>구매하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: QM.pageBg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: QM.pageBg },
  errorText: { color: COLORS.gray[500], fontSize: FONT.sizes.md },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },

  image: {
    width: '100%',
    height: 340,
    backgroundColor: COLORS.gray[100],
  },
  imagePlaceholder: {
    width: '100%',
    height: 340,
    backgroundColor: PURPLE + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoSection: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: 20,
    borderRadius: 18,
    backgroundColor: QM.card,
    ...QM.cardShadow,
  },
  badge: { backgroundColor: QM.coralSoft, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
  badgeText: { color: QM.coral, fontSize: FONT.sizes.xs, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '800', color: QM.ink, lineHeight: 31, letterSpacing: -0.4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 16 },
  discount: { fontSize: 20, fontWeight: '800', color: QM.coral },
  price: { fontSize: 27, fontWeight: '800', color: QM.ink, letterSpacing: -0.5 },
  origPrice: { fontSize: 14, color: '#A6ACB4', textDecorationLine: 'line-through' },
  earnPill: {
    alignSelf: 'flex-start', marginTop: 12,
    backgroundColor: QM.coralSoft, borderRadius: 11,
    paddingHorizontal: 13, paddingVertical: 8,
  },
  earnText: { color: '#C23E1B', fontSize: 13, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: QM.card,
    borderRadius: 18,
    padding: SPACING.lg,
    ...QM.cardShadow,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: FONT.sizes.xs, color: COLORS.gray[500] },
  statValue: { fontSize: FONT.sizes.sm, fontWeight: '700', color: COLORS.gray[900], marginTop: 4 },

  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: QM.card,
    borderRadius: 18,
    gap: SPACING.md,
    ...QM.cardShadow,
  },
  deliveryInfo: { flex: 1 },
  deliveryText: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.gray[700] },
  deliveryOrigin: { fontSize: FONT.sizes.xs, color: COLORS.gray[500], marginTop: 4 },

  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    backgroundColor: PURPLE + '12',
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  sellerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: PURPLE, justifyContent: 'center', alignItems: 'center' },
  sellerIconText: { color: COLORS.white, fontWeight: '800', fontSize: FONT.sizes.md },
  sellerName: { fontSize: FONT.sizes.sm, fontWeight: '700', color: PURPLE },
  sellerDesc: { fontSize: FONT.sizes.xs, color: COLORS.gray[500], marginTop: 2 },

  descSection: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xxl },
  descTitle: { fontSize: FONT.sizes.lg, fontWeight: '800', color: COLORS.secondary, marginBottom: SPACING.md },
  descText: { fontSize: FONT.sizes.md, color: COLORS.gray[700], lineHeight: 22 },

  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    gap: SPACING.md,
  },
  heartBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: QM.fieldBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBtn: {
    flex: 1,
    height: 56,
    backgroundColor: QM.coral,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: QM.coral, shadowOpacity: 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  buyText: { color: COLORS.white, fontSize: 16.5, fontWeight: '700' },
});
