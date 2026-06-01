import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import {
  MarketContent,
  type MarketContentHandle,
} from '../../src/components/home/MarketContent';
import { useAuth } from '../../src/contexts/AuthContext';

function formatPoint(v: number) {
  return Math.floor(v).toLocaleString();
}

export default function MarketScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const marketRef = useRef<MarketContentHandle>(null);
  const marketPoint = isAuthenticated ? Number(user?.marketPointBalance || 0) : 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await marketRef.current?.reload();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.title}>번개장터</Text>
            <Text style={styles.subtitle}>더블윈 산지직송 위탁판매</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/search')}>
            <Ionicons name="search-outline" size={24} color={COLORS.ink[800]} />
          </TouchableOpacity>
        </View>

        {/* 번개장터 전용 포인트 — 구매로 적립, 번개장터에서만 사용(현금화 불가) */}
        {isAuthenticated && (
          <View style={styles.pointCard}>
            <View style={styles.pointIcon}>
              <Ionicons name="flash" size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pointLabel}>번개장터 포인트</Text>
              <Text style={styles.pointSub}>구매하면 적립 · 번개장터에서만 사용</Text>
            </View>
            <Text style={styles.pointValue}>{formatPoint(marketPoint)}P</Text>
          </View>
        )}

        <MarketContent ref={marketRef} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.ink[500], marginTop: 2, fontWeight: '500' },
  iconBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: SPACING.xl,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.lg,
  },
  pointIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  pointLabel: { fontSize: 14, fontWeight: '800', color: COLORS.ink[900] },
  pointSub: { fontSize: 11, color: COLORS.ink[600], marginTop: 1 },
  pointValue: { fontSize: 20, fontWeight: '900', color: COLORS.primary, letterSpacing: -0.3 },
});
