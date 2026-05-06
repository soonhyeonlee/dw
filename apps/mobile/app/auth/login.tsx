import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { loginWithKakao, loginWithNaver, loginWithGoogle } from '../../src/lib/social-auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login, socialLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('로그인 실패', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>더블윈</Text>
        <Text style={styles.subtitle}>쇼핑하면 캐시백!</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            placeholderTextColor={COLORS.gray[400]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            placeholderTextColor={COLORS.gray[400]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginBtnText}>
              {loading ? '로그인 중...' : '로그인'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => {
              Alert.prompt
                ? Alert.prompt(
                    '비밀번호 재설정',
                    '가입한 이메일을 입력하세요',
                    [
                      { text: '취소', style: 'cancel' },
                      {
                        text: '전송',
                        onPress: async (inputEmail?: string) => {
                          if (!inputEmail) return;
                          try {
                            const { resetPassword } = require('../../src/api/auth-extra');
                            await resetPassword(inputEmail);
                            Alert.alert('완료', '임시 비밀번호가 이메일로 발송되었습니다');
                          } catch (e: any) {
                            Alert.alert('오류', e.message);
                          }
                        },
                      },
                    ],
                    'plain-text',
                    email,
                  )
                : Alert.alert('비밀번호 재설정', '이메일을 입력 후 로그인 화면에서 재설정해주세요');
            }}
          >
            <Text style={styles.forgotText}>비밀번호를 잊으셨나요?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: '#FEE500' }]}
            onPress={async () => {
              try {
                setLoading(true);
                const profile = await loginWithKakao();
                await socialLogin(profile);
                router.replace('/(tabs)');
              } catch (e: any) {
                Alert.alert('카카오 로그인 실패', e.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={styles.socialBtnText}>카카오</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: '#03C75A' }]}
            onPress={async () => {
              try {
                setLoading(true);
                const profile = await loginWithNaver();
                await socialLogin(profile);
                router.replace('/(tabs)');
              } catch (e: any) {
                Alert.alert('네이버 로그인 실패', e.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={[styles.socialBtnText, { color: COLORS.white }]}>네이버</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: COLORS.gray[100] }]}
            onPress={async () => {
              try {
                setLoading(true);
                const profile = await loginWithGoogle();
                await socialLogin(profile);
                router.replace('/(tabs)');
              } catch (e: any) {
                Alert.alert('구글 로그인 실패', e.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text style={styles.socialBtnText}>Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push('/auth/register')}
        >
          <Text style={styles.registerText}>
            아직 회원이 아니신가요?{' '}
            <Text style={styles.registerTextBold}>회원가입</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.xxl },
  logo: { fontSize: 48, fontWeight: '900', color: COLORS.primary, textAlign: 'center' },
  subtitle: { fontSize: FONT.sizes.md, color: COLORS.gray[500], textAlign: 'center', marginBottom: SPACING.xxxl },
  form: { gap: SPACING.md },
  input: { height: 52, backgroundColor: COLORS.gray[100], borderRadius: RADIUS.lg, paddingHorizontal: SPACING.lg, fontSize: FONT.sizes.md, color: COLORS.gray[900] },
  loginBtn: { height: 52, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.sm },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: FONT.sizes.lg, fontWeight: '700', color: COLORS.white },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.xxl, gap: SPACING.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.gray[200] },
  dividerText: { fontSize: FONT.sizes.sm, color: COLORS.gray[400] },
  socialRow: { flexDirection: 'row', gap: SPACING.md },
  socialBtn: { flex: 1, height: 48, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center' },
  socialBtnText: { fontSize: FONT.sizes.sm, fontWeight: '700', color: COLORS.gray[800] },
  registerLink: { marginTop: SPACING.xxl, alignItems: 'center' },
  registerText: { fontSize: FONT.sizes.sm, color: COLORS.gray[500] },
  registerTextBold: { fontWeight: '700', color: COLORS.primary },
  forgotBtn: { alignItems: 'center', marginTop: SPACING.sm },
  forgotText: { fontSize: FONT.sizes.sm, color: COLORS.gray[500] },
});
