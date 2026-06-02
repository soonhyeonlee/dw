import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { getMyCoupons, useCoupon as useCouponApi, type MyCoupon } from '../../src/api/region';

function formatValue(couponType: string, value: string): string {
  const v = String(value ?? '').trim();
  if (!v) return '';
  if (couponType === 'percent' || couponType === 'rate') return `${v}% 할인`;
  if (couponType === 'amount' || couponType === 'fixed' || couponType === 'price')
    return `${Number(v).toLocaleString()}원 할인`;
  return v;
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function CouponsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [coupons, setCoupons] = useState<MyCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setCoupons([]);
      setLoading(false);
      return;
    }
    try {
      const data = await getMyCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  // 탭 진입할 때마다 갱신(다른 화면에서 쿠폰 받은 직후 반영).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleUse = (uc: MyCoupon) => {
    Alert.alert('쿠폰 사용', `'${uc.coupon?.title}' 쿠폰을 사용 처리할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '사용하기',
        onPress: async () => {
          try {
            await useCouponApi(uc.id);
            setCoupons((prev) =>
              prev.map((c) => (c.id === uc.id ? { ...c, isUsed: true } : c)),
            );
          } catch (e: any) {
            Alert.alert('사용 실패', e?.message || '쿠폰 사용에 실패했습니다');
          }
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>쿠폰함</Text>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {renderHeader()}
        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <Ionicons name="ticket-outline" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>로그인이 필요해요</Text>
          <Text style={styles.emptySub}>로그인하고 다운로드한 쿠폰을 확인하세요.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => router.push('/auth/login')}>
            <Text style={styles.ctaText}>로그인</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {renderHeader()}
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {renderHeader()}
      <FlatList
        data={coupons}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        renderItem={({ item }) => {
          const c = item.coupon;
          const expired = c?.expireAt ? new Date(c.expireAt).getTime() < Date.now() : false;
          const disabled = item.isUsed || expired;
          return (
            <View style={[styles.card, disabled && styles.cardDisabled]}>
              <View style={styles.cardLeft}>
                <Ionicons name="ticket" size={22} color={disabled ? COLORS.ink[400] : COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.value}>{formatValue(c?.couponType, c?.value)}</Text>
                <Text style={styles.title} numberOfLines={1}>{c?.title}</Text>
                {c?.partnerName ? <Text style={styles.partner}>{c.partnerName}</Text> : null}
                <Text style={styles.expire}>~{formatDate(c?.expireAt)}까지</Text>
              </View>
              {item.isUsed ? (
                <View style={styles.badgeUsed}><Text style={styles.badgeUsedText}>사용완료</Text></View>
              ) : expired ? (
                <View style={styles.badgeUsed}><Text style={styles.badgeUsedText}>기간만료</Text></View>
              ) : (
                <TouchableOpacity style={styles.useBtn} onPress={() => handleUse(item)}>
                  <Text style={styles.useBtnText}>사용하기</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <View style={styles.iconWrap}>
              <Ionicons name="ticket-outline" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>받은 쿠폰이 없어요</Text>
            <Text style={styles.emptySub}>우리지역에서 쿠폰을 받아보세요.</Text>
            <TouchableOpacity style={styles.cta} onPress={() => router.push('/')}>
              <Text style={styles.ctaText}>쿠폰 받으러 가기</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { height: 56, justifyContent: 'center', paddingHorizontal: SPACING.xl },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },

  list: { padding: SPACING.lg, gap: SPACING.md, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.ink[100],
    padding: SPACING.lg,
  },
  cardDisabled: { opacity: 0.55 },
  cardLeft: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  value: { fontSize: FONT.sizes.lg, fontWeight: '900', color: COLORS.primary },
  title: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.ink[900], marginTop: 2 },
  partner: { fontSize: FONT.sizes.xs, color: COLORS.ink[500], marginTop: 2 },
  expire: { fontSize: FONT.sizes.xs, color: COLORS.ink[400], marginTop: 4 },

  useBtn: {
    paddingHorizontal: SPACING.lg, height: 38, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  useBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT.sizes.sm },
  badgeUsed: {
    paddingHorizontal: SPACING.md, height: 38, borderRadius: RADIUS.sm,
    backgroundColor: COLORS.ink[100], alignItems: 'center', justifyContent: 'center',
  },
  badgeUsedText: { color: COLORS.ink[500], fontWeight: '700', fontSize: FONT.sizes.sm },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.ink[900] },
  emptySub: { fontSize: 13, color: COLORS.ink[500], textAlign: 'center', lineHeight: 20 },
  cta: {
    marginTop: SPACING.md, paddingHorizontal: SPACING.xxl, height: 46,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { color: COLORS.white, fontWeight: '800', fontSize: FONT.sizes.md },
});
