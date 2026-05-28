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
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';
import { getMalls, type Mall } from '../src/api/home';
import { MallCard } from '../src/components/MallCard';
import { PromoCarousel, type PromoSlide } from '../src/components/PromoCarousel';

const CATEGORY_ORDER: { key: string; label: string; emoji: string }[] = [
  { key: '종합쇼핑',        label: '종합쇼핑',        emoji: '🛍️' },
  { key: '패션',            label: '패션',            emoji: '👟' },
  { key: '뷰티',            label: '뷰티',            emoji: '💄' },
  { key: '식품·생필품',     label: '식품·생필품',     emoji: '🥬' },
  { key: '가전·디지털',     label: '가전·디지털',     emoji: '📱' },
  { key: '여행·예약',       label: '여행·예약',       emoji: '✈️' },
  { key: '도서',            label: '도서',            emoji: '📚' },
  { key: '홈·인테리어',     label: '홈·인테리어',     emoji: '🏠' },
  { key: '유아동',          label: '유아동',          emoji: '👶' },
];

const CAT_PROMO_SLIDES: PromoSlide[] = [
  {
    id: 'cat-travel',
    badge: '여행 BIG',
    title: '여행 카테고리 캐시백 +5%',
    subtitle: '아고다 · 클룩 · 트립닷컴',
    bg: ['#1673E8', '#0C5CC2'],
  },
  {
    id: 'cat-fashion',
    badge: '패션',
    title: '신상 입고 패션 최대 12%',
    subtitle: 'adidas · SHEIN · W.CONCEPT',
    bg: ['#E97DCE', '#9B77F7'],
  },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [malls, setMalls] = useState<Mall[]>([]);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Custom header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.ink[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>카테고리</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="bookmark-outline" size={22} color={COLORS.ink[800]} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Featured: 카드사 혜택 (placeholder for future) */}
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

        {/* Category sections */}
        {loading && malls.length === 0 ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 80 }} />
        ) : (
          CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat.key) || [];
            if (items.length === 0) return null;
            return (
              <View key={cat.key} style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>{cat.label} {cat.emoji}</Text>
                  {items.length > 3 ? (
                    <TouchableOpacity>
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
    paddingHorizontal: SPACING.md,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
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

  section: { marginTop: 28, paddingHorizontal: SPACING.xl },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink[900], letterSpacing: -0.3 },
  moreText: { fontSize: 13, color: '#1673E8', fontWeight: '500' },

  tileRow: { flexDirection: 'row', gap: 8 },
});

