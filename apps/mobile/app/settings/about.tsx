import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

const APP_VERSION = '0.4.0';
const BUILD_NUMBER = '40';

type IconName = keyof typeof Ionicons.glyphMap;

interface RowProps {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function Row({ icon, label, value, onPress, destructive }: RowProps) {
  const C = destructive ? COLORS.error : COLORS.ink[800];
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={C} />
      <Text style={[styles.rowLabel, { color: C }]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={COLORS.ink[300]} /> : null}
    </TouchableOpacity>
  );
}

export default function AboutScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleClearCache = () => {
    Alert.alert('캐시 삭제', '이미지 캐시와 임시 파일을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => Alert.alert('완료', '캐시가 삭제되었어요.') },
    ]);
  };

  const handleOpenSourceLicense = () => {
    Alert.alert('오픈소스 라이선스', 'React Native, Expo, TypeORM 등 오픈소스 사용 정보를 표시할 페이지입니다.');
  };

  const handleVisitWebsite = () => {
    Linking.openURL('https://doublewin.example').catch(() =>
      Alert.alert('알림', '브라우저를 열 수 없어요.'),
    );
  };

  const handleLeave = async () => {
    if (confirmText.trim() !== '탈퇴합니다') {
      Alert.alert('확인 문구가 달라요', '"탈퇴합니다"를 정확히 입력해주세요.');
      return;
    }
    setConfirmOpen(false);
    setConfirmText('');
    Alert.alert(
      '탈퇴 처리됨',
      '계정 탈퇴 요청이 접수되었어요. 관련 캐시백·환급 내역은 정책에 따라 보관 후 파기됩니다.',
      [
        {
          text: '확인',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: '앱 정보', headerBackTitle: '뒤로' }} />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* App identity */}
        <View style={styles.identity}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>D</Text>
          </View>
          <Text style={styles.appName}>더블윈</Text>
          <Text style={styles.appVersion}>v{APP_VERSION} ({BUILD_NUMBER})</Text>
          <TouchableOpacity onPress={handleVisitWebsite}>
            <Text style={styles.link}>doublewin.example</Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>앱</Text>
          <View style={styles.card}>
            <Row icon="information-circle-outline" label="버전" value={`v${APP_VERSION}`} />
            <View style={styles.divider} />
            <Row icon="cloud-download-outline" label="업데이트 확인" value="최신" onPress={() => Alert.alert('업데이트', '최신 버전을 사용 중이에요.')} />
            <View style={styles.divider} />
            <Row icon="trash-outline" label="캐시 삭제" onPress={handleClearCache} />
            <View style={styles.divider} />
            <Row icon="code-slash-outline" label="오픈소스 라이선스" onPress={handleOpenSourceLicense} />
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>약관·정책</Text>
          <View style={styles.card}>
            <Row icon="document-outline" label="이용약관" onPress={() => router.push('/settings/legal/terms')} />
            <View style={styles.divider} />
            <Row icon="shield-checkmark-outline" label="개인정보 처리방침" onPress={() => router.push('/settings/legal/privacy')} />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>계정</Text>
          <View style={styles.card}>
            <Row
              icon="person-remove-outline"
              label="회원 탈퇴"
              destructive
              onPress={() => setConfirmOpen(true)}
            />
          </View>
          <Text style={styles.sectionFoot}>
            탈퇴 시 잔여 캐시백은 환급되지 않으며, 일부 거래 기록은 관계 법령에 따라 보관됩니다.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Withdraw confirm modal */}
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <Pressable style={modalStyles.backdrop} onPress={() => setConfirmOpen(false)}>
          <Pressable style={modalStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={modalStyles.iconBox}>
              <Ionicons name="alert-circle" size={28} color={COLORS.error} />
            </View>
            <Text style={modalStyles.title}>정말 탈퇴하시겠어요?</Text>
            <Text style={modalStyles.body}>
              · 잔여 캐시백 <Text style={modalStyles.b}>환급 불가</Text>{'\n'}
              · 찜·관심 기록 <Text style={modalStyles.b}>모두 삭제</Text>{'\n'}
              · 동일 이메일 <Text style={modalStyles.b}>30일간 재가입 제한</Text>
            </Text>

            <Text style={modalStyles.confirmLabel}>
              계속하려면 <Text style={modalStyles.b}>"탈퇴합니다"</Text>를 입력해주세요
            </Text>
            <TextInput
              style={modalStyles.input}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="탈퇴합니다"
              placeholderTextColor={COLORS.ink[400]}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={modalStyles.btnRow}>
              <TouchableOpacity
                style={[modalStyles.btn, modalStyles.btnGhost]}
                onPress={() => { setConfirmOpen(false); setConfirmText(''); }}
              >
                <Text style={modalStyles.btnGhostText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  modalStyles.btn,
                  modalStyles.btnDanger,
                  confirmText.trim() !== '탈퇴합니다' && modalStyles.btnDangerDisabled,
                ]}
                onPress={handleLeave}
                disabled={confirmText.trim() !== '탈퇴합니다'}
              >
                <Text style={modalStyles.btnDangerText}>탈퇴 진행</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },

  identity: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 4,
  },
  logoBox: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: { fontSize: 32, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  appName: { fontSize: 18, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  appVersion: { fontSize: 12, color: COLORS.ink[500], fontVariant: ['tabular-nums'] },
  link: { fontSize: 12, color: COLORS.primary, fontWeight: '700', marginTop: 6 },

  section: { paddingHorizontal: SPACING.xl, paddingTop: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: COLORS.ink[500], marginBottom: 8, letterSpacing: -0.1 },
  sectionFoot: { fontSize: 11, color: COLORS.ink[500], marginTop: 8, lineHeight: 16 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.divider,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  rowValue: { fontSize: 13, color: COLORS.ink[500], fontWeight: '500' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.ink[100] },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  sheet: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 22,
  },
  iconBox: { alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.ink[900], textAlign: 'center', letterSpacing: -0.3 },
  body: { fontSize: 13, color: COLORS.ink[700], lineHeight: 21, marginTop: 12, textAlign: 'left' },
  b: { fontWeight: '800', color: COLORS.ink[900] },

  confirmLabel: { fontSize: 12, color: COLORS.ink[700], marginTop: 18, marginBottom: 8 },
  input: {
    height: 44,
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.ink[900],
    borderWidth: 1,
    borderColor: COLORS.ink[100],
  },

  btnRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  btn: { flex: 1, height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: COLORS.ink[100] },
  btnGhostText: { fontSize: 14, fontWeight: '700', color: COLORS.ink[800] },
  btnDanger: { backgroundColor: COLORS.error },
  btnDangerDisabled: { opacity: 0.4 },
  btnDangerText: { fontSize: 14, fontWeight: '800', color: COLORS.white },
});
