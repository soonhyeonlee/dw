import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS, QM } from '../../src/constants/theme';
import { EmptyState } from '../../src/components/EmptyState';
import { getWishlist, getMallWishlist } from '../../src/api/products';
import { getMarketWishlist } from '../../src/api/market';

type Tab = 'products' | 'malls';

const POINT_RATE = 0.02;

// 찜 상품(번개장터 직접판매 + 제휴) 통합 표시용.
type WishProduct = {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl?: string;
  cashbackRate?: number;
  source: 'market' | 'product';
};

function WishCard({ p, onPress }: { p: WishProduct; onPress: () => void }) {
  const price = Number(p.price);
  const orig = p.originalPrice ? Number(p.originalPrice) : undefined;
  const discount =
    p.discountRate != null
      ? Math.round(Number(p.discountRate))
      : orig && orig > price
        ? Math.round(((orig - price) / orig) * 100)
        : 0;
  return (
    <TouchableOpacity style={wcStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={wcStyles.imgBox}>
        {p.imageUrl ? (
          <Image source={{ uri: p.imageUrl }} style={wcStyles.img} resizeMode="cover" />
        ) : (
          <View style={[wcStyles.img, wcStyles.imgPlaceholder]}>
            <Text style={{ fontSize: 34 }}>📦</Text>
          </View>
        )}
      </View>
      <Text style={wcStyles.title} numberOfLines={2}>{p.title}</Text>
      <View style={wcStyles.priceRow}>
        {discount > 0 && <Text style={wcStyles.discount}>{discount}%</Text>}
        <Text style={wcStyles.price}>{price.toLocaleString()}원</Text>
      </View>
      {p.source === 'product' && p.cashbackRate ? (
        <Text style={wcStyles.cashback}>캐시백 {p.cashbackRate}%</Text>
      ) : (
        <Text style={wcStyles.point}>{Math.floor(price * POINT_RATE).toLocaleString()}P 적립</Text>
      )}
    </TouchableOpacity>
  );
}

interface MallItem {
  id: string;
  platform: string;
  name: string;
  iconUrl?: string;
  color?: string;
  cashbackRate?: number;
  baseUrl?: string;
}

function MallRow({ m, onPress }: { m: MallItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={mallStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[mallStyles.logo, { backgroundColor: m.color || COLORS.ink[100] }]}>
        {m.iconUrl ? (
          <Image source={{ uri: m.iconUrl }} style={mallStyles.logoImg} resizeMode="contain" />
        ) : (
          <Text style={mallStyles.logoTxt} numberOfLines={1}>{m.name?.[0] ?? '?'}</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={mallStyles.name} numberOfLines={1}>{m.name}</Text>
        {typeof m.cashbackRate === 'number' && m.cashbackRate > 0 ? (
          <Text style={mallStyles.rate}>최대 <Text style={mallStyles.rateStrong}>{m.cashbackRate}%</Text> 캐시백</Text>
        ) : (
          <Text style={mallStyles.platform}>{m.platform}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.ink[400]} />
    </TouchableOpacity>
  );
}

export default function WishlistScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('products');
  const [products, setProducts] = useState<WishProduct[]>([]);
  const [malls, setMalls] = useState<MallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [mk, p, m] = await Promise.all([
        getMarketWishlist().catch(() => ({ items: [], ids: [] })),
        getWishlist().catch(() => ({ items: [] })),
        getMallWishlist().catch(() => ({ items: [] })),
      ]);
      const market: WishProduct[] = (mk?.items || []).map((x: any) => ({
        id: x.id, title: x.title, price: Number(x.price),
        originalPrice: x.originalPrice != null ? Number(x.originalPrice) : undefined,
        discountRate: x.discountRate != null ? Number(x.discountRate) : undefined,
        imageUrl: x.imageUrl, source: 'market',
      }));
      const affiliate: WishProduct[] = (p?.items || []).map((x: any) => ({
        id: x.id, title: x.title, price: Number(x.price),
        originalPrice: x.originalPrice != null ? Number(x.originalPrice) : undefined,
        discountRate: x.discountRate != null ? Number(x.discountRate) : undefined,
        imageUrl: x.imageUrl, cashbackRate: x.cashbackRate, source: 'product',
      }));
      setProducts([...market, ...affiliate]);
      setMalls((m?.items || []) as MallItem[]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 탭 진입(focus)마다 재조회 — 방금 찜한 항목이 즉시 목록에 보이도록
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const count = tab === 'products' ? products.length : malls.length;

  return (
    <View style={styles.container}>
      {/* Segmented tabs */}
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segItem, tab === 'products' && styles.segItemActive]}
            onPress={() => setTab('products')}
          >
            <Text style={[styles.segText, tab === 'products' && styles.segTextActive]}>
              상품 {products.length > 0 ? products.length : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segItem, tab === 'malls' && styles.segItemActive]}
            onPress={() => setTab('malls')}
          >
            <Text style={[styles.segText, tab === 'malls' && styles.segTextActive]}>
              쇼핑몰 {malls.length > 0 ? malls.length : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          총 <Text style={styles.countStrong}>{count}</Text>개
        </Text>
      </View>

      {tab === 'products' ? (
        products.length === 0 ? (
          <EmptyState
            icon="heart-outline"
            title="찜한 상품이 없어요"
            subtitle="상품 상세에서 하트를 눌러 관심 상품을 모아보세요."
            actionLabel="상품 둘러보기"
            onAction={() => router.push('/market')}
          />
        ) : (
          <FlatList
            data={products}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
            }
            renderItem={({ item }) => (
              <WishCard
                p={item}
                onPress={() =>
                  router.push(
                    item.source === 'market' ? `/market/${item.id}` : `/product/${item.id}`,
                  )
                }
              />
            )}
          />
        )
      ) : malls.length === 0 ? (
        <EmptyState
          icon="storefront-outline"
          title="찜한 쇼핑몰이 없어요"
          subtitle="자주 가는 쇼핑몰을 찜해두면 여기서 빠르게 접근할 수 있어요."
          actionLabel="쇼핑몰 둘러보기"
          onAction={() => router.push('/categories')}
        />
      ) : (
        <FlatList
          data={malls}
          style={styles.mallListOuter}
          contentContainerStyle={styles.mallList}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          renderItem={({ item }) => (
            <MallRow m={item} onPress={() => router.push(`/mall/${item.platform}`)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: QM.pageBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, backgroundColor: QM.pageBg },

  segmentWrap: { paddingHorizontal: SPACING.xl, paddingTop: 12 },
  segment: {
    flexDirection: 'row',
    backgroundColor: QM.hairline,
    borderRadius: 10,
    padding: 4,
  },
  segItem: {
    flex: 1, height: 36,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  segItemActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segText: { fontSize: 13, fontWeight: '700', color: QM.sub },
  segTextActive: { color: QM.ink, fontWeight: '800' },

  countRow: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 14,
    paddingBottom: 6,
  },
  countText: { fontSize: 13, color: COLORS.ink[600] },
  countStrong: { color: QM.ink, fontWeight: '800' },

  row: { justifyContent: 'space-between', paddingHorizontal: SPACING.lg },
  listContent: { paddingTop: SPACING.sm, paddingBottom: SPACING.xxxl },

  mallListOuter: { paddingHorizontal: SPACING.xl, paddingTop: 8 },
  mallList: {
    backgroundColor: QM.card,
    borderRadius: 18,
    paddingHorizontal: 2,
    paddingBottom: 0,
    marginBottom: SPACING.xxxl,
    ...QM.cardShadow,
  },
  sep: { height: 1, backgroundColor: '#F1F2F4', marginHorizontal: SPACING.lg },
});

const mallStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    gap: 14,
  },
  logo: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: 32, height: 32 },
  logoTxt: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '800', color: QM.ink },
  rate: { fontSize: 12, color: COLORS.ink[600], marginTop: 2 },
  rateStrong: { color: QM.coral, fontWeight: '800' },
  platform: { fontSize: 12, color: COLORS.ink[500], marginTop: 2 },
});

const wcStyles = StyleSheet.create({
  card: { width: '48%', marginBottom: SPACING.lg },
  imgBox: {
    width: '100%', aspectRatio: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[100],
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FONT.sizes.sm, color: COLORS.ink[800], lineHeight: 18, marginTop: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  discount: { fontSize: FONT.sizes.md, fontWeight: '800', color: QM.coral },
  price: { fontSize: FONT.sizes.md, fontWeight: '800', color: QM.ink },
  cashback: { fontSize: FONT.sizes.xs, color: QM.coral, fontWeight: '700', marginTop: 3 },
  point: { fontSize: FONT.sizes.xs, color: QM.coral, fontWeight: '700', marginTop: 3 },
});
