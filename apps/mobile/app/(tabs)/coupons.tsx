import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../src/constants/theme';

// 쿠폰 탭 — 스펙 "대기" 상태. 스펙 확정 시 본 화면 구현.
export default function CouponsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>쿠폰</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Ionicons name="ticket-outline" size={40} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>쿠폰함 준비 중</Text>
        <Text style={styles.sub}>
          다운로드한 쿠폰을 한곳에서 관리할 수 있는{'\n'}쿠폰함을 준비하고 있어요.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.ink[900] },
  sub: { fontSize: 13, color: COLORS.ink[500], textAlign: 'center', lineHeight: 20 },
});
