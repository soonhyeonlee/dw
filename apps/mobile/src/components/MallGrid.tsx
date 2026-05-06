import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import type { Mall } from '../api/home';

interface Props {
  malls: Mall[];
  maxItems?: number;
  onPressMall: (mall: Mall) => void;
  onPressMore?: () => void;
}

const MALL_LABEL: Record<string, string> = {
  coupang: '쿠팡',
  naver: 'NAVER',
  '11st': '11번가',
  gmarket: 'Gmarket',
  ssg: 'SSG',
  auction: 'Auction',
  wemakeprice: '위메프',
  tmon: '티몬',
  lotteon: 'LOTTE',
};

export default function MallGrid({ malls, maxItems = 8, onPressMall, onPressMore }: Props) {
  const hasMore = malls.length > maxItems;
  const display = hasMore ? malls.slice(0, maxItems - 1) : malls.slice(0, maxItems);

  return (
    <View style={styles.grid}>
      {display.map((mall) => (
        <TouchableOpacity
          key={mall.id}
          style={styles.item}
          onPress={() => onPressMall(mall)}
          activeOpacity={0.7}
        >
          <View style={styles.logoBox}>
            <Text style={styles.logoText} numberOfLines={1}>
              {MALL_LABEL[mall.platform] || mall.name}
            </Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{mall.name}</Text>
          <View style={styles.rateBadge}>
            <Text style={styles.rateText}>최대 {mall.cashbackRate}%</Text>
          </View>
        </TouchableOpacity>
      ))}

      {hasMore && (
        <TouchableOpacity style={styles.item} onPress={onPressMore} activeOpacity={0.7}>
          <View style={[styles.logoBox, styles.logoBoxMore]}>
            <Text style={styles.logoMoreText}>전체</Text>
          </View>
          <Text style={styles.name}>더보기</Text>
          <View style={{ height: 16 }} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  item: {
    width: '25%',
    alignItems: 'center',
    gap: 6,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.ink[200],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  logoBoxMore: {
    backgroundColor: COLORS.ink[100],
    borderColor: COLORS.ink[100],
  },
  logoText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.ink[800],
    letterSpacing: -0.2,
  },
  logoMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink[600],
  },
  name: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.ink[800],
  },
  rateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.primarySoft,
  },
  rateText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
