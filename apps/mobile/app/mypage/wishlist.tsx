import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import ProductCard from '../../src/components/ProductCard';
import { EmptyState } from '../../src/components/EmptyState';
import { getWishlist, getMallWishlist } from '../../src/api/products';

type Tab = 'products' | 'malls';

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
  const [products, setProducts] = useState<any[]>([]);
  const [malls, setMalls] = useState<MallItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([
        getWishlist().catch(() => ({ items: [] })),
        getMallWishlist().catch(() => ({ items: [] })),
      ]);
      setProducts(p?.items || []);
      setMalls((m?.items || []) as MallItem[]);
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
              <ProductCard {...item} onPress={(id) => router.push(`/product/${id}`)} />
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
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, backgroundColor: COLORS.background },

  segmentWrap: { paddingHorizontal: SPACING.xl, paddingTop: 12 },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.ink[100],
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
  segText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[500] },
  segTextActive: { color: COLORS.ink[900], fontWeight: '700' },

  countRow: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 14,
    paddingBottom: 6,
  },
  countText: { fontSize: 13, color: COLORS.ink[600] },
  countStrong: { color: COLORS.ink[900], fontWeight: '800' },

  row: { justifyContent: 'space-between', paddingHorizontal: SPACING.lg },
  listContent: { paddingTop: SPACING.sm, paddingBottom: SPACING.xxxl },

  mallList: { paddingHorizontal: SPACING.xl, paddingTop: 4, paddingBottom: SPACING.xxxl },
  sep: { height: 1, backgroundColor: COLORS.divider },
});

const mallStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  logo: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: 32, height: 32 },
  logoTxt: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.ink[900] },
  rate: { fontSize: 12, color: COLORS.ink[600], marginTop: 2 },
  rateStrong: { color: COLORS.primary, fontWeight: '800' },
  platform: { fontSize: 12, color: COLORS.ink[500], marginTop: 2 },
});
