import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, QM } from '../../src/constants/theme';
import { getMalls, type Mall } from '../../src/api/home';
import { getProducts, type Product as ApiProduct } from '../../src/api/products';
import { MallCard } from '../../src/components/MallCard';
import { PromoCarousel, type PromoSlide } from '../../src/components/PromoCarousel';

// 카테고리는 고정 목록이 아니라, 실제 들어와 있는 몰/상품의 카테고리에서 동적으로
// 생성된다. 라벨/이모지는 알려진 카테고리만 보기 좋게 매핑하고, 모르는 카테고리는
// 원래 이름 + 기본 이모지로 노출(새 상점·상품이 들어오면 자동으로 타일 생성).
const CAT_META: Record<string, { label: string; emoji: string }> = {
  // 몰(경유쇼핑몰) 분류
  '종합쇼핑': { label: '오픈마켓', emoji: '🛒' },
  '가전·디지털': { label: '가전', emoji: '📱' },
  '여행·예약': { label: '여행', emoji: '✈️' },
  '홈·인테리어': { label: '홈라이프', emoji: '🏠' },
  '식품·생필품': { label: '식품·생필품', emoji: '🥬' },
  '보험': { label: '보험', emoji: '🛡️' },
  '도서': { label: '도서', emoji: '📚' },
  '유아동': { label: '유아동', emoji: '🧸' },
  // 상품(번개장터/ihomemarket 등) 분류
  '기획전': { label: '기획전', emoji: '🎁' },
  '건강기능식품': { label: '건강기능식품', emoji: '💊' },
  '식품': { label: '식품', emoji: '🥬' },
  '과일': { label: '과일', emoji: '🍎' },
  '주방용품': { label: '주방용품', emoji: '🍳' },
  '특산품': { label: '특산품', emoji: '🌾' },
  '전자제품': { label: '전자제품', emoji: '📺' },
  '생활용품': { label: '생활용품', emoji: '🧴' },
  '패션': { label: '패션', emoji: '👟' },
  '뷰티': { label: '뷰티', emoji: '💄' },
  '육아': { label: '육아', emoji: '🧸' },
};

function metaFor(key: string) {
  return CAT_META[key] || { label: key, emoji: '🏷️' };
}

// 경유사(platform) → 표시명. malls 목록에 없는 직접판매 채널 보강.
const CHANNEL_NAME: Record<string, string> = {
  ihomemarket: '아이홈마켓',
  coupang: '쿠팡',
  naver: '네이버쇼핑',
  '11st': '11번가',
  gmarket: 'G마켓',
  ssg: 'SSG',
  lotteon: '롯데온',
  gsshop: 'GS샵',
  auction: '옥션',
  tmon: '티몬',
  wemakeprice: '위메프',
  lightning: '번개장터',
};

// 상품 제목에서 회사/브랜드(첫 단어) 추출. 브랜드 전용 필드가 없어 제목 기반 휴리스틱.
function brandOf(title: string): string {
  if (!title) return '기타';
  // 앞쪽 [태그]·(부가)·숫자%·할인 마커 제거 후 첫 단어
  const cleaned = title.replace(/^\s*(\[[^\]]*\]|\([^)]*\)|\d+%?|무료배송|특가|신상)\s*/g, '').trim();
  const first = (cleaned || title).trim().split(/\s+/)[0] || '기타';
  return first.length > 14 ? first.slice(0, 14) : first;
}

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

function fmt(v: number | string) {
  return Number(v).toLocaleString();
}

function ProductTile({
  p,
  onPress,
  style,
}: {
  p: ApiProduct;
  onPress: () => void;
  style?: any;
}) {
  return (
    <TouchableOpacity style={[pStyles.card, style]} onPress={onPress} activeOpacity={0.85}>
      <View style={pStyles.imgBox}>
        <Image source={{ uri: p.imageUrl }} style={pStyles.img} resizeMode="cover" />
      </View>
      <Text style={pStyles.title} numberOfLines={2}>{p.title}</Text>
      <View style={pStyles.priceRow}>
        {p.discountRate ? <Text style={pStyles.discount}>{Math.round(Number(p.discountRate))}%</Text> : null}
        <Text style={pStyles.price}>{fmt(p.price)}원</Text>
      </View>
      <Text style={pStyles.cb}>캐시백 {p.cashbackRate}%</Text>
    </TouchableOpacity>
  );
}

// 그룹 헤더("[경유사] 회사") 또는 상품 한 줄. FlatList 한 데이터로 평탄화해 가상화 유지.
type GroupRow =
  | { type: 'header'; key: string; channel: string; brand: string; count: number }
  | { type: 'product'; p: ApiProduct };

// 카테고리 선택 시 — 상품을 한 줄에 하나씩 크게 보여주는 배너형 카드.
function ProductBanner({ p, onPress }: { p: ApiProduct; onPress: () => void }) {
  return (
    <TouchableOpacity style={bStyles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={bStyles.imgBox}>
        <Image source={{ uri: p.imageUrl }} style={bStyles.img} resizeMode="cover" />
        {p.discountRate ? (
          <View style={bStyles.discountBadge}>
            <Text style={bStyles.discountBadgeText}>{Math.round(Number(p.discountRate))}%</Text>
          </View>
        ) : null}
        {Number(p.cashbackRate) > 0 ? (
          <View style={bStyles.cbPill}>
            <Text style={bStyles.cbPillText}>캐시백 {p.cashbackRate}%</Text>
          </View>
        ) : null}
      </View>
      <View style={bStyles.body}>
        <Text style={bStyles.title} numberOfLines={2}>{p.title}</Text>
        <View style={bStyles.priceRow}>
          {p.discountRate ? <Text style={bStyles.discount}>{Math.round(Number(p.discountRate))}%</Text> : null}
          <Text style={bStyles.price}>{fmt(p.price)}원</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const PAGE = 8; // 무한스크롤 1회 렌더 개수

export default function CategoriesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [malls, setMalls] = useState<Mall[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE);

  // 카테고리를 바꾸면 무한스크롤 카운트 초기화
  useEffect(() => { setVisibleCount(PAGE); }, [selectedCat]);

  useEffect(() => {
    Promise.all([
      getMalls().catch(() => [] as Mall[]),
      getProducts({ limit: 1000 })
        .then((d: any) => (d?.items as ApiProduct[]) || [])
        .catch(() => [] as ApiProduct[]),
    ])
      .then(([m, p]) => {
        setMalls(m || []);
        setProducts(p || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const mallsByCat = useMemo(() => {
    const map = new Map<string, Mall[]>();
    for (const m of malls) {
      const k = m.category || '종합쇼핑';
      const arr = map.get(k) || [];
      arr.push(m);
      map.set(k, arr);
    }
    return map;
  }, [malls]);

  const productsByCat = useMemo(() => {
    const map = new Map<string, ApiProduct[]>();
    for (const p of products) {
      if (!p.category) continue;
      const arr = map.get(p.category) || [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return map;
  }, [products]);

  // 몰 ∪ 상품 카테고리 — 실제 항목이 있는 것만. 항목 수 많은 순.
  const tiles = useMemo(() => {
    const keys = new Set<string>([...mallsByCat.keys(), ...productsByCat.keys()]);
    return [...keys]
      .map((key) => {
        const meta = metaFor(key);
        const count = (mallsByCat.get(key)?.length ?? 0) + (productsByCat.get(key)?.length ?? 0);
        return { key, label: meta.label, emoji: meta.emoji, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [mallsByCat, productsByCat]);

  const selMalls = selectedCat ? mallsByCat.get(selectedCat) || [] : [];
  const selProducts = selectedCat ? productsByCat.get(selectedCat) || [] : [];
  const selectedMeta = selectedCat ? metaFor(selectedCat) : null;

  // 경유사 표시명: malls 의 실제 이름 우선, 없으면 CHANNEL_NAME, 그래도 없으면 platform 문자열
  const channelLabel = useMemo(() => {
    const m: Record<string, string> = { ...CHANNEL_NAME };
    for (const mall of malls) if (mall.platform && mall.name) m[mall.platform] = mall.name;
    return m;
  }, [malls]);
  const channelName = (platform?: string) =>
    (platform && (channelLabel[platform] || platform)) || '제휴몰';

  // 선택 카테고리 상품을 (경유사 · 회사) 로 그룹핑 → 헤더 + 상품 행을 한 줄로 평탄화(가상화 유지)
  const groupedRows = useMemo<GroupRow[]>(() => {
    if (!selectedCat) return [];
    const groups = new Map<string, ApiProduct[]>();
    const order: string[] = [];
    for (const p of selProducts) {
      const key = `${channelName(p.platform)}␟${brandOf(p.title)}`;
      if (!groups.has(key)) { groups.set(key, []); order.push(key); }
      groups.get(key)!.push(p);
    }
    order.sort((a, b) => groups.get(b)!.length - groups.get(a)!.length);
    const rows: GroupRow[] = [];
    for (const key of order) {
      const [channel, brand] = key.split('␟');
      const arr = groups.get(key)!;
      rows.push({ type: 'header', key, channel, brand, count: arr.length });
      for (const p of arr) rows.push({ type: 'product', p });
    }
    return rows;
  }, [selectedCat, selProducts, channelLabel]);

  const visibleRows = selectedCat ? groupedRows.slice(0, visibleCount) : [];

  const headerContent = (
    <>
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

      <View style={{ marginTop: 18 }}>
        <PromoCarousel slides={CAT_PROMO_SLIDES} />
      </View>

      {/* Category tile grid — 상품/몰이 들어와 있는 카테고리만 */}
      {tiles.length > 0 && (
        <>
          <Text style={styles.gridTitle}>전체 카테고리</Text>
          <View style={styles.tileGrid}>
            {tiles.map((t) => {
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
        </>
      )}

      {/* 선택 헤더 / 전체 미리보기 */}
      {loading && tiles.length === 0 ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : tiles.length === 0 ? (
        <View style={[styles.emptyCat, { marginTop: 40 }]}>
          <Ionicons name="storefront-outline" size={34} color={COLORS.ink[300]} />
          <Text style={styles.emptyCatText}>등록된 상품 카테고리가 없습니다</Text>
        </View>
      ) : selectedCat && selectedMeta ? (
        /* 선택된 카테고리 — 몰(있으면) 상단, 상품은 아래 배너 리스트(FlatList data) */
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{selectedMeta.label} {metaFor(selectedCat).emoji}</Text>
            <TouchableOpacity onPress={() => setSelectedCat(null)}>
              <Text style={styles.resetText}>전체 보기</Text>
            </TouchableOpacity>
          </View>
          {selMalls.length > 0 && (
            <View style={[styles.wrapGrid, { marginBottom: 6 }]}>
              {selMalls.map((m) => (
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
          {selProducts.length === 0 && selMalls.length === 0 ? (
            <Text style={styles.emptyCatText}>이 카테고리에 상품이 없습니다</Text>
          ) : null}
        </View>
      ) : (
        /* 전체 — 카테고리별 미리보기 */
        tiles.map((t) => {
          const ms = mallsByCat.get(t.key) || [];
          const ps = productsByCat.get(t.key) || [];
          const total = ms.length + ps.length;
          const previewMalls = ms.slice(0, 3);
          const previewProducts = ps.slice(0, Math.max(0, 3 - previewMalls.length));
          return (
            <View key={t.key} style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>{t.label} {t.emoji}</Text>
                {total > 3 ? (
                  <TouchableOpacity onPress={() => setSelectedCat(t.key)}>
                    <Text style={styles.moreText}>더보기</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <View style={styles.tileRow}>
                {previewMalls.map((m) => (
                  <MallCard
                    key={m.id}
                    mall={m}
                    variant="category"
                    onPress={() => router.push(`/mall/${m.platform}` as any)}
                  />
                ))}
                {previewProducts.map((p) => (
                  <ProductTile
                    key={p.id}
                    p={p}
                    style={styles.rowCard}
                    onPress={() => router.push(`/product/${p.id}` as any)}
                  />
                ))}
              </View>
            </View>
          );
        })
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>카테고리</Text>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="bookmark-outline" size={22} color={COLORS.ink[800]} />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.container}
        data={visibleRows}
        keyExtractor={(item) => (item.type === 'header' ? `h:${item.key}` : item.p.id)}
        renderItem={({ item }) =>
          item.type === 'header' ? (
            <View style={gStyles.groupHeader}>
              <View style={gStyles.channelPill}>
                <Text style={gStyles.channelText}>{item.channel}</Text>
              </View>
              <Text style={gStyles.brandText} numberOfLines={1}>{item.brand}</Text>
              <Text style={gStyles.groupCount}>{item.count}개</Text>
            </View>
          ) : (
            <View style={styles.bannerWrap}>
              <ProductBanner p={item.p} onPress={() => router.push(`/product/${item.p.id}` as any)} />
            </View>
          )
        }
        ListHeaderComponent={headerContent}
        ListFooterComponent={<View style={{ height: 40 }} />}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (selectedCat && visibleCount < groupedRows.length) {
            setVisibleCount((c) => c + PAGE * 2);
          }
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={PAGE}
        maxToRenderPerBatch={PAGE}
        windowSize={7}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: QM.pageBg },
  container: { flex: 1 },
  bannerWrap: { paddingHorizontal: SPACING.xl, marginTop: 14 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: QM.ink, letterSpacing: -0.3 },
  headerAction: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  featured: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xs,
    backgroundColor: QM.card,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...QM.cardShadow,
  },
  featuredIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: QM.coralSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  featuredTitle: { fontSize: 15, fontWeight: '700', color: QM.ink },
  featuredSub: { fontSize: 12, color: COLORS.ink[500], marginTop: 2 },

  gridTitle: {
    fontSize: 16, fontWeight: '800', color: QM.ink,
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
    backgroundColor: QM.card,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: QM.hairline,
    ...QM.cardShadow,
  },
  tileIconActive: { backgroundColor: QM.coralSoft, borderColor: QM.coral },
  tileEmoji: { fontSize: 25 },
  tileLabel: { fontSize: 12, color: COLORS.ink[700], fontWeight: '600' },
  tileLabelActive: { color: QM.coral, fontWeight: '800' },

  gridDivider: { height: 8, backgroundColor: QM.hairline, marginTop: 24 },

  section: { marginTop: 26, paddingHorizontal: SPACING.xl },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: QM.ink, letterSpacing: -0.3 },
  moreText: { fontSize: 13, color: QM.coral, fontWeight: '700' },
  resetText: { fontSize: 13, color: QM.coral, fontWeight: '700' },

  tileRow: { flexDirection: 'row', gap: 8 },
  rowCard: { width: '31.5%' },
  wrapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, rowGap: 14 },
  wrapCard: { flex: 0, width: '31.5%' },

  emptyCat: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyCatText: { fontSize: 13, color: COLORS.ink[500] },
});

const pStyles = StyleSheet.create({
  card: { width: '31.5%', gap: 5 },
  imgBox: {
    width: '100%', aspectRatio: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[100],
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  title: { fontSize: 12, color: COLORS.ink[800], lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  discount: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  price: { fontSize: 13, fontWeight: '800', color: COLORS.ink[900] },
  cb: { fontSize: 10, color: COLORS.primary, fontWeight: '700' },
});

// 배너형 큰 상품 카드 (한 줄에 하나)
const bStyles = StyleSheet.create({
  card: {
    backgroundColor: QM.card,
    borderRadius: 18,
    overflow: 'hidden',
    ...QM.cardShadow,
  },
  imgBox: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: COLORS.ink[100],
    position: 'relative',
  },
  img: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: QM.coral, borderRadius: 9,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  discountBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  cbPill: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 999,
    paddingHorizontal: 11, paddingVertical: 6,
  },
  cbPillText: { color: QM.coral, fontWeight: '800', fontSize: 12 },
  body: { padding: 16 },
  title: { fontSize: 15, fontWeight: '700', color: QM.ink, lineHeight: 21 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  discount: { fontSize: 18, fontWeight: '800', color: QM.coral },
  price: { fontSize: 18, fontWeight: '800', color: QM.ink },
});

// 그룹 헤더 — [경유사] 회사
const gStyles = StyleSheet.create({
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.xl,
    marginTop: 24,
    marginBottom: 2,
  },
  channelPill: {
    backgroundColor: QM.coralSoft,
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  channelText: { color: QM.coral, fontSize: 11, fontWeight: '800' },
  brandText: { fontSize: 15, fontWeight: '800', color: QM.ink, letterSpacing: -0.3, flexShrink: 1 },
  groupCount: { marginLeft: 'auto', fontSize: 12, color: '#9097A0', fontWeight: '600' },
});
