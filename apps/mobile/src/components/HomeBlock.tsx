import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import type { HomeBlock as HomeBlockType, Mall } from '../api/home';
import MallGrid from './MallGrid';

interface Props {
  block: HomeBlockType;
  malls: Mall[];
  onPressMall: (mall: Mall) => void;
  onPressProduct: (id: string) => void;
  onPressMore?: (block: HomeBlockType) => void;
}

const MALL_LABEL: Record<string, string> = {
  coupang: '쿠팡',
  naver: '네이버',
  '11st': '11번가',
  gmarket: 'G마켓',
  ssg: 'SSG',
  auction: '옥션',
  wemakeprice: '위메프',
  tmon: '티몬',
};

function SectionHeader({
  title,
  subtitle,
  right,
  onPressMore,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPressMore?: () => void;
}) {
  return (
    <View style={styles.sectionHead}>
      <View style={styles.sectionTitleGroup}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
      </View>
      {right ??
        (onPressMore && (
          <TouchableOpacity style={styles.moreBtn} onPress={onPressMore}>
            <Text style={styles.moreText}>전체</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.ink[500]} />
          </TouchableOpacity>
        ))}
    </View>
  );
}

export default function HomeBlockComponent({
  block,
  malls,
  onPressMall,
  onPressProduct,
  onPressMore,
}: Props) {
  if (block.blockType === 'mall_grid') {
    return (
      <View style={styles.section}>
        <SectionHeader
          title={block.title}
          subtitle={block.subtitle || '경유하면 캐시백'}
          onPressMore={() => onPressMore?.(block)}
        />
        <View style={styles.mallGridWrap}>
          <MallGrid
            malls={malls}
            maxItems={block.config?.maxItems || 8}
            onPressMall={onPressMall}
            onPressMore={() => onPressMore?.(block)}
          />
        </View>
      </View>
    );
  }

  if (block.blockType === 'topic_products') {
    return (
      <>
        <View style={styles.divider} />
        <View style={styles.section}>
          <SectionHeader
            title={block.title}
            right={
              block.config?.timer ? (
                <Text style={styles.timer}>{block.config.timer}</Text>
              ) : undefined
            }
            onPressMore={
              block.config?.timer ? undefined : () => onPressMore?.(block)
            }
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dealScroll}
          >
            {(block.products || []).map((product: any) => (
              <TouchableOpacity
                key={product.id}
                style={styles.dealCard}
                onPress={() => onPressProduct(product.id)}
                activeOpacity={0.8}
              >
                <View style={styles.dealImage}>
                  {product.imageUrl && (
                    <Image
                      source={{ uri: product.imageUrl }}
                      style={styles.imgFill}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.mallBadge}>
                    <Text style={styles.mallBadgeText}>
                      {MALL_LABEL[product.platform] || product.platform}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.likeBtn}>
                    <Ionicons name="heart-outline" size={16} color={COLORS.ink[700]} />
                  </TouchableOpacity>
                </View>
                <View style={styles.priceRow}>
                  {product.discountRate ? (
                    <Text style={styles.discount}>{product.discountRate}%</Text>
                  ) : null}
                  <Text style={styles.price}>
                    {Number(product.price).toLocaleString()}원
                  </Text>
                </View>
                <Text style={styles.productName} numberOfLines={2}>
                  {product.title}
                </Text>
                <View style={styles.cbRow}>
                  <Ionicons name="ellipse" size={6} color={COLORS.primary} />
                  <Text style={styles.cbText}>
                    캐시백 {Math.round((Number(product.price) * Number(product.cashbackRate || 0)) / 100).toLocaleString()}원
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </>
    );
  }

  if (block.blockType === 'mall_products') {
    return (
      <View style={styles.section}>
        <SectionHeader
          title={block.title}
          onPressMore={() => onPressMore?.(block)}
        />
        <View style={styles.recGrid}>
          {(block.products || []).slice(0, 4).map((product: any) => (
            <TouchableOpacity
              key={product.id}
              style={styles.recCard}
              onPress={() => onPressProduct(product.id)}
              activeOpacity={0.8}
            >
              <View style={styles.recImage}>
                {product.imageUrl && (
                  <Image
                    source={{ uri: product.imageUrl }}
                    style={styles.imgFill}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.mallBadge}>
                  <Text style={styles.mallBadgeText}>
                    {MALL_LABEL[product.platform] || product.platform}
                  </Text>
                </View>
                <TouchableOpacity style={styles.likeBtn}>
                  <Ionicons name="heart-outline" size={16} color={COLORS.ink[700]} />
                </TouchableOpacity>
              </View>
              <Text style={styles.productName} numberOfLines={2}>
                {product.title}
              </Text>
              <View style={styles.priceRow}>
                {product.discountRate ? (
                  <Text style={styles.discount}>{product.discountRate}%</Text>
                ) : null}
                <Text style={styles.price}>
                  {Number(product.price).toLocaleString()}원
                </Text>
              </View>
              <Text style={styles.cbText}>
                캐시백 {Math.round((Number(product.price) * Number(product.cashbackRate || 0)) / 100).toLocaleString()}원
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  if (block.blockType === 'banner') {
    return (
      <TouchableOpacity
        style={styles.promo}
        onPress={() => onPressMore?.(block)}
        activeOpacity={0.9}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.promoBadge}>
            <Text style={styles.promoBadgeText}>
              {block.config?.badge || '신규 혜택'}
            </Text>
          </View>
          <Text style={styles.promoTitle}>{block.title}</Text>
          {block.subtitle && <Text style={styles.promoSub}>{block.subtitle}</Text>}
        </View>
        <View style={styles.promoArt}>
          <Ionicons name="gift-outline" size={36} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  section: { marginTop: 8 },
  divider: { height: 8, backgroundColor: COLORS.ink[50], marginTop: 20 },

  sectionHead: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitleGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink[900],
    letterSpacing: -0.3,
  },
  sectionSub: { fontSize: 12, color: COLORS.ink[500], fontWeight: '500' },
  moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  moreText: { fontSize: 12, color: COLORS.ink[500] },
  timer: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },

  mallGridWrap: { paddingHorizontal: 14 },

  // Promo banner
  promo: {
    marginHorizontal: SPACING.xl,
    marginTop: 16,
    backgroundColor: '#FAF6F0',
    borderRadius: RADIUS.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  promoBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  promoTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink[900], marginBottom: 4 },
  promoSub: { fontSize: 12, color: COLORS.ink[600] },
  promoArt: {
    width: 88,
    height: 88,
    borderRadius: 18,
    backgroundColor: '#FFE5D6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Deal horizontal
  dealScroll: { paddingHorizontal: SPACING.xl, gap: 12 },
  dealCard: { width: 160, gap: 8 },
  dealImage: {
    width: 160,
    height: 160,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[100],
    overflow: 'hidden',
    position: 'relative',
  },

  // Recommended 2-col grid
  recGrid: {
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recCard: { width: '48%', gap: 6 },
  recImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[100],
    overflow: 'hidden',
    position: 'relative',
  },

  imgFill: { width: '100%', height: '100%' },
  mallBadge: {
    position: 'absolute',
    top: 8, left: 8,
    backgroundColor: 'rgba(17,24,39,0.82)',
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 6,
  },
  mallBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },
  likeBtn: {
    position: 'absolute',
    top: 6, right: 6,
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  discount: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  price: { fontSize: 15, fontWeight: '800', color: COLORS.ink[900] },
  productName: {
    fontSize: 12,
    color: COLORS.ink[700],
    lineHeight: 16,
  },
  cbRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cbText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
});
