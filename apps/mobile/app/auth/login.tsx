import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { loginWithIhome } from '../../src/lib/ihome-sso';

export default function LoginScreen() {
  const router = useRouter();
  const { ihomeLogin } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleIhomeLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const identity = await loginWithIhome();
      await ihomeLogin(identity);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e?.message && e.message !== '로그인이 취소되었습니다') {
        Alert.alert('로그인 실패', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>더블윈</Text>
        <Text style={styles.subtitle}>쇼핑하면 캐시백!</Text>

        <TouchableOpacity
          style={[styles.ssoBtn, loading && styles.ssoBtnDisabled]}
          onPress={handleIhomeLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="storefront" size={20} color={COLORS.white} />
              <Text style={styles.ssoBtnText}>아이홈마켓 계정으로 로그인 / 회원가입</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.helper}>
          아이홈마켓 회원이면 그대로 로그인돼요.{'\n'}
          카카오 · 네이버 · 구글 로그인도 아이홈마켓에서 지원합니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  logo: { fontSize: 48, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  subtitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
  },
  ssoBtn: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.lg,
  },
  ssoBtnDisabled: { opacity: 0.6 },
  ssoBtnText: { fontSize: FONT.sizes.md, fontWeight: '800', color: COLORS.white },
  helper: {
    marginTop: SPACING.xl,
    fontSize: FONT.sizes.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
  },
});
