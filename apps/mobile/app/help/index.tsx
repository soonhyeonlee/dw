import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const CATEGORIES: { key: string; icon: IconName; label: string }[] = [
  { key: 'cashback', icon: 'cash-outline',         label: '캐시백' },
  { key: 'withdraw', icon: 'card-outline',         label: '환급/출금' },
  { key: 'account',  icon: 'person-outline',       label: '계정' },
  { key: 'order',    icon: 'receipt-outline',      label: '주문' },
  { key: 'partner',  icon: 'storefront-outline',   label: '파트너' },
  { key: 'etc',      icon: 'ellipsis-horizontal',  label: '기타' },
];

const FAQS: { q: string; a: string; cat: string }[] = [
  { cat: 'cashback', q: '캐시백은 언제 적립되나요?', a: '구매 확정 후 영업일 기준 1~3일 이내에 자동 적립됩니다. 일부 쇼핑몰은 최대 30일까지 소요될 수 있어요.' },
  { cat: 'cashback', q: '캐시백이 누락된 것 같아요',   a: '주문 후 4일이 지나도 적립이 보이지 않으면 [누락 캐시 도움 요청] 메뉴를 통해 신고해주세요.' },
  { cat: 'cashback', q: '캐시백이 적용되지 않는 경우가 있나요?', a: '경유 없이 쇼핑몰을 직접 방문해 구매하거나, 결제 중 다른 앱을 거치면 적용되지 않을 수 있어요.' },
  { cat: 'withdraw', q: '환급 최소 금액은 얼마인가요?', a: '5,000원 이상부터 환급 신청이 가능합니다.' },
  { cat: 'withdraw', q: '환급은 며칠 내에 받을 수 있나요?', a: '신청 후 영업일 기준 1~3일 이내 등록된 계좌로 입금됩니다.' },
  { cat: 'withdraw', q: '환급 수수료가 있나요?',          a: '없습니다. 수수료는 100% 무료입니다.' },
  { cat: 'account',  q: '비밀번호를 잊어버렸어요',        a: '로그인 화면의 [비밀번호 재설정] 또는 마이 > 비밀번호 변경에서 변경할 수 있습니다.' },
  { cat: 'account',  q: '닉네임은 변경할 수 있나요?',     a: '마이 > 내 정보 수정에서 닉네임을 변경할 수 있습니다.' },
  { cat: 'order',    q: '주문 취소/반품 시 캐시백은요?',   a: '취소·반품된 주문은 자동으로 취소 처리되며, 이미 적립된 캐시백은 회수됩니다.' },
];

export default function HelpHomeScreen() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return FAQS.filter((f) => {
      if (activeCat && f.cat !== activeCat) return false;
      if (!keyword) return true;
      const k = keyword.trim().toLowerCase();
      return f.q.toLowerCase().includes(k) || f.a.toLowerCase().includes(k);
    });
  }, [keyword, activeCat]);

  const notReady = () => Alert.alert('준비 중', '해당 채널은 준비 중이에요.');

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: '고객센터', headerBackTitle: '뒤로' }} />
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Hero greeting */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>무엇을 도와드릴까요?</Text>
          <Text style={styles.heroSub}>가장 빠른 방법으로 답을 찾아드릴게요.</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={COLORS.ink[500]} />
            <TextInput
              style={styles.searchInput}
              placeholder="궁금한 내용을 검색해보세요"
              placeholderTextColor={COLORS.ink[400]}
              value={keyword}
              onChangeText={setKeyword}
              returnKeyType="search"
            />
            {keyword.length > 0 ? (
              <TouchableOpacity onPress={() => setKeyword('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.ink[400]} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Quick action cards */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardPrimary]}
            onPress={() => router.push('/help/missing-cashback')}
            activeOpacity={0.85}
          >
            <View style={styles.quickIcon}>
              <Ionicons name="alert-circle-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.quickTitle}>누락 캐시 도움 요청</Text>
            <Text style={styles.quickSub}>적립 안 된 거래를 신고해주세요</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={notReady} activeOpacity={0.85}>
            <View style={[styles.quickIcon, { backgroundColor: COLORS.ink[100] }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.ink[800]} />
            </View>
            <Text style={styles.quickTitle}>1:1 문의</Text>
            <Text style={styles.quickSub}>더블윈 봇과 대화하기</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>카테고리</Text>
          <View style={styles.catGrid}>
            <TouchableOpacity
              style={[styles.catItem, activeCat === null && styles.catItemActive]}
              onPress={() => setActiveCat(null)}
            >
              <View style={[styles.catIcon, activeCat === null && styles.catIconActive]}>
                <Ionicons name="apps-outline" size={20} color={activeCat === null ? COLORS.primary : COLORS.ink[700]} />
              </View>
              <Text style={[styles.catLabel, activeCat === null && styles.catLabelActive]}>전체</Text>
            </TouchableOpacity>
            {CATEGORIES.map((c) => {
              const active = activeCat === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catItem, active && styles.catItemActive]}
                  onPress={() => setActiveCat(c.key)}
                >
                  <View style={[styles.catIcon, active && styles.catIconActive]}>
                    <Ionicons name={c.icon} size={20} color={active ? COLORS.primary : COLORS.ink[700]} />
                  </View>
                  <Text style={[styles.catLabel, active && styles.catLabelActive]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* FAQ list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>자주 묻는 질문</Text>
          {filtered.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={32} color={COLORS.ink[300]} />
              <Text style={styles.emptyText}>검색 결과가 없어요</Text>
              <Text style={styles.emptySub}>다른 키워드로 검색하거나 1:1 문의를 이용해주세요.</Text>
            </View>
          ) : (
            <View style={styles.faqList}>
              {filtered.map((f, i) => (
                <FaqRow key={`${f.q}-${i}`} q={f.q} a={f.a} />
              ))}
            </View>
          )}
        </View>

        {/* Contact footer */}
        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>해결이 안 되셨나요?</Text>
          <Text style={styles.contactSub}>고객센터에 직접 문의해주세요.</Text>
          <TouchableOpacity style={styles.contactBtn} onPress={notReady} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.white} />
            <Text style={styles.contactBtnText}>1:1 문의 시작하기</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={faqStyles.row} onPress={() => setOpen(!open)} activeOpacity={0.7}>
      <View style={faqStyles.qRow}>
        <Text style={faqStyles.qMark}>Q.</Text>
        <Text style={faqStyles.q}>{q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={COLORS.ink[500]}
        />
      </View>
      {open ? (
        <View style={faqStyles.aRow}>
          <Text style={faqStyles.aMark}>A.</Text>
          <Text style={faqStyles.a}>{a}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },

  hero: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 16,
    paddingBottom: 4,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: COLORS.ink[600], marginTop: 6 },
  searchBox: {
    marginTop: 16,
    height: 48,
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.ink[900], padding: 0 },

  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingTop: 20,
    gap: 10,
  },
  quickCard: {
    flex: 1,
    padding: 14,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: 6,
  },
  quickCardPrimary: { borderColor: COLORS.primarySoft, backgroundColor: COLORS.primarySoft },
  quickIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  quickTitle: { fontSize: 13, fontWeight: '800', color: COLORS.ink[900], marginTop: 4 },
  quickSub: { fontSize: 11, color: COLORS.ink[600], lineHeight: 14 },

  section: { paddingHorizontal: SPACING.xl, paddingTop: 28 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.ink[900], marginBottom: 12, letterSpacing: -0.3 },

  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  catItem: { width: '25%', alignItems: 'center', paddingVertical: 8, gap: 6 },
  catItemActive: {},
  catIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: COLORS.ink[50],
    alignItems: 'center', justifyContent: 'center',
  },
  catIconActive: { backgroundColor: COLORS.primarySoft },
  catLabel: { fontSize: 12, fontWeight: '500', color: COLORS.ink[700] },
  catLabelActive: { color: COLORS.primary, fontWeight: '700' },

  faqList: { gap: 8 },

  emptyBox: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '700', color: COLORS.ink[800] },
  emptySub: { fontSize: 12, color: COLORS.ink[500], textAlign: 'center' },

  contactBox: {
    marginHorizontal: SPACING.xl,
    marginTop: 32,
    padding: 18,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.ink[900],
    alignItems: 'center',
    gap: 4,
  },
  contactTitle: { fontSize: 15, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
  contactSub: { fontSize: 12, color: COLORS.ink[300], marginBottom: 12 },
  contactBtn: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  contactBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
});

const faqStyles = StyleSheet.create({
  row: {
    paddingVertical: 14, paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qMark: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  q: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.ink[900], lineHeight: 18 },
  aRow: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.ink[100] },
  aMark: { fontSize: 13, fontWeight: '800', color: COLORS.ink[500] },
  a: { flex: 1, fontSize: 13, color: COLORS.ink[700], lineHeight: 19 },
});
