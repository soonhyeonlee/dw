import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { getProducts, type Product as ApiProduct } from '../../src/api/products';

const CATS = [
  { key: 'all',     label: '전체',    apiKey: undefined },
  { key: 'food',    label: '식품',    apiKey: '식품' },
  { key: 'health',  label: '건강',    apiKey: '건강' },
  { key: 'living',  label: '생활',    apiKey: '생활' },
  { key: 'beauty',  label: '뷰티',    apiKey: '뷰티' },
  { key: 'digital', label: '디지털',  apiKey: '디지털' },
];

type MarketProduct = {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  cashbackRate: number;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
};

function fmt(v: number) { return v.toLocaleString(); }

function mapProduct(p: ApiProduct): MarketProduct {
  return {
    id: p.id,
    title: p.title,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
    discountRate: p.discountRate ? Number(p.discountRate) : undefined,
    cashbackRate: Number(p.cashbackRate),
    imageUrl: p.imageUrl,
    rating: p.rating != null ? Number(p.rating) : undefined,
    reviewCount: p.reviewCount != null ? Number(p.reviewCount) : undefined,
  };
}

function FeaturedCard({ p, onPress }: { p: MarketProduct; onPress: () => void }) {
  return (
    <TouchableOpacity style={fStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={fStyles.imgBox}>
        <Image source={{ uri: p.imageUrl }} style={fStyles.img} resizeMode="cover" />
        <TouchableOpacity style={fStyles.likeBtn}>
          <Ionicons name="heart-outline" size={16} color={COLORS.ink[700]} />
        </TouchableOpacity>
      </View>
      <Text style={fStyles.title} numberOfLines={2}>{p.title}</Text>
      <View style={fStyles.priceRow}>
        {p.discountRate ? <Text style={fStyles.discount}>{Math.round(p.discountRate)}%</Text> : null}
        <Text style={fStyles.price}>{fmt(p.price)}원</Text>
      </View>
      {(p.rating != null || p.reviewCount != null) ? (
        <View style={fStyles.metaRow}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={fStyles.rating}>{p.rating != null ? p.rating.toFixed(1) : '-'}</Text>
          <Text style={fStyles.review}>({fmt(p.reviewCount ?? 0)})</Text>
        </View>
      ) : (
        <Text style={fStyles.cb}>캐시백 {p.cashbackRate}%</Text>
      )}
    </TouchableOpacity>
  );
}

function FlashCard({ p, onPress }: { p: MarketProduct; onPress: () => void }) {
  const hot = (p.discountRate ?? 0) >= 30;
  return (
    <TouchableOpacity style={flStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={flStyles.imgBox}>
        <Image source={{ uri: p.imageUrl }} style={flStyles.img} resizeMode="cover" />
        {hot && (
          <View style={flStyles.urgentBadge}>
            <Text style={flStyles.urgentText}>특가</Text>
          </View>
        )}
      </View>
      <Text style={flStyles.title} numberOfLines={2}>{p.title}</Text>
      <View style={flStyles.priceRow}>
        {p.discountRate ? <Text style={flStyles.discount}>{Math.round(p.discountRate)}%</Text> : null}
        <Text style={flStyles.price}>{fmt(p.price)}원</Text>
      </View>
      <Text style={flStyles.sold}>캐시백 {p.cashbackRate}% 적립</Text>
    </TouchableOpacity>
  );
}

export default function MarketScreen() {
  const router = useRouter();
  const [cat, setCat] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState<MarketProduct[]>([]);
  const [flash, setFlash] = useState<MarketProduct[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const apiCat = CATS.find((c) => c.key === cat)?.apiKey;
      const data = await getProducts({
        platform: 'doublewin,ihomemarket',
        category: apiCat,
        limit: 30,
      });
      const items: ApiProduct[] = data?.items || [];
      const mapped = items.map(mapProduct);
      const sorted = [...mapped].sort((a, b) => (b.discountRate ?? 0) - (a.discountRate ?? 0));
      setFlash(sorted.slice(0, 6));
      setFeatured(mapped);
    } catch {
      setFeatured([]);
      setFlash([]);
    } finally {
      setLoading(false);
    }
  }, [cat]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const hero = featured[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.title}>번개장터</Text>
            <Text style={styles.subtitle}>더블윈 산지직송 위탁판매</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/search')}>
            <Ionicons name="search-outline" size={24} color={COLORS.ink[800]} />
          </TouchableOpacity>
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATS.map((c) => {
            const active = c.key === cat;
            return (
              <TouchableOpacity
                key={c.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCat(c.key)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Hero banner */}
        {hero && (
          <TouchableOpacity
            style={styles.hero}
            onPress={() => router.push(`/product/${hero.id}`)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: hero.imageUrl }} style={styles.heroImg} resizeMode="cover" />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>기획전</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>{hero.title}</Text>
              <View style={styles.heroPriceRow}>
                {hero.discountRate ? <Text style={styles.heroDiscount}>{Math.round(hero.discountRate)}%</Text> : null}
                <Text style={styles.heroPrice}>{fmt(hero.price)}원</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {loading && featured.length === 0 ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : featured.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={42} color={COLORS.ink[300]} />
            <Text style={styles.emptyText}>등록된 페이백 상품이 없습니다</Text>
            <Text style={styles.emptySub}>관리자 페이지에서 상품을 추가하면 이곳에 노출됩니다.</Text>
          </View>
        ) : (
          <>
            {/* Flash deals */}
            {flash.length > 0 && (
              <>
                <View style={styles.sectionHead}>
                  <View style={styles.titleGroup}>
                    <Text style={styles.sectionTitle}>지금 특가</Text>
                  </View>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.flashScroll}
                >
                  {flash.map((p) => (
                    <FlashCard key={p.id} p={p} onPress={() => router.push(`/product/${p.id}`)} />
                  ))}
                </ScrollView>

                <View style={styles.divider} />
              </>
            )}

            {/* Featured grid */}
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>이번 주 추천</Text>
            </View>
            <View style={styles.grid}>
              {featured.map((p) => (
                <FeaturedCard key={p.id} p={p} onPress={() => router.push(`/product/${p.id}`)} />
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.ink[500], marginTop: 2, fontWeight: '500' },
  iconBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  chips: { paddingHorizontal: SPACING.xl, gap: 8, paddingBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.ink[100],
  },
  chipActive: { backgroundColor: COLORS.ink[900] },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.ink[700] },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },

  hero: {
    marginHorizontal: SPACING.xl,
    marginTop: 12,
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
    justifyContent: 'flex-end',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  heroBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  heroTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 6, lineHeight: 24 },
  heroPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  heroDiscount: { fontSize: 18, fontWeight: '800', color: '#FFB896' },
  heroPrice: { fontSize: 18, fontWeight: '800', color: COLORS.white },

  sectionHead: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 28,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  titleGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.ink[900], letterSpacing: -0.3 },
  timer: { fontSize: 12, fontWeight: '700', color: COLORS.primary, fontVariant: ['tabular-nums'] },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moreText: { fontSize: 12, color: COLORS.ink[500] },

  flashScroll: { paddingHorizontal: SPACING.xl, gap: 12 },
  divider: { height: 8, backgroundColor: COLORS.ink[50], marginTop: 24 },

  grid: {
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  emptyBox: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xl, paddingVertical: 60,
    gap: 8,
  },
  emptyText: { fontSize: 14, fontWeight: '600', color: COLORS.ink[700] },
  emptySub: { fontSize: 12, color: COLORS.ink[500], textAlign: 'center' },
});

const fStyles = StyleSheet.create({
  card: { width: '48%', gap: 6 },
  imgBox: {
    width: '100%', aspectRatio: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[100],
    overflow: 'hidden',
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  likeBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 13, color: COLORS.ink[800], lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  discount: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  price: { fontSize: 14, fontWeight: '800', color: COLORS.ink[900] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: 11, fontWeight: '700', color: COLORS.ink[800] },
  review: { fontSize: 11, color: COLORS.ink[500] },
  cb: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
});

const flStyles = StyleSheet.create({
  card: { width: 160, gap: 8 },
  imgBox: {
    width: 160, height: 160,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[100],
    overflow: 'hidden',
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  urgentBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 6,
  },
  urgentText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  title: { fontSize: 12, color: COLORS.ink[700], lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  discount: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.ink[900] },
  progressBg: {
    height: 4,
    backgroundColor: COLORS.ink[200],
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  sold: { fontSize: 10, color: COLORS.ink[500], fontWeight: '600' },
});
