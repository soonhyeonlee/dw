import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';

export default function ActivateCashbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mall?: string; rate?: string; url?: string }>();
  const mall = params.mall || '쇼핑몰';
  const rate = params.rate ? `${params.rate}%` : '';
  const url = params.url || '';

  const spin = useRef(new Animated.Value(0)).current;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [spin]);

  useEffect(() => {
    if (!url) {
      setError('이동할 URL이 없습니다.');
      return;
    }
    const t = setTimeout(async () => {
      try {
        await WebBrowser.openBrowserAsync(url);
        // 외부 브라우저 닫고 돌아오면 자동 뒤로
        router.back();
      } catch {
        setError('외부 브라우저를 열 수 없습니다.');
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [url, router]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, presentation: 'modal' }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={COLORS.ink[800]} />
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.logoBox, { transform: [{ rotate }] }]}>
          <View style={styles.logoInner}>
            <Ionicons name="flash" size={36} color={COLORS.primary} />
          </View>
        </Animated.View>

        <Text style={styles.title}>캐시백 활성화 중</Text>
        <Text style={styles.subtitle}>
          {mall}{rate ? ` ${rate}` : ''} 캐시백을 적용하고 있어요
        </Text>

        {error ? (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
              <Text style={styles.retryText}>돌아가기</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.guideBox}>
          <View style={styles.guideRow}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.guideText}>잠시 후 쇼핑몰로 자동 이동합니다</Text>
          </View>
          <View style={styles.guideRow}>
            <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
            <Text style={styles.guideText}>이 화면을 닫지 마세요</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { height: 56, flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: SPACING.md },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },

  logoBox: {
    width: 120, height: 120, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 36,
  },
  logoInner: {
    width: 88, height: 88, borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.ink[600], marginTop: 8, textAlign: 'center' },

  errBox: {
    marginTop: 24, padding: 16,
    borderRadius: RADIUS.md, backgroundColor: '#FFE3E2',
    width: '100%', alignItems: 'center', gap: 12,
  },
  errText: { fontSize: 13, color: COLORS.error, fontWeight: '600' },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.white, borderRadius: RADIUS.sm },
  retryText: { fontSize: 13, fontWeight: '700', color: COLORS.ink[800] },

  guideBox: {
    marginTop: 48,
    width: '100%',
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.md,
    padding: 16,
    gap: 10,
  },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guideText: { fontSize: 13, color: COLORS.ink[700] },
});
