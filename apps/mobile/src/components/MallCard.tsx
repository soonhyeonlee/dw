import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ViewStyle } from 'react-native';
import { COLORS, RADIUS } from '../constants/theme';
import type { Mall } from '../api/home';
import { mallLogoSource } from '../lib/mallLogo';

export type MallCardVariant = 'home' | 'category' | 'search';

const WORDMARK_OVERRIDE: Record<string, string> = {
  coupang: 'C',
  naver: 'N',
  '11st': '11',
  gmarket: 'G',
  ssg: 'SSG',
  lotteon: 'L',
  wemakeprice: '위메프',
  tmon: '티몬',
};

const PROMO_BADGE: Record<string, { text: string; bg: string; fg: string }> = {
  time_deal: { text: '타임특가', bg: '#E0311E', fg: '#FFFFFF' },
  rate_up: { text: '상향', bg: '#EEEEFF', fg: '#4B4BF4' },
  welcome: { text: '웰컴', bg: '#FFE6DC', fg: '#FF6B35' },
};

function formatCountdown(endsAt?: string | null): string | null {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}시간 후 종료`;
  return `${Math.floor(hours / 24)}일 후 종료`;
}

interface Props {
  mall: Mall;
  variant?: MallCardVariant;
  onPress: () => void;
  style?: ViewStyle;
}

export function MallCard({ mall, variant = 'home', onPress, style }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const logoSource = mallLogoSource(mall);
  const useImage = !!logoSource && !imgFailed;
  const wordmark = WORDMARK_OVERRIDE[mall.platform] ?? mall.name.slice(0, 1);
  const badge = mall.promoBadge ? PROMO_BADGE[mall.promoBadge] : null;
  const countdown = formatCountdown(mall.promoEndsAt);
  const prevRate = mall.previousCashbackRate != null ? Number(mall.previousCashbackRate) : null;

  if (variant === 'category') {
    return (
      <TouchableOpacity style={[catStyles.card, style]} onPress={onPress} activeOpacity={0.85}>
        <View style={catStyles.logoWrap}>
          <View style={[catStyles.logoBox, !useImage && { backgroundColor: mall.color || COLORS.ink[600] }]}>
            {useImage ? (
              <Image source={logoSource} style={catStyles.logoImg} resizeMode="contain" onError={() => setImgFailed(true)} />
            ) : (
              <Text style={catStyles.logoFallback}>{wordmark}</Text>
            )}
          </View>
          {badge ? (
            <View style={[catStyles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[catStyles.badgeText, { color: badge.fg }]}>{badge.text}</Text>
            </View>
          ) : null}
        </View>
        <Text style={catStyles.name} numberOfLines={1}>{mall.name}</Text>
        <View style={catStyles.rateRow}>
          <Text style={catStyles.rate}>최대 {Number(mall.cashbackRate)}%</Text>
          {prevRate != null ? <Text style={catStyles.prevRate}>{prevRate}%</Text> : null}
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'search') {
    return (
      <TouchableOpacity style={[searchStyles.card, style]} onPress={onPress} activeOpacity={0.85}>
        <View style={[searchStyles.logoBox, !useImage && { backgroundColor: mall.color || COLORS.ink[600] }]}>
          {useImage ? (
            <Image source={logoSource} style={searchStyles.logoImg} resizeMode="contain" onError={() => setImgFailed(true)} />
          ) : (
            <Text style={searchStyles.logoFallback}>{wordmark}</Text>
          )}
        </View>
        <Text style={searchStyles.name} numberOfLines={1}>{mall.name}</Text>
        <Text style={searchStyles.rate}>최대 {Number(mall.cashbackRate)}%</Text>
      </TouchableOpacity>
    );
  }

  // variant === 'home'  — ShopBack 4-col mall card
  return (
    <TouchableOpacity style={[homeStyles.item, style]} onPress={onPress} activeOpacity={0.8}>
      <View style={homeStyles.logoWrap}>
        <View style={[homeStyles.logoBox, !useImage && { backgroundColor: mall.color || COLORS.ink[600], borderColor: mall.color || COLORS.ink[600] }]}>
          {useImage ? (
            <Image source={logoSource} style={homeStyles.logoImg} resizeMode="contain" onError={() => setImgFailed(true)} />
          ) : (
            <Text style={homeStyles.logoFallback}>{wordmark}</Text>
          )}
        </View>
        {badge ? (
          <View style={[homeStyles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[homeStyles.badgeText, { color: badge.fg }]}>{badge.text}</Text>
          </View>
        ) : null}
      </View>
      <Text style={homeStyles.name} numberOfLines={1}>{mall.name}</Text>
      <Text style={homeStyles.rate}>최대 {Number(mall.cashbackRate)}%</Text>
      {prevRate != null ? <Text style={homeStyles.prevRate}>{prevRate}%</Text> : null}
      {countdown ? <Text style={homeStyles.countdown}>{countdown}</Text> : null}
    </TouchableOpacity>
  );
}

const homeStyles = StyleSheet.create({
  item: { width: '25%', alignItems: 'center', paddingHorizontal: 5 },
  logoWrap: { width: '100%', position: 'relative' },
  logoBox: {
    width: '100%', aspectRatio: 1, borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.ink[100],
    alignItems: 'center', justifyContent: 'center',
    padding: 12,
  },
  logoImg: { width: '100%', height: '100%' },
  logoFallback: { fontSize: 22, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  badge: {
    position: 'absolute',
    top: -5, left: -3,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 9, fontWeight: '800' },
  name: { fontSize: 11, fontWeight: '600', color: COLORS.ink[700], marginTop: 6, textAlign: 'center' },
  rate: { fontSize: 12.5, fontWeight: '800', color: COLORS.ink[900], marginTop: 2 },
  prevRate: { fontSize: 10, color: COLORS.ink[400], textDecorationLine: 'line-through', marginTop: 1 },
  countdown: { fontSize: 9, color: COLORS.error, fontWeight: '700', marginTop: 2 },
});

const catStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  logoWrap: { position: 'relative' },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  logoImg: { width: 44, height: 44 },
  logoFallback: { fontSize: 18, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  badge: {
    position: 'absolute',
    top: -4, left: -4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
  name: { fontSize: 12, fontWeight: '600', color: COLORS.ink[800], textAlign: 'center', marginTop: 2 },
  rateRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  rate: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  prevRate: { fontSize: 9, color: COLORS.ink[400], textDecorationLine: 'line-through' },
});

const searchStyles = StyleSheet.create({
  card: { width: 76, alignItems: 'center', gap: 6 },
  logoBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.ink[200],
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  logoImg: { width: 38, height: 38 },
  logoFallback: { fontSize: 16, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  name: { fontSize: 11, fontWeight: '500', color: COLORS.ink[800] },
  rate: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
});
