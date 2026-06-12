import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, QM } from '../src/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const STEPS: { num: string; icon: IconName; title: string; desc: string }[] = [
  {
    num: '01',
    icon: 'storefront-outline',
    title: '더블원플러스에서 쇼핑몰 선택',
    desc: '홈 또는 쇼핑몰 탭에서 원하는 쇼핑몰을 골라 [캐시백 받고 이동]을 누르세요.',
  },
  {
    num: '02',
    icon: 'flash-outline',
    title: '캐시백 활성화 후 이동',
    desc: '경유 화면이 잠깐 표시된 뒤 자동으로 쇼핑몰 앱·웹으로 이동해요. 절대 다른 앱을 거치지 마세요.',
  },
  {
    num: '03',
    icon: 'bag-check-outline',
    title: '평소처럼 구매',
    desc: '쇼핑몰에서 결제까지 완료하세요. 더블원플러스 안에서 다시 시작하지 않아도 돼요.',
  },
  {
    num: '04',
    icon: 'wallet-outline',
    title: '캐시백 자동 적립',
    desc: '구매 확정 후 1~3 영업일 내 캐시백이 적립되고, 알림으로 알려드릴게요.',
  },
];

const WITHDRAW_STEPS: { num: string; title: string; desc: string }[] = [
  { num: '01', title: '계좌 등록',  desc: '마이 > 계좌 관리에서 환급 받을 계좌를 먼저 등록해주세요.' },
  { num: '02', title: '환급 신청',  desc: '캐시백 탭의 [환급하기] 또는 환급 화면에서 금액을 입력합니다. (최소 5,000원)' },
  { num: '03', title: '입금 확인',  desc: '영업일 기준 1~3일 이내 등록 계좌로 입금돼요. 수수료는 무료입니다.' },
];

const CAUTIONS = [
  { ok: false, label: '직접 방문 구매',     desc: '더블원플러스를 거치지 않고 쇼핑몰을 방문하면 적립되지 않아요.' },
  { ok: false, label: '결제 중 다른 앱',    desc: '결제 도중 비교 사이트·다른 캐시백 앱을 거치면 적립이 누락될 수 있어요.' },
  { ok: false, label: '쿠폰코드 외부 사이트', desc: '결제 화면에서 외부 쿠폰 코드를 적용하면 적립 대상에서 제외될 수 있어요.' },
  { ok: true,  label: '경유 후 30분 내 결제', desc: '경유 후 가능한 빠르게 결제하시면 누락 가능성을 낮출 수 있어요.' },
];

export default function GuideScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: '이용가이드', headerBackTitle: '뒤로' }} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={12} color={COLORS.primary} />
            <Text style={styles.heroBadgeText}>처음 사용하시나요?</Text>
          </View>
          <Text style={styles.heroTitle}>
            더블원플러스로 쇼핑하고{'\n'}
            <Text style={{ color: COLORS.primary }}>최대 10%</Text> 돌려받기
          </Text>
          <Text style={styles.heroSub}>
            평소처럼 쇼핑하면 자동으로 캐시백이 쌓여요.{'\n'}
            아래 4단계만 기억하세요.
          </Text>
        </View>

        {/* Steps timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 캐시백 받는 방법</Text>
          <View style={styles.stepsWrap}>
            {STEPS.map((s, i) => (
              <View key={s.num} style={styles.stepRow}>
                <View style={styles.stepGutter}>
                  <View style={styles.stepNumBox}>
                    <Text style={styles.stepNum}>{s.num}</Text>
                  </View>
                  {i < STEPS.length - 1 ? <View style={styles.stepLine} /> : null}
                </View>
                <View style={styles.stepBody}>
                  <View style={styles.stepHead}>
                    <Ionicons name={s.icon} size={18} color={COLORS.primary} />
                    <Text style={styles.stepTitle}>{s.title}</Text>
                  </View>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Withdraw section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 환급 받는 방법</Text>
          <View style={styles.withdrawWrap}>
            {WITHDRAW_STEPS.map((w) => (
              <View key={w.num} style={styles.withdrawRow}>
                <View style={styles.withdrawNum}>
                  <Text style={styles.withdrawNumText}>{w.num}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.withdrawTitle}>{w.title}</Text>
                  <Text style={styles.withdrawDesc}>{w.desc}</Text>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/(tabs)/cashback')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>지금 환급 신청하러 가기</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Caution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 적립이 안 되는 경우</Text>
          <Text style={styles.sectionSub}>아래 상황에서는 캐시백이 누락될 수 있어요.</Text>
          <View style={{ gap: 10, marginTop: 12 }}>
            {CAUTIONS.map((c) => (
              <View key={c.label} style={styles.cautionRow}>
                <View style={[styles.cautionIcon, c.ok ? styles.cautionIconOk : styles.cautionIconNg]}>
                  <Ionicons
                    name={c.ok ? 'checkmark' : 'close'}
                    size={14}
                    color={COLORS.white}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cautionLabel, c.ok && { color: COLORS.success }]}>{c.label}</Text>
                  <Text style={styles.cautionDesc}>{c.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* More help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 더 궁금하다면</Text>
          <View style={styles.linkList}>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push('/help')}
              activeOpacity={0.7}
            >
              <View style={styles.linkIcon}>
                <Ionicons name="help-circle-outline" size={20} color={COLORS.ink[800]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>고객센터 · 자주 묻는 질문</Text>
                <Text style={styles.linkSub}>FAQ에서 답을 빠르게 찾아보세요</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.ink[400]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push('/help/missing-cashback')}
              activeOpacity={0.7}
            >
              <View style={styles.linkIcon}>
                <Ionicons name="alert-circle-outline" size={20} color={COLORS.ink[800]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.linkTitle}>누락된 캐시백 신고</Text>
                <Text style={styles.linkSub}>적립이 안 됐다면 4일 후 신고해주세요</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.ink[400]} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: QM.pageBg },
  scroll: { flex: 1 },

  hero: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 20,
    paddingBottom: 16,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.primarySoft,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  heroTitle: {
    fontSize: 26, fontWeight: '800', color: COLORS.ink[900],
    letterSpacing: -0.6, lineHeight: 34, marginTop: 12,
  },
  heroSub: {
    fontSize: 13, color: COLORS.ink[600],
    marginTop: 10, lineHeight: 19,
  },

  section: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 32,
  },
  sectionTitle: {
    fontSize: 17, fontWeight: '800', color: COLORS.ink[900],
    letterSpacing: -0.3,
  },
  sectionSub: { fontSize: 12, color: COLORS.ink[600], marginTop: 4 },

  stepsWrap: { marginTop: 16 },
  stepRow: { flexDirection: 'row', gap: 14 },
  stepGutter: { width: 36, alignItems: 'center' },
  stepNumBox: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.ink[900],
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: COLORS.white, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  stepLine: { flex: 1, width: 2, backgroundColor: COLORS.ink[100], marginVertical: 4 },
  stepBody: { flex: 1, paddingBottom: 20 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  stepTitle: { fontSize: 15, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  stepDesc: { fontSize: 13, color: COLORS.ink[600], lineHeight: 19 },

  withdrawWrap: { marginTop: 14, gap: 10 },
  withdrawRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.md,
  },
  withdrawNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  withdrawNumText: { fontSize: 11, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 },
  withdrawTitle: { fontSize: 14, fontWeight: '800', color: COLORS.ink[900] },
  withdrawDesc: { fontSize: 12, color: COLORS.ink[600], marginTop: 4, lineHeight: 17 },

  cta: {
    marginTop: 16,
    height: 48, borderRadius: 14,
    backgroundColor: QM.coral,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: QM.coral, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  ctaText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },

  cautionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  cautionIcon: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  cautionIconNg: { backgroundColor: COLORS.error },
  cautionIconOk: { backgroundColor: COLORS.success },
  cautionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.ink[900] },
  cautionDesc: { fontSize: 12, color: COLORS.ink[600], marginTop: 3, lineHeight: 17 },

  linkList: { gap: 8, marginTop: 12 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: QM.card,
    borderRadius: 18,
    ...QM.cardShadow,
  },
  linkIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: COLORS.ink[50],
    alignItems: 'center', justifyContent: 'center',
  },
  linkTitle: { fontSize: 14, fontWeight: '700', color: COLORS.ink[900] },
  linkSub: { fontSize: 12, color: COLORS.ink[500], marginTop: 2 },
});
