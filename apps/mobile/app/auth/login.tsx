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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { loginWithKakaoNative, KAKAO_CANCELLED } from '../../src/lib/kakao-native';
import { loginWithNaverNative, NAVER_CANCELLED } from '../../src/lib/naver-native';
import { loginWithGoogleNative, GOOGLE_CANCELLED } from '../../src/lib/google-native';

// Scheme 03 (Quiet Mono) 디자인 토큰 — 정제된 코랄 + 라이트 뉴트럴.
const CORAL = '#F0410E';
const CORAL_GRAD = ['#FB572F', '#F0410E'] as const;
const INK = '#14161A';
const SUBTLE = '#8B9097';
const FIELD_BG = '#F5F6F8';
const HAIRLINE = '#E9EBEE';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ihomePasswordLogin, ihomeSocialLogin } = useAuth();
  const [mbId, setMbId] = useState('');
  const [password, setPassword] = useState('');
  const [focus, setFocus] = useState<'id' | 'pw' | null>(null);
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

  // 소셜 네이티브 로그인 공용 핸들러 — SDK 로 토큰을 받아 같은 OAuth 앱/계정으로
  // 아이홈마켓 회원과 통합한다(웹뷰 안 거침). 취소는 조용히 무시.
  const runSocial = async (
    getToken: () => Promise<string>,
    provider: 'kakao' | 'naver' | 'google',
    cancelledMsg: string,
  ) => {
    if (loading || socialLoading) return;
    setSocialLoading(true);
    try {
      const token = await getToken();
      await ihomeSocialLogin(provider, token);
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e?.message && e.message !== cancelledMsg) {
        Alert.alert('로그인 실패', e.message);
      }
    } finally {
      setSocialLoading(false);
    }
  };

  const handleKakaoLogin = () => runSocial(loginWithKakaoNative, 'kakao', KAKAO_CANCELLED);
  const handleNaverLogin = () => runSocial(loginWithNaverNative, 'naver', NAVER_CANCELLED);
  const handleGoogleLogin = () => runSocial(loginWithGoogleNative, 'google', GOOGLE_CANCELLED);

  const busy = loading || socialLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 28 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 브랜드 락업 */}
        <View style={styles.brand}>
          <LinearGradient colors={CORAL_GRAD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.mark}>
            <Text style={styles.markText}>W</Text>
          </LinearGradient>
          <Text style={styles.wordmark}>더블원플러스</Text>
        </View>

        {/* 헤드라인 */}
        <Text style={styles.headline}>
          간편하게 로그인하고{'\n'}
          <Text style={{ color: CORAL }}>캐시백</Text>을 받아보세요
        </Text>
        <Text style={styles.headSub}>더블원플러스 하나로 간편하게 시작해요</Text>

        {/* 입력 */}
        <View style={styles.fields}>
          <View style={[styles.field, focus === 'id' && styles.fieldFocus]}>
            <Ionicons name="person-outline" size={19} color={focus === 'id' ? CORAL : '#AAB0B7'} />
            <View style={styles.fieldBody}>
              <Text style={[styles.fieldLabel, focus === 'id' && { color: CORAL }]}>아이디</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="아이디를 입력하세요"
                placeholderTextColor="#B7BCC3"
                autoCapitalize="none"
                autoCorrect={false}
                value={mbId}
                onChangeText={setMbId}
                onFocus={() => setFocus('id')}
                onBlur={() => setFocus(null)}
                editable={!busy}
                returnKeyType="next"
              />
            </View>
          </View>

          <View style={[styles.field, focus === 'pw' && styles.fieldFocus]}>
            <Ionicons name="lock-closed-outline" size={19} color={focus === 'pw' ? CORAL : '#AAB0B7'} />
            <View style={styles.fieldBody}>
              <Text style={[styles.fieldLabel, focus === 'pw' && { color: CORAL }]}>비밀번호</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#B7BCC3"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocus('pw')}
                onBlur={() => setFocus(null)}
                editable={!busy}
                returnKeyType="done"
                onSubmitEditing={handlePasswordLogin}
              />
            </View>
          </View>
        </View>

        {/* 로그인 버튼 */}
        <TouchableOpacity
          onPress={handlePasswordLogin}
          disabled={busy}
          activeOpacity={0.88}
          style={[styles.loginShadow, busy && styles.btnDisabled]}
        >
          <LinearGradient colors={CORAL_GRAD} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.loginBtn}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>로그인</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.helper}>
          <Ionicons name="lock-closed" size={12} color="#B6BBC2" />
          <Text style={styles.helperText}>안전하게 암호화되어 보호됩니다</Text>
        </View>

        {/* 구분선 */}
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.line} />
        </View>

        {/* 소셜 — 아웃라인 */}
        <TouchableOpacity
          style={[styles.social, busy && styles.btnDisabled]}
          onPress={handleKakaoLogin}
          disabled={busy}
          activeOpacity={0.85}
        >
          <View style={[styles.badge, { backgroundColor: '#FEE500' }]}>
            <Ionicons name="chatbubble" size={12} color="#3C1E1E" />
          </View>
          <Text style={styles.socialText}>카카오로 계속하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.social, busy && styles.btnDisabled]}
          onPress={handleNaverLogin}
          disabled={busy}
          activeOpacity={0.85}
        >
          <View style={[styles.badge, { backgroundColor: '#03C75A' }]}>
            <Text style={styles.naverMark}>N</Text>
          </View>
          <Text style={styles.socialText}>네이버로 계속하기</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.social, busy && styles.btnDisabled]}
          onPress={handleGoogleLogin}
          disabled={busy}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-google" size={18} color="#4285F4" />
          <Text style={styles.socialText}>구글로 계속하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markText: { color: '#fff', fontWeight: '900', fontSize: 19, letterSpacing: -1 },
  wordmark: { fontSize: 21, fontWeight: '800', letterSpacing: -0.8, color: INK },
  headline: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
    lineHeight: 36,
    color: INK,
    marginTop: 46,
  },
  headSub: { fontSize: 14, color: SUBTLE, marginTop: 11, fontWeight: '500' },
  fields: { marginTop: 36 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 62,
    backgroundColor: FIELD_BG,
    borderRadius: 15,
    paddingHorizontal: 16,
    marginBottom: 11,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fieldFocus: {
    backgroundColor: '#fff',
    borderColor: CORAL,
    shadowColor: CORAL,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  fieldBody: { flex: 1 },
  fieldLabel: { fontSize: 11, color: '#A2A7AE', fontWeight: '600' },
  fieldInput: {
    fontSize: 16,
    color: '#1B1E23',
    fontWeight: '600',
    paddingVertical: 0,
    marginTop: 3,
  },
  loginShadow: {
    marginTop: 10,
    borderRadius: 15,
    shadowColor: CORAL,
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  loginBtn: {
    height: 56,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  btnDisabled: { opacity: 0.55 },
  helper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 15 },
  helperText: { fontSize: 12, color: '#A2A7AE', fontWeight: '500' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 26 },
  line: { flex: 1, height: 1, backgroundColor: '#EEF0F2' },
  dividerText: { fontSize: 12, color: '#AEB3BA', fontWeight: '500' },
  social: {
    height: 54,
    backgroundColor: '#fff',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: HAIRLINE,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  naverMark: { color: '#fff', fontWeight: '900', fontSize: 12 },
  socialText: { fontSize: 14.5, fontWeight: '600', color: '#272A30' },
});
