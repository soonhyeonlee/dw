import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/constants/theme';
import {
  getMarketProducts,
  getMarketCategories,
  type MarketProduct,
  type MarketCategory,
} from '../../src/api/market';

const PURPLE = '#6633CC';
const POINT_RATE = 0.02; // 번개장터 적립률 2% (백엔드와 동기)
const PAGE_SIZE = 20;

function MarketSearchCard({ p, onPress }: { p: MarketProduct; onPress: () => void }) {
  const price = Number(p.price);
  const orig = p.originalPrice ? Number(p.originalPrice) : undefined;
  const discount =
    p.discountRate != null
      ? Math.round(Number(p.discountRate))
      : orig && orig > price
        ? Math.round(((orig - price) / orig) * 100)
        : 0;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardImg}>
        {p.imageUrl ? (
          <Image source={{ uri: p.imageUrl }} style={styles.cardImgInner} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImgInner, styles.cardImgPlaceholder]}>
            <Text style={{ fontSize: 34 }}>📦</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{p.title}</Text>
      <View style={styles.cardPriceRow}>
        {discount > 0 && <Text style={styles.cardDiscount}>{discount}%</Text>}
        <Text style={styles.cardPrice}>{price.toLocaleString()}원</Text>
      </View>
      <Text style={styles.cardPoint}>{Math.floor(price * POINT_RATE).toLocaleString()}P 적립</Text>
    </TouchableOpacity>
  );
}

export default function MarketSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [cats, setCats] = useState<MarketCategory[]>([]);
  const [results, setResults] = useState<MarketProduct[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // 마지막 조회 조건(더 보기용)
  const [query, setQuery] = useState<{ keyword?: string; category?: string }>({});

  useEffect(() => {
    getMarketCategories().then(setCats).catch(() => setCats([]));
  }, []);

  const runSearch = useCallback(
    async (q: { keyword?: string; category?: string }, label: string) => {
      setHasSearched(true);
      setActiveLabel(label);
      setQuery(q);
      setLoading(true);
      setPage(1);
      try {
        const data = await getMarketProducts({ ...q, page: 1, limit: PAGE_SIZE });
        setResults(data.items || []);
        setHasMore((data.page || 1) < (data.totalPages || 1));
      } catch {
        setResults([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    try {
      const data = await getMarketProducts({ ...query, page: next, limit: PAGE_SIZE });
      if (data.items?.length) {
        setResults((prev) => [...prev, ...data.items]);
        setPage(next);
        setHasMore(next < (data.totalPages || 1));
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const onSubmit = () => {
    const kw = keyword.trim();
    if (!kw) return;
    runSearch({ keyword: kw }, `'${kw}' 검색 결과`);
  };

  const clear = () => {
    setKeyword('');
    setHasSearched(false);
    setResults([]);
    setActiveLabel('');
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="번개장터 상품 검색"
            placeholderTextColor={COLORS.gray[400]}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={onSubmit}
            returnKeyType="search"
            autoFocus
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={clear}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!hasSearched ? (
        <View style={styles.preSection}>
          <Text style={styles.sectionTitle}>카테고리</Text>
          <View style={styles.catWrap}>
            {cats.map((c) => (
              <TouchableOpacity
                key={c.category}
                style={styles.catChip}
                onPress={() => runSearch({ category: c.category }, c.category)}
              >
                <Text style={styles.catChipText}>{c.category}</Text>
                <Text style={styles.catChipCount}>{c.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {cats.length === 0 && (
            <Text style={styles.hint}>상품명을 입력해 번개장터 상품을 검색하세요.</Text>
          )}
        </View>
      ) : loading ? (
        <ActivityIndicator size="large" color={PURPLE} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={results}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            activeLabel ? <Text style={styles.resultLabel}>{activeLabel}</Text> : null
          }
          renderItem={({ item }) => (
            <MarketSearchCard p={item} onPress={() => router.push(`/market/${item.id}`)} />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={PURPLE} style={{ paddingVertical: 20 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color={COLORS.gray[300]} />
              <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.md,
    gap: SPACING.xs,
  },
  backBtn: { padding: SPACING.xs },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 44,
    gap: SPACING.sm,
  },
  searchInput: { flex: 1, fontSize: FONT.sizes.md, color: COLORS.gray[900] },

  preSection: { padding: SPACING.lg },
  sectionTitle: {
    fontSize: FONT.sizes.lg,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 999,
    backgroundColor: PURPLE + '12',
  },
  catChipText: { fontSize: FONT.sizes.sm, fontWeight: '700', color: PURPLE },
  catChipCount: { fontSize: FONT.sizes.xs, color: COLORS.gray[500] },
  hint: { fontSize: FONT.sizes.sm, color: COLORS.gray[500], marginTop: SPACING.md },

  resultLabel: {
    fontSize: FONT.sizes.sm,
    color: COLORS.gray[600],
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  row: { justifyContent: 'space-between', paddingHorizontal: SPACING.lg },
  listContent: { paddingBottom: SPACING.xxxl },

  card: { width: '48%', marginBottom: SPACING.lg },
  cardImg: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[100],
    overflow: 'hidden',
  },
  cardImgInner: { width: '100%', height: '100%' },
  cardImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: FONT.sizes.sm, color: COLORS.gray[800], lineHeight: 18, marginTop: 6 },
  cardPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  cardDiscount: { fontSize: FONT.sizes.md, fontWeight: '800', color: '#FF4040' },
  cardPrice: { fontSize: FONT.sizes.md, fontWeight: '800', color: COLORS.black },
  cardPoint: { fontSize: FONT.sizes.xs, color: PURPLE, fontWeight: '700', marginTop: 3 },

  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: FONT.sizes.md, color: COLORS.gray[500] },
});
