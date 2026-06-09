import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS, QM } from '../../src/constants/theme';
import PlatformFilter from '../../src/components/PlatformFilter';
import ProductCard from '../../src/components/ProductCard';
import { getProducts } from '../../src/api/products';
import { getMalls, type Mall } from '../../src/api/home';
import { MallCard } from '../../src/components/MallCard';

const POPULAR_KEYWORDS = ['에어팟', '나이키', '다이슨', '갤럭시', '아이패드', '무선충전기', '운동화', '맥북'];

export default function SearchScreen() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [malls, setMalls] = useState<Mall[]>([]);

  useEffect(() => {
    getMalls().then(setMalls).catch(() => setMalls([]));
  }, []);

  const matchingMalls = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return [];
    return malls.filter(
      (m) => m.name.toLowerCase().includes(kw) || m.platform.toLowerCase().includes(kw),
    );
  }, [keyword, malls]);

  const handleSearch = async (searchKeyword?: string) => {
    const kw = searchKeyword || keyword;
    if (!kw.trim()) return;

    setHasSearched(true);
    setLoading(true);
    setPage(1);
    try {
      const data = await getProducts({
        keyword: kw,
        platform: selectedPlatform || undefined,
        page: 1,
        limit: 20,
      });
      if (data?.items?.length > 0) {
        setProducts(data.items);
        setHasMore(data.page < data.totalPages);
      } else {
        setProducts([]);
        setHasMore(false);
      }
    } catch {
      setProducts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await getProducts({
        keyword,
        platform: selectedPlatform || undefined,
        page: nextPage,
        limit: 20,
      });
      if (data?.items?.length > 0) {
        setProducts((prev) => [...prev, ...data.items]);
        setPage(nextPage);
        setHasMore(nextPage < data.totalPages);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="상품명, 브랜드 검색"
          placeholderTextColor={COLORS.gray[400]}
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
        />
        {keyword.length > 0 && (
          <TouchableOpacity onPress={() => { setKeyword(''); setHasSearched(false); setProducts([]); }}>
            <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
          </TouchableOpacity>
        )}
      </View>

      {/* 매칭 쇼핑몰 (입력 즉시) */}
      {keyword.trim().length > 0 && matchingMalls.length > 0 ? (
        <View style={styles.mallMatch}>
          <Text style={styles.mallMatchTitle}>쇼핑몰 바로가기</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mallMatchRow}>
            {matchingMalls.map((m) => (
              <MallCard
                key={m.id}
                mall={m}
                variant="search"
                onPress={() => router.push(`/mall/${m.platform}` as any)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <PlatformFilter selected={selectedPlatform} onSelect={setSelectedPlatform} />

      {!hasSearched ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.popularSection}>
          {/* 추천 쇼핑몰 (샵백 Travel section 대응) */}
          {malls.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>추천 쇼핑몰</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recMallRow}>
                {malls.slice(0, 8).map((m) => (
                  <MallCard
                    key={m.id}
                    mall={m}
                    variant="search"
                    onPress={() => router.push(`/mall/${m.platform}` as any)}
                  />
                ))}
              </ScrollView>
            </>
          ) : null}

          <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>인기 검색어</Text>
          <View style={styles.keywordGrid}>
            {POPULAR_KEYWORDS.map((kw, i) => (
              <TouchableOpacity
                key={kw}
                style={styles.keywordChip}
                onPress={() => { setKeyword(kw); handleSearch(kw); }}
              >
                <Text style={styles.keywordRank}>{i + 1}</Text>
                <Text style={styles.keywordText}>{kw}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          style={{ flex: 1 }}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard {...item} onPress={(id) => router.push(`/product/${id}`)} />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ paddingVertical: 20 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={COLORS.gray[300]} />
              <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: QM.pageBg },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: QM.fieldBg, marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, height: 48, gap: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT.sizes.md, color: COLORS.gray[900] },
  popularSection: { padding: SPACING.lg },
  sectionTitle: { fontSize: FONT.sizes.lg, fontWeight: '800', color: QM.ink, marginBottom: SPACING.md },
  keywordGrid: { gap: SPACING.sm },
  keywordChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: QM.hairline, gap: SPACING.md },
  keywordRank: { fontSize: FONT.sizes.md, fontWeight: '800', color: QM.coral, width: 24 },
  keywordText: { fontSize: FONT.sizes.md, color: COLORS.gray[700] },
  row: { justifyContent: 'space-between', paddingHorizontal: SPACING.lg },
  listContent: { paddingBottom: SPACING.xxxl },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: FONT.sizes.md, color: COLORS.gray[500] },

  mallMatch: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: QM.hairline,
  },
  mallMatchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: QM.ink,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  mallMatchRow: { paddingHorizontal: SPACING.lg, gap: 8 },

  recMallRow: { paddingVertical: SPACING.sm, gap: 8 },
});

