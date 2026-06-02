import React, { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import {
  getMarketProducts,
  getMarketCategories,
  getMarketWishlist,
  toggleMarketWishlist,
  type MarketProduct as ApiMarketProduct,
} from '../../api/market';
import { useAuth } from '../../contexts/AuthContext';

// 번개장터 = 더블윈 직접판매(위탁판매). 구매하면 번개장터 포인트 2% 적립.
const POINT_RATE = 0.02; // 백엔드 MARKET_POINT_RATE_PERCENT 기본값과 동기

// 칩은 고정 목록이 아니라, 실제 들어와 있는 직접판매 상품의 카테고리에서
// 동적으로 생성된다(상품 추가/삭제 시 자동 반영).
type Chip = { key: string; label: string };
const ALL_CHIP: Chip = { key: 'all', label: '전체' };

type MarketProduct = {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
};

function fmt(v: number) { return v.toLocaleString(); }
function pointEarn(price: number) { return Math.floor(price * POINT_RATE); }

function mapProduct(p: ApiMarketProduct): MarketProduct {
  return {
    id: p.id,
    title: p.title,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
    discountRate: p.discountRate ? Number(p.discountRate) : undefined,
    imageUrl: p.imageUrl,
    rating: p.rating != null ? Number(p.rating) : undefined,
    reviewCount: p.reviewCount != null ? Number(p.reviewCount) : undefined,
  };
}

function FeaturedCard({
  p,
  onPress,
  liked,
  onToggleLike,
}: {
  p: MarketProduct;
  onPress: () => void;
  liked?: boolean;
  onToggleLike?: () => void;
}) {
  return (
    <TouchableOpacity style={fStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={fStyles.imgBox}>
        {p.imageUrl ? (
          <Image source={{ uri: p.imageUrl }} style={fStyles.img} resizeMode="cover" />
        ) : (
          <View style={[fStyles.img, fStyles.imgPlaceholder]}>
            <Text style={{ fontSize: 36 }}>📦</Text>
          </View>
        )}
        <TouchableOpacity style={fStyles.likeBtn} onPress={onToggleLike} hitSlop={8}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={16}
            color={liked ? '#FF4040' : COLORS.ink[700]}
          />
        </TouchableOpacity>
      </View>
      <Text style={fStyles.title} numberOfLines={2}>{p.title}</Text>
      <View style={fStyles.priceRow}>
        {p.discountRate ? <Text style={fStyles.discount}>{Math.round(p.discountRate)}%</Text> : null}
        <Text style={fStyles.price}>{fmt(p.price)}원</Text>
      </View>
      <Text style={fStyles.cb}>{fmt(pointEarn(p.price))}P 적립</Text>
    </TouchableOpacity>
  );
}

function FlashCard({ p, onPress }: { p: MarketProduct; onPress: () => void }) {
  const hot = (p.discountRate ?? 0) >= 30;
  return (
    <TouchableOpacity style={flStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={flStyles.imgBox}>
        {p.imageUrl ? (
          <Image source={{ uri: p.imageUrl }} style={flStyles.img} resizeMode="cover" />
        ) : (
          <View style={[flStyles.img, flStyles.imgPlaceholder]}>
            <Text style={{ fontSize: 32 }}>📦</Text>
          </View>
        )}
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
      <Text style={flStyles.sold}>{fmt(pointEarn(p.price))}P 적립</Text>
    </TouchableOpacity>
  );
}

export type MarketContentHandle = {
  reload: () => Promise<void>;
};

export const MarketContent = forwardRef<MarketContentHandle>((_props, ref) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const marketPoint = isAuthenticated ? Number(user?.marketPointBalance || 0) : 0;
  const [wishIds, setWishIds] = useState<Set<string>>(new Set());
  const [cat, setCat] = useState('all');
  const [chips, setChips] = useState<Chip[]>([ALL_CHIP]);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState<MarketProduct[]>([]);
  const [flash, setFlash] = useState<MarketProduct[]>([]);

  // 들어와 있는 직접판매 상품 카테고리로 칩 동적 구성. chip.key = 카테고리명.
  useEffect(() => {
    getMarketCategories()
      .then((cats) => {
        setChips([ALL_CHIP, ...cats.map((c) => ({ key: c.category, label: c.category }))]);
        // 선택돼 있던 카테고리가 사라졌으면 전체로 리셋
        setCat((prev) =>
          prev === 'all' || cats.some((c) => c.category === prev) ? prev : 'all',
        );
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const apiCat = cat === 'all' ? undefined : cat;
      const data = await getMarketProducts({ category: apiCat, limit: 30 });
      const items: ApiMarketProduct[] = data?.items || [];
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
  useImperativeHandle(ref, () => ({ reload: loadData }), [loadData]);

  // 찜 상태 로드(로그인 시)
  useEffect(() => {
    if (!isAuthenticated) { setWishIds(new Set()); return; }
    getMarketWishlist()
      .then((w) => setWishIds(new Set(w.ids || [])))
      .catch(() => {});
  }, [isAuthenticated]);

  const handleToggleLike = useCallback((productId: string) => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '찜하려면 로그인이 필요합니다', [
        { text: '취소' },
        { text: '로그인', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    // 낙관적 토글
    setWishIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
    toggleMarketWishlist(productId).catch(() => {
      // 실패 시 롤백
      setWishIds((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
    });
  }, [isAuthenticated, router]);

  const hero = featured[0];

  return (
    <View>
      {/* 번개장터 전용 포인트 — 구매로 적립, 번개장터에서만 사용(현금화 불가) */}
      {isAuthenticated && (
        <View style={styles.pointCard}>
          <View style={styles.pointIcon}>
            <Ionicons name="flash" size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pointLabel}>번개장터 포인트</Text>
            <Text style={styles.pointSub}>구매하면 적립 · 번개장터에서만 사용</Text>
          </View>
          <Text style={styles.pointValue}>{fmt(Math.floor(marketPoint))}P</Text>
        </View>
      )}

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {chips.map((c) => {
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
          onPress={() => router.push(`/market/${hero.id}`)}
          activeOpacity={0.9}
        >
          {hero.imageUrl ? (
            <Image source={{ uri: hero.imageUrl }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <View style={[styles.heroImg, styles.heroPlaceholder]}>
              <Text style={{ fontSize: 56 }}>📦</Text>
            </View>
          )}
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
          <Text style={styles.emptyText}>이 분류에는 아직 상품이 없어요</Text>
          <Text style={styles.emptySub}>다른 분류를 확인하거나 잠시 후 다시 시도해 주세요.</Text>
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
                  <FlashCard key={p.id} p={p} onPress={() => router.push(`/market/${p.id}`)} />
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
              <FeaturedCard
                key={p.id}
                p={p}
                liked={wishIds.has(p.id)}
                onToggleLike={() => handleToggleLike(p.id)}
                onPress={() => router.push(`/market/${p.id}`)}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
});
MarketContent.displayName = 'MarketContent';

const styles = StyleSheet.create({
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: SPACING.xl,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.lg,
  },
  pointIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  pointLabel: { fontSize: 14, fontWeight: '800', color: COLORS.ink[900] },
  pointSub: { fontSize: 11, color: COLORS.ink[600], marginTop: 1 },
  pointValue: { fontSize: 20, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.3 },

  chips: { paddingHorizontal: SPACING.xl, gap: 8, paddingVertical: 12 },
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
    marginTop: 4,
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImg: { width: '100%', height: '100%' },
  heroPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.ink[100] },
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
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  titleGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.ink[900], letterSpacing: -0.3 },

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
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
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
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
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
  sold: { fontSize: 10, color: COLORS.ink[500], fontWeight: '600' },
});
