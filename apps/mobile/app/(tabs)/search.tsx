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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/constants/theme';
import PlatformFilter from '../../src/components/PlatformFilter';
import ProductCard from '../../src/components/ProductCard';
import { getProducts } from '../../src/api/products';
import { getMalls, type Mall } from '../../src/api/home';

const DEMO_PRODUCTS = [
  { id: '1', platform: 'coupang', title: '나이키 에어맥스 270 남성 러닝화', price: 89000, originalPrice: 159000, imageUrl: 'https://via.placeholder.com/300x300/FF6B35/FFFFFF?text=NIKE', cashbackRate: 3, cashbackAmount: 2670 },
  { id: '2', platform: 'naver', title: '애플 에어팟 프로 2세대 USB-C', price: 298000, originalPrice: 359000, imageUrl: 'https://via.placeholder.com/300x300/03C75A/FFFFFF?text=AirPods', cashbackRate: 2, cashbackAmount: 5960 },
  { id: '3', platform: '11st', title: '삼성 갤럭시 버즈3 프로', price: 249000, originalPrice: 329000, imageUrl: 'https://via.placeholder.com/300x300/FF0038/FFFFFF?text=Galaxy', cashbackRate: 2.5, cashbackAmount: 6225 },
];

const POPULAR_KEYWORDS = ['에어팟', '나이키', '다이슨', '갤럭시', '아이패드', '무선충전기', '운동화', '맥북'];

function mallLogoUrl(baseUrl?: string): string | undefined {
  if (!baseUrl) return undefined;
  try {
    const u = new URL(baseUrl);
    return `https://logo.clearbit.com/${u.hostname}?size=120`;
  } catch {
    return undefined;
  }
}

function MallChip({ mall, onPress }: { mall: Mall; onPress: () => void }) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoUrl = mallLogoUrl(mall.baseUrl);
  const useImage = !!logoUrl && !imgFailed;
  return (
    <TouchableOpacity style={chipStyles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[chipStyles.logoBox, !useImage && { backgroundColor: mall.color }]}>
        {useImage ? (
          <Image
            source={{ uri: logoUrl }}
            style={chipStyles.logoImg}
            resizeMode="contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Text style={chipStyles.logoFallback}>{mall.name.slice(0, 1)}</Text>
        )}
      </View>
      <Text style={chipStyles.name} numberOfLines={1}>{mall.name}</Text>
      <Text style={chipStyles.rate}>최대 {Number(mall.cashbackRate)}%</Text>
    </TouchableOpacity>
  );
}

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
        setProducts(DEMO_PRODUCTS.filter((p) =>
          p.title.toLowerCase().includes(kw.toLowerCase()),
        ));
        setHasMore(false);
      }
    } catch {
      setProducts(DEMO_PRODUCTS);
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
    <View style={styles.container}>
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
              <MallChip
                key={m.id}
                mall={m}
                onPress={() => router.push(`/mall/${m.platform}` as any)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <PlatformFilter selected={selectedPlatform} onSelect={setSelectedPlatform} />

      {!hasSearched ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.popularSection}>
          {/* 추천 쇼핑몰 (샵백 Travel section 대응) */}
          {malls.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>추천 쇼핑몰</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recMallRow}>
                {malls.slice(0, 8).map((m) => (
                  <MallChip
                    key={m.id}
                    mall={m}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray[100], marginHorizontal: SPACING.lg, marginTop: SPACING.md, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, height: 48, gap: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT.sizes.md, color: COLORS.gray[900] },
  popularSection: { padding: SPACING.lg },
  sectionTitle: { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.secondary, marginBottom: SPACING.md },
  keywordGrid: { gap: SPACING.sm },
  keywordChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gray[100], gap: SPACING.md },
  keywordRank: { fontSize: FONT.sizes.md, fontWeight: '800', color: COLORS.primary, width: 24 },
  keywordText: { fontSize: FONT.sizes.md, color: COLORS.gray[700] },
  row: { justifyContent: 'space-between', paddingHorizontal: SPACING.lg },
  listContent: { paddingBottom: SPACING.xxxl },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: FONT.sizes.md, color: COLORS.gray[500] },

  mallMatch: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  mallMatchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink[800],
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  mallMatchRow: { paddingHorizontal: SPACING.lg, gap: 8 },

  recMallRow: { paddingVertical: SPACING.sm, gap: 8 },
});

const chipStyles = StyleSheet.create({
  card: {
    width: 78,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  logoBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.ink[200],
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  logoImg: { width: 38, height: 38 },
  logoFallback: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  name: { fontSize: 11, fontWeight: '500', color: COLORS.ink[800] },
  rate: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
});
