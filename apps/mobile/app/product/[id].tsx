import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { findProductById, type MockProduct } from '../../src/mock/feed';
import { useAuth } from '../../src/contexts/AuthContext';

const { width } = Dimensions.get('window');

function fmt(v: number) {
  return v.toLocaleString();
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);

  const product: MockProduct | undefined = id ? findProductById(id) : undefined;

  if (!product) {
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

  const cashbackAmount = Math.round(product.price * product.cashbackRate / 100);

  const handlePurchase = () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '로그인 후 이용할 수 있어요.');
      return;
    }
    router.push({
      pathname: '/activate-cashback',
      params: {
        mall: product.mallLabel,
        rate: String(product.cashbackRate),
        url: `https://www.${product.platform}.com`,
      },
    } as any);
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '로그인 후 이용할 수 있어요.');
      return;
    }
    setWishlisted(!wishlisted);
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
            <Text style={styles.mallBadgeText}>{product.mallLabel}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.info}>
          {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>{product.rating ?? '-'}</Text>
            <Text style={styles.review}>리뷰 {fmt(product.reviewCount ?? 0)}</Text>
          </View>

          <View style={styles.priceRow}>
            {product.discountRate ? (
              <Text style={styles.discount}>{product.discountRate}%</Text>
            ) : null}
            <Text style={styles.price}>{fmt(product.price)}</Text>
            <Text style={styles.priceUnit}>원</Text>
          </View>
          {product.originalPrice && (
            <Text style={styles.original}>{fmt(product.originalPrice)}원</Text>
          )}

          {product.shippingNote && (
            <View style={styles.shipRow}>
              <Ionicons name="cube-outline" size={14} color={COLORS.ink[600]} />
              <Text style={styles.shipText}>{product.shippingNote}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Cashback */}
        <View style={styles.cashbackBox}>
          <View style={styles.cbRow}>
            <View style={styles.cbIconWrap}>
              <Ionicons name="wallet" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cbLabel}>더블윈 캐시백</Text>
              <Text style={styles.cbSub}>{product.mallLabel} 경유 구매 시 적립</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cbAmount}>{fmt(cashbackAmount)}원</Text>
              <Text style={styles.cbRate}>{product.cashbackRate}% 적립</Text>
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
            `${product.mallLabel}에서 정상 결제 완료`,
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
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },

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

  info: { padding: SPACING.xl, gap: 6 },
  brand: { fontSize: 13, fontWeight: '600', color: COLORS.ink[500] },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.ink[900], lineHeight: 24, letterSpacing: -0.3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { fontSize: 13, fontWeight: '700', color: COLORS.ink[900] },
  review: { fontSize: 13, color: COLORS.ink[500] },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 },
  discount: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  price: { fontSize: 24, fontWeight: '800', color: COLORS.ink[900] },
  priceUnit: { fontSize: 17, fontWeight: '700', color: COLORS.ink[900] },
  original: { fontSize: 13, color: COLORS.ink[400], textDecorationLine: 'line-through' },

  shipRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  shipText: { fontSize: 12, color: COLORS.ink[700], fontWeight: '500' },

  divider: { height: 8, backgroundColor: COLORS.ink[50] },

  cashbackBox: { padding: SPACING.xl },
  cbRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cbIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  cbLabel: { fontSize: 14, fontWeight: '700', color: COLORS.ink[900] },
  cbSub: { fontSize: 12, color: COLORS.ink[500], marginTop: 2 },
  cbAmount: { fontSize: 18, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.3 },
  cbRate: { fontSize: 11, color: COLORS.ink[500], fontWeight: '600', marginTop: 2 },
  cbNote: {
    marginTop: 14,
    backgroundColor: COLORS.ink[50],
    padding: 12,
    borderRadius: RADIUS.sm,
  },
  cbNoteText: { fontSize: 12, color: COLORS.ink[600], lineHeight: 17 },

  howto: { padding: SPACING.xl, gap: 14 },
  howtoTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink[900], marginBottom: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.ink[900],
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
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.ink[200],
    alignItems: 'center', justifyContent: 'center',
  },
  buyBtn: {
    flex: 1,
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
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
