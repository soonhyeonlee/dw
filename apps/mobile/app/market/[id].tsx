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

        {/* 상품 정보 — 실제 상세 정보를 항상 노출 */}
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>상품 정보</Text>
          <InfoRow label="카테고리" value={product.category} />
          <InfoRow label="원산지" value={product.origin} />
          <InfoRow label="생산자" value={product.producer} />
          <InfoRow
            label="배송"
            value={
              product.freeDelivery
                ? `무료배송${product.deliveryInfo ? ` · ${product.deliveryInfo}` : ''}`
                : product.deliveryInfo || '배송비 별도'
            }
          />
          <InfoRow
            label="재고"
            value={
              product.stockQuantity > 0
                ? product.stockQuantity >= 9999
                  ? '재고 충분'
                  : `${product.stockQuantity.toLocaleString()}개 남음`
                : '품절'
            }
            last
          />
        </View>

        {/* 상품 설명 */}
        <View style={styles.descSection}>
          <Text style={styles.descTitle}>상품 설명</Text>
          {product.description ? (
            <Text style={styles.descText}>{product.description}</Text>
          ) : (
            <Text style={styles.descEmpty}>등록된 상세 설명이 없습니다.</Text>
          )}
        </View>

        {/* 판매자 — 신뢰 문구(작게) */}
        <View style={styles.sellerLine}>
          <Ionicons name="shield-checkmark" size={14} color={QM.coral} />
          <Text style={styles.sellerLineText}>
            더블원플러스가 검수·발송하는 위탁판매 상품입니다
          </Text>
        </View>

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

/** 상품 정보 한 줄. 값이 없으면(원산지/생산자 등) 렌더링하지 않는다. */
function InfoRow({ label, value, last }: { label: string; value?: string | null; last?: boolean }) {
  if (!value || !String(value).trim()) return null;
  return (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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

  detailCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: QM.card,
    borderRadius: 18,
    ...QM.cardShadow,
  },
  detailTitle: { fontSize: FONT.sizes.md, fontWeight: '800', color: QM.ink, marginTop: SPACING.sm, marginBottom: 4 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: QM.hairline,
  },
  infoLabel: { width: 84, fontSize: FONT.sizes.sm, color: COLORS.gray[500], fontWeight: '600' },
  infoValue: { flex: 1, fontSize: FONT.sizes.sm, color: COLORS.gray[800], fontWeight: '600' },

  descSection: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: QM.card,
    borderRadius: 18,
    ...QM.cardShadow,
  },
  descTitle: { fontSize: FONT.sizes.md, fontWeight: '800', color: QM.ink, marginBottom: SPACING.sm },
  descText: { fontSize: FONT.sizes.md, color: COLORS.gray[700], lineHeight: 22 },
  descEmpty: { fontSize: FONT.sizes.sm, color: COLORS.gray[400] },

  sellerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: 4,
  },
  sellerLineText: { fontSize: FONT.sizes.xs, color: COLORS.gray[500], fontWeight: '600' },

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
