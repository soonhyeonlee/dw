import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { loginWithIhome } from '../../src/lib/ihome-sso';
import { loginWithKakaoNative, KAKAO_CANCELLED } from '../../src/lib/kakao-native';

export default function LoginScreen() {
  const router = useRouter();
  const { ihomeLogin, ihomePasswordLogin, ihomeSocialLogin } = useAuth();
  const [mbId, setMbId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  // 네이티브 ID/PW 로그인 — 아이홈마켓 웹 UI 를 거치지 않음.
  const handlePasswordLogin = async () => {
    if (loading || socialLoading) return;
    if (!mbId.trim() || !password) {
      Alert.alert('알림', '아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      await ihomePasswordLogin(mbId.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('로그인 실패', e?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카카오 — 네이티브 SDK 로그인(웹뷰 안 거침). 같은 카카오 앱이라 아이홈마켓 회원과 통합.
  const handleKakaoLogin = async () => {
    if (loading || socialLoading) return;
    setSocialLoading(true);
    try {
      const accessToken = await loginWithKakaoNative();
      await ihomeSocialLogin('kakao', accessToken);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e?.message && e.message !== KAKAO_CANCELLED) {
        Alert.alert('로그인 실패', e.message);
      }
    } finally {
      setSocialLoading(false);
    }
  };

  // 네이버·구글 — 아직 네이티브 SDK 미통합이라 아이홈마켓 웹뷰 OAuth 사용.
  const handleSocialLogin = async () => {
    if (loading || socialLoading) return;
    setSocialLoading(true);
    try {
      const identity = await loginWithIhome();
      await ihomeLogin(identity);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e?.message && e.message !== '로그인이 취소되었습니다') {
        Alert.alert('로그인 실패', e.message);
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const busy = loading || socialLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>더블윈</Text>
        <Text style={styles.subtitle}>쇼핑하면 캐시백!</Text>

        <TextInput
          style={styles.input}
          placeholder="아이디"
          placeholderTextColor={COLORS.gray[400]}
          autoCapitalize="none"
          autoCorrect={false}
          value={mbId}
          onChangeText={setMbId}
          editable={!busy}
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          placeholderTextColor={COLORS.gray[400]}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
          editable={!busy}
          returnKeyType="done"
          onSubmitEditing={handlePasswordLogin}
        />

        <TouchableOpacity
          style={[styles.loginBtn, busy && styles.btnDisabled]}
          onPress={handlePasswordLogin}
          disabled={busy}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.loginBtnText}>로그인</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helper}>아이홈마켓 계정으로 로그인됩니다.</Text>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>소셜 계정으로 로그인</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={[styles.kakaoBtn, busy && styles.btnDisabled]}
          onPress={handleKakaoLogin}
          disabled={busy}
          activeOpacity={0.85}
        >
          {socialLoading ? (
            <ActivityIndicator color="#3C1E1E" />
          ) : (
            <>
              <Ionicons name="chatbubble" size={18} color="#3C1E1E" />
              <Text style={styles.kakaoBtnText}>카카오로 로그인</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.socialBtn, busy && styles.btnDisabled]}
          onPress={handleSocialLogin}
          disabled={busy}
          activeOpacity={0.85}
        >
          {socialLoading ? (
            <ActivityIndicator color={COLORS.gray[700]} />
          ) : (
            <Text style={styles.socialBtnText}>네이버 · 구글로 로그인</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxxl,
  },
  logo: { fontSize: 48, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  subtitle: {
    fontSize: FONT.sizes.md,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: SPACING.xxxl,
  },
  input: {
    height: 56,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT.sizes.md,
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
  },
  loginBtn: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  loginBtnText: { fontSize: FONT.sizes.md, fontWeight: '800', color: COLORS.white },
  btnDisabled: { opacity: 0.6 },
  helper: {
    marginTop: SPACING.lg,
    fontSize: FONT.sizes.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  line: { flex: 1, height: 1, backgroundColor: COLORS.gray[200] },
  dividerText: { fontSize: FONT.sizes.sm, color: COLORS.gray[400] },
  kakaoBtn: {
    height: 52,
    backgroundColor: '#FEE500', // 카카오 브랜드 컬러
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  kakaoBtnText: { fontSize: FONT.sizes.md, fontWeight: '800', color: '#3C1E1E' },
  socialBtn: {
    height: 52,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  socialBtnText: { fontSize: FONT.sizes.md, fontWeight: '700', color: COLORS.gray[700] },
});
