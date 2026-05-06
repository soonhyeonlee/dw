import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { COLORS, FONT, SPACING, RADIUS } from '../constants/theme';

const CARD_WIDTH = (Dimensions.get('window').width - SPACING.lg * 3) / 2;

interface Props {
  id: string;
  platform: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  cashbackRate: number;
  cashbackAmount: number;
  onPress: (id: string) => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  coupang: COLORS.coupang,
  naver: COLORS.naver,
  '11st': COLORS.eleventh,
};

const PLATFORM_NAMES: Record<string, string> = {
  coupang: '쿠팡',
  naver: '네이버',
  '11st': '11번가',
};

export default function ProductCard({
  id,
  platform,
  title,
  price,
  originalPrice,
  imageUrl,
  cashbackRate,
  cashbackAmount,
  onPress,
}: Props) {
  const discountRate =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(id)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <View
          style={[
            styles.platformBadge,
            { backgroundColor: PLATFORM_COLORS[platform] || COLORS.gray[600] },
          ]}
        >
          <Text style={styles.platformText}>
            {PLATFORM_NAMES[platform] || platform}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.priceRow}>
          {discountRate > 0 && (
            <Text style={styles.discount}>{discountRate}%</Text>
          )}
          <Text style={styles.price}>
            {price.toLocaleString()}원
          </Text>
        </View>

        {originalPrice && originalPrice > price && (
          <Text style={styles.originalPrice}>
            {originalPrice.toLocaleString()}원
          </Text>
        )}

        <View style={styles.cashbackBadge}>
          <Text style={styles.cashbackText}>
            캐시백 {cashbackAmount.toLocaleString()}원 ({cashbackRate}%)
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: COLORS.gray[100],
  },
  platformBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  platformText: {
    color: COLORS.white,
    fontSize: FONT.sizes.xs,
    fontWeight: '700',
  },
  info: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT.sizes.sm,
    color: COLORS.gray[800],
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  discount: {
    fontSize: FONT.sizes.md,
    fontWeight: '800',
    color: COLORS.error,
  },
  price: {
    fontSize: FONT.sizes.md,
    fontWeight: '700',
    color: COLORS.black,
  },
  originalPrice: {
    fontSize: FONT.sizes.xs,
    color: COLORS.gray[500],
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  cashbackBadge: {
    marginTop: SPACING.sm,
    backgroundColor: '#FFF3ED',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  cashbackText: {
    fontSize: FONT.sizes.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
