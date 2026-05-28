import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { getMalls, type Mall } from '../../src/api/home';
import { MallCard } from '../../src/components/MallCard';
import { PromoCarousel, type PromoSlide } from '../../src/components/PromoCarousel';

// 샵백식 카테고리 분류. key = mall.category 매칭 키.
const CAT_TILES: { key: string; label: string; emoji: string }[] = [
  { key: '종합쇼핑',    label: '오픈마켓',   emoji: '🛒' },
  { key: '패션',        label: '패션',       emoji: '👟' },
  { key: '뷰티',        label: '뷰티',       emoji: '💄' },
  { key: '가전·디지털', label: '가전',       emoji: '📱' },
  { key: '여행·예약',   label: '여행',       emoji: '✈️' },
  { key: '홈·인테리어', label: '홈라이프',   emoji: '🏠' },
  { key: '식품·생필품', label: '식품',       emoji: '🥬' },
  { key: '보험',        label: '보험',       emoji: '🛡️' },
  { key: '도서',        label: '도서',       emoji: '📚' },
  { key: '유아동',      label: '유아동',     emoji: '🧸' },
];

const CAT_PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'cat-travel',
    badge: '여행 BIG',
    title: '여행 카테고리 캐시백 +5%',
    subtitle: '아고다 · 클룩 · 트립닷컴',
    image: require('../../assets/images/banner-travel.jpg'),
  },
  {
    id: 'cat-fashion',
    badge: '패션',
    title: '신상 입고 패션 최대 12%',
    subtitle: 'adidas · SHEIN · W.CONCEPT',
    image: require('../../assets/images/banner-fashion.jpg'),
  },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  useEffect(() => {
    getMalls()
      .then((data) => setMalls(data || []))
      .catch(() => setMalls([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Mall[]>();
    for (const m of malls) {
      const key = m.category || '종합쇼핑';
      const arr = map.get(key) || [];
      arr.push(m);
      map.set(key, arr);
    }
    return map;
  }, [malls]);

  const selectedTile = selectedCat ? CAT_TILES.find((t) => t.key === selectedCat) : null;
  const selectedItems = selectedCat ? grouped.get(selectedCat) || [] : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>카테고리</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="bookmark-outline" size={22} color={COLORS.ink[800]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Featured: 카드사 혜택 */}
        <TouchableOpacity style={styles.featured} activeOpacity={0.85}>
          <View style={styles.featuredIcon}>
            <Ionicons name="card-outline" size={26} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.featuredTitle}>카드사 혜택</Text>
            <Text style={styles.featuredSub}>제휴 카드 캐시백 추가 적립</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.ink[400]} />
        </TouchableOpacity>

        {/* Promo carousel */}
        <View style={{ marginTop: 18 }}>
          <PromoCarousel slides={CAT_PROMO_SLIDES} />
        </View>

        {/* Category tile grid */}
        <Text style={styles.gridTitle}>전체 카테고리</Text>
        <View style={styles.tileGrid}>
          {CAT_TILES.map((t) => {
            const active = selectedCat === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={styles.tile}
                onPress={() => setSelectedCat(active ? null : t.key)}
                activeOpacity={0.75}
              >
                <View style={[styles.tileIcon, active && styles.tileIconActive]}>
                  <Text style={styles.tileEmoji}>{t.emoji}</Text>
                </View>
                <Text style={[styles.tileLabel, active && styles.tileLabelActive]} numberOfLines={1}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.gridDivider} />

        {/* Sections */}
        {loading && malls.length === 0 ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : selectedTile ? (
          /* 선택된 카테고리만 */
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{selectedTile.label} {selectedTile.emoji}</Text>
              <TouchableOpacity onPress={() => setSelectedCat(null)}>
                <Text style={styles.resetText}>전체 보기</Text>
              </TouchableOpacity>
            </View>
            {selectedItems.length === 0 ? (
              <View style={styles.emptyCat}>
                <Ionicons name="storefront-outline" size={34} color={COLORS.ink[300]} />
                <Text style={styles.emptyCatText}>{selectedTile.label} 카테고리는 준비 중입니다</Text>
              </View>
            ) : (
              <View style={styles.wrapGrid}>
                {selectedItems.map((m) => (
                  <MallCard
                    key={m.id}
                    mall={m}
                    variant="category"
                    style={styles.wrapCard}
                    onPress={() => router.push(`/mall/${m.platform}` as any)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          /* 전체 — 카테고리별 미리보기 */
          CAT_TILES.map((t) => {
            const items = grouped.get(t.key) || [];
            if (items.length === 0) return null;
            return (
              <View key={t.key} style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{t.label} {t.emoji}</Text>
                  {items.length > 3 ? (
                    <TouchableOpacity onPress={() => setSelectedCat(t.key)}>
                      <Text style={styles.moreText}>더보기</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.tileRow}>
                  {items.slice(0, 3).map((m) => (
                    <MallCard
                      key={m.id}
                      mall={m}
                      variant="category"
                      onPress={() => router.push(`/mall/${m.platform}` as any)}
                    />
                  ))}
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  headerAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  featured: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featuredIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  featuredTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink[900] },
  featuredSub: { fontSize: 12, color: COLORS.ink[500], marginTop: 2 },

  gridTitle: {
    fontSize: 16, fontWeight: '800', color: COLORS.ink[900],
    paddingHorizontal: SPACING.xl, marginTop: 26, letterSpacing: -0.3,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    marginTop: 14,
    rowGap: 18,
  },
  tile: { width: '25%', alignItems: 'center', gap: 6 },
  tileIcon: {
    width: 58, height: 58, borderRadius: 18,
    backgroundColor: COLORS.ink[50],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'transparent',
  },
  tileIconActive: { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primary },
  tileEmoji: { fontSize: 25 },
  tileLabel: { fontSize: 12, color: COLORS.ink[700], fontWeight: '600' },
  tileLabelActive: { color: COLORS.primary, fontWeight: '800' },

  gridDivider: { height: 8, backgroundColor: COLORS.ink[50], marginTop: 24 },

  section: { marginTop: 26, paddingHorizontal: SPACING.xl },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink[900], letterSpacing: -0.3 },
  moreText: { fontSize: 13, color: '#1673E8', fontWeight: '500' },
  resetText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

  tileRow: { flexDirection: 'row', gap: 8 },
  wrapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, rowGap: 14 },
  wrapCard: { flex: 0, width: '31.5%' },

  emptyCat: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyCatText: { fontSize: 13, color: COLORS.ink[500] },
});
