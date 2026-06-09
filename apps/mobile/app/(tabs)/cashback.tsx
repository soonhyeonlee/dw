import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, QM } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { getCashbackHistory, getWithdrawalHistory } from '../../src/api/cashback';
import { EmptyState } from '../../src/components/EmptyState';
import { getMalls, type Mall } from '../../src/api/home';
import { MallCard } from '../../src/components/MallCard';

type Tab = 'history' | 'withdrawal';
type Period = 'thisMonth' | 'lastMonth' | '3months' | 'all';

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: 'thisMonth', label: '이번달' },
  { key: 'lastMonth', label: '지난달' },
  { key: '3months',   label: '최근 3개월' },
  { key: 'all',       label: '전체' },
];

function isInPeriod(dateStr: string | undefined, period: Period): boolean {
  if (period === 'all') return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  if (period === 'thisMonth') {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (period === 'lastMonth') {
    const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() === last.getFullYear() && d.getMonth() === last.getMonth();
  }
  if (period === '3months') {
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    return d.getTime() >= cutoff.getTime();
  }
  return true;
}

const STATUS_MAP: Record<string, { label: string; tone: 'pending' | 'success' | 'primary' | 'error' }> = {
  pending:   { label: '대기중',   tone: 'pending' },
  confirmed: { label: '확정',     tone: 'success' },
  paid:      { label: '지급완료', tone: 'primary' },
  cancelled: { label: '취소',     tone: 'error' },
  requested: { label: '요청',     tone: 'pending' },
  processing:{ label: '처리중',   tone: 'primary' },
  completed: { label: '완료',     tone: 'success' },
  rejected:  { label: '거절',     tone: 'error' },
};

const TONE_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: '#FFF6DE', fg: '#AF7800' },
  success: { bg: '#E5F6EB', fg: '#118658' },
  primary: { bg: COLORS.primarySoft, fg: COLORS.primary },
  error:   { bg: '#FFE3E2', fg: COLORS.error },
};

function fmt(v: number) { return v.toLocaleString(); }

function GuestCashback({ router }: { router: ReturnType<typeof useRouter> }) {
  const [malls, setMalls] = useState<Mall[]>([]);
  useEffect(() => {
    getMalls().then((d) => setMalls(d || [])).catch(() => setMalls([]));
  }, []);
  const STEPS = [
    { n: 1, t: '쇼핑몰 선택', s: '더블윈에서 원하는 쇼핑몰을 골라요' },
    { n: 2, t: '경유 쇼핑', s: '평소처럼 결제만 하면 끝!' },
    { n: 3, t: '캐시백 적립', s: '구매 확정 후 평균 30일 이내 적립' },
  ];
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.topbar}>
        <Text style={styles.topTitle}>캐시백</Text>
        <TouchableOpacity style={styles.helpBtn} onPress={() => router.push('/help/missing-cashback')}>
          <Ionicons name="help-circle-outline" size={20} color={COLORS.ink[700]} />
          <Text style={styles.helpText}>누락 캐시</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity
          style={guestStyles.cta}
          activeOpacity={0.9}
          onPress={() => router.push('/auth/register' as any)}
        >
          <View style={guestStyles.ctaIcon}>
            <Ionicons name="gift" size={26} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={guestStyles.ctaTitle}>지금 가입하고 캐시백 시작하기</Text>
            <Text style={guestStyles.ctaSub}>이메일 인증만 하면 바로 적립</Text>
          </View>
          <View style={guestStyles.ctaArrow}>
            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        <View style={guestStyles.howWrap}>
          <Text style={guestStyles.howTitle}>캐시백 받는 방법</Text>
          {STEPS.map((s) => (
            <View key={s.n} style={guestStyles.howRow}>
              <View style={guestStyles.howDot}>
                <Text style={guestStyles.howNum}>{s.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={guestStyles.howStepTitle}>{s.t}</Text>
                <Text style={guestStyles.howStepSub}>{s.s}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={guestStyles.divider} />

        <View style={guestStyles.section}>
          <Text style={guestStyles.sectionTitle}>인기 쇼핑몰 둘러보기</Text>
          <Text style={guestStyles.sectionSub}>지금 어떤 캐시백이 있는지 미리 보세요</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.xl, gap: 14, paddingBottom: 8 }}>
          {malls.slice(0, 8).map((m) => (
            <MallCard
              key={m.id}
              mall={m}
              variant="search"
              onPress={() => router.push(`/mall/${m.platform}` as any)}
            />
          ))}
        </ScrollView>

        <TouchableOpacity
          style={guestStyles.loginBtn}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={guestStyles.loginBtnText}>이미 회원이신가요? 로그인</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function dateLabel(s?: string) {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function CashbackScreen() {
  const router = useRouter();
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('history');
  const [period, setPeriod] = useState<Period>('thisMonth');
  const [cashbackItems, setCashbackItems] = useState<any[]>([]);
  const [withdrawalItems, setWithdrawalItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailItem, setDetailItem] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cb, wd] = await Promise.all([
        getCashbackHistory().catch(() => ({ items: [] })),
        getWithdrawalHistory().catch(() => ({ items: [] })),
      ]);
      setCashbackItems(cb?.items || []);
      setWithdrawalItems(wd?.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshProfile()]);
    setRefreshing(false);
  }, [loadData, refreshProfile]);

  const balance = Number(user?.cashbackBalance || 0);
  const totalEarned = Number(user?.totalEarned || 0);
  const totalWithdrawn = Number(user?.totalWithdrawn || 0);
  const monthEarned = Number((user as any)?.monthEarned || 0);

  const handleWithdraw = () => {
    if (balance < 5000) {
      Alert.alert('환급 불가', '최소 환급 금액은 5,000원입니다.');
      return;
    }
    router.push('/cashback/withdraw');
  };

  if (!isAuthenticated) {
    return <GuestCashback router={router} />;
  }

  const sourceItems = tab === 'history' ? cashbackItems : withdrawalItems;
  const items = sourceItems.filter((it: any) => isInPeriod(it.createdAt, period));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.topbar}>
        <Text style={styles.topTitle}>캐시백</Text>
        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => router.push('/help/missing-cashback')}
        >
          <Ionicons name="help-circle-outline" size={20} color={COLORS.ink[700]} />
          <Text style={styles.helpText}>누락 캐시</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Cashback dark card */}
        <View style={styles.cashcard}>
          <View style={styles.cashcardRow}>
            <Text style={styles.cashcardLabel}>환급 가능 캐시백</Text>
            <View style={styles.thisMonthBadge}>
              <Ionicons name="trending-up" size={11} color="#118658" />
              <Text style={styles.thisMonthText}>이번 달 +{fmt(monthEarned)}원</Text>
            </View>
          </View>
          <View style={styles.cashcardAmountRow}>
            <Text style={styles.cashcardAmount}>{fmt(balance)}</Text>
            <Text style={styles.cashcardUnit}>원</Text>
          </View>
          <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw} activeOpacity={0.85}>
            <Text style={styles.withdrawBtnText}>환급하기</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Mini stats — 환급 가능 / 적립(대기중) / 환급 완료 */}
        <View style={styles.miniRow}>
          <View style={styles.miniItem}>
            <Text style={styles.miniLabel}>환급 가능 캐쉬</Text>
            <Text style={styles.miniVal}>{fmt(totalEarned)}원</Text>
          </View>
          <View style={styles.miniSep} />
          <View style={styles.miniItem}>
            <Text style={styles.miniLabel}>적립캐쉬{'\n'}(확인 대기중)</Text>
            <Text style={[styles.miniVal, { color: COLORS.primary }]}>
              {fmt(withdrawalItems.filter((w) => w.status === 'requested' || w.status === 'processing').reduce((a, b) => a + Number(b.amount || 0), 0))}원
            </Text>
          </View>
          <View style={styles.miniSep} />
          <View style={styles.miniItem}>
            <Text style={styles.miniLabel}>환급 완료 캐쉬</Text>
            <Text style={styles.miniVal}>{fmt(totalWithdrawn)}원</Text>
          </View>
        </View>

        {/* Segmented tab */}
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segItem, tab === 'history' && styles.segItemActive]}
            onPress={() => setTab('history')}
          >
            <Text style={[styles.segText, tab === 'history' && styles.segTextActive]}>적립 내역</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segItem, tab === 'withdrawal' && styles.segItemActive]}
            onPress={() => setTab('withdrawal')}
          >
            <Text style={[styles.segText, tab === 'withdrawal' && styles.segTextActive]}>환급 내역</Text>
          </TouchableOpacity>
        </View>

        {/* Period filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
        >
          {PERIOD_OPTIONS.map((p) => {
            const active = p.key === period;
            return (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodChip, active && styles.periodChipActive]}
                onPress={() => setPeriod(p.key)}
              >
                <Text style={[styles.periodText, active && styles.periodTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List */}
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={tab === 'history' ? 'receipt-outline' : 'card-outline'}
            title={
              tab === 'history'
                ? sourceItems.length === 0 ? '아직 적립된 캐시백이 없어요' : '해당 기간 내역이 없어요'
                : sourceItems.length === 0 ? '아직 환급 신청 내역이 없어요' : '해당 기간 내역이 없어요'
            }
            subtitle={
              tab === 'history'
                ? '쇼핑몰을 경유해 구매하면 캐시백이 쌓여요'
                : '잔액 5,000원부터 환급 가능합니다'
            }
            actionLabel={sourceItems.length > 0 ? '전체 보기' : undefined}
            onAction={sourceItems.length > 0 ? () => setPeriod('all') : undefined}
            compact
          />
        ) : (
          <View style={styles.list}>
            {items.map((it: any) => {
              const status = STATUS_MAP[it.status] || { label: it.status, tone: 'pending' as const };
              const tone = TONE_COLORS[status.tone];
              const isHistory = tab === 'history';
              const title = isHistory
                ? (it.productTitle || it.title || '캐시백')
                : `${it.bankName || '은행'} 환급`;
              const subtitle = isHistory
                ? (it.platform || it.mallLabel || '')
                : (it.accountNumber ? `***${String(it.accountNumber).slice(-4)}` : '계좌');
              const amount = isHistory
                ? Number(it.cashbackAmount || it.amount || 0)
                : Number(it.amount || 0);

              return (
                <TouchableOpacity
                  key={it.id}
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => setDetailItem({ ...it, _isHistory: isHistory, _title: title, _subtitle: subtitle, _amount: amount, _status: status, _tone: tone })}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons
                      name={isHistory ? 'add-circle' : 'arrow-up-circle'}
                      size={28}
                      color={isHistory ? COLORS.primary : COLORS.ink[700]}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={styles.rowTopRow}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
                      <Text style={[styles.rowAmount, isHistory ? { color: COLORS.primary } : { color: COLORS.ink[900] }]}>
                        {isHistory ? '+' : '-'}{fmt(amount)}원
                      </Text>
                    </View>
                    <View style={styles.rowMetaRow}>
                      <Text style={styles.rowMeta}>{subtitle}</Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.rowMeta}>{dateLabel(it.createdAt)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                        <Text style={[styles.statusText, { color: tone.fg }]}>{status.label}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail bottom sheet */}
      <Modal
        visible={!!detailItem}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailItem(null)}
      >
        <Pressable style={sheetStyles.backdrop} onPress={() => setDetailItem(null)}>
          <Pressable style={sheetStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={sheetStyles.handle} />
            {detailItem ? (
              <>
                <View style={sheetStyles.titleRow}>
                  <Text style={sheetStyles.title} numberOfLines={2}>{detailItem._title}</Text>
                  <View style={[sheetStyles.statusBadge, { backgroundColor: detailItem._tone.bg }]}>
                    <Text style={[sheetStyles.statusText, { color: detailItem._tone.fg }]}>
                      {detailItem._status.label}
                    </Text>
                  </View>
                </View>
                <View style={sheetStyles.amountRow}>
                  <Text style={[
                    sheetStyles.amount,
                    detailItem._isHistory ? { color: COLORS.primary } : { color: COLORS.ink[900] },
                  ]}>
                    {detailItem._isHistory ? '+' : '-'}{fmt(detailItem._amount)}원
                  </Text>
                </View>

                <View style={sheetStyles.divider} />

                <View style={sheetStyles.kvRow}>
                  <Text style={sheetStyles.k}>{detailItem._isHistory ? '쇼핑몰' : '계좌'}</Text>
                  <Text style={sheetStyles.v} numberOfLines={1}>{detailItem._subtitle || '-'}</Text>
                </View>
                <View style={sheetStyles.kvRow}>
                  <Text style={sheetStyles.k}>일시</Text>
                  <Text style={sheetStyles.v}>{dateLabel(detailItem.createdAt)}</Text>
                </View>
                {detailItem._isHistory && detailItem.orderAmount ? (
                  <View style={sheetStyles.kvRow}>
                    <Text style={sheetStyles.k}>주문 금액</Text>
                    <Text style={sheetStyles.v}>{fmt(Number(detailItem.orderAmount))}원</Text>
                  </View>
                ) : null}
                {detailItem._isHistory && detailItem.cashbackRate ? (
                  <View style={sheetStyles.kvRow}>
                    <Text style={sheetStyles.k}>적립률</Text>
                    <Text style={sheetStyles.v}>{detailItem.cashbackRate}%</Text>
                  </View>
                ) : null}
                {!detailItem._isHistory && detailItem.bankName ? (
                  <View style={sheetStyles.kvRow}>
                    <Text style={sheetStyles.k}>입금 은행</Text>
                    <Text style={sheetStyles.v}>{detailItem.bankName}</Text>
                  </View>
                ) : null}

                {detailItem._isHistory ? (
                  <TouchableOpacity
                    style={sheetStyles.helpBtn}
                    onPress={() => {
                      setDetailItem(null);
                      router.push('/help/missing-cashback');
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="help-circle-outline" size={16} color={COLORS.ink[800]} />
                    <Text style={sheetStyles.helpText}>이 거래에 문의하기</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={sheetStyles.closeBtn}
                  onPress={() => setDetailItem(null)}
                  activeOpacity={0.85}
                >
                  <Text style={sheetStyles.closeText}>확인</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: QM.pageBg },
  container: { flex: 1, backgroundColor: QM.pageBg },

  topbar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
  },
  topTitle: { fontSize: 22, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.5 },
  helpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: COLORS.ink[100],
    borderRadius: 999,
  },
  helpText: { fontSize: 12, color: COLORS.ink[700], fontWeight: '600' },

  cashcard: {
    marginHorizontal: SPACING.xl,
    marginTop: 4,
    backgroundColor: QM.card,
    borderRadius: 20,
    padding: 22,
    ...QM.cardShadow,
  },
  cashcardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashcardLabel: { fontSize: 13, color: '#9097A0', fontWeight: '700' },
  thisMonthBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E5F6EB',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999,
  },
  thisMonthText: { fontSize: 11, color: '#118658', fontWeight: '700' },
  cashcardAmountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 10, marginBottom: 18 },
  cashcardAmount: { fontSize: 36, fontWeight: '800', color: QM.coral, letterSpacing: -0.5 },
  cashcardUnit: { fontSize: 22, fontWeight: '700', color: QM.coral, marginLeft: 4 },
  withdrawBtn: {
    height: 46,
    backgroundColor: QM.coral,
    borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4,
  },
  withdrawBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },

  miniRow: {
    marginHorizontal: SPACING.xl,
    marginTop: 14,
    paddingVertical: 16,
    backgroundColor: QM.card,
    borderRadius: 18,
    ...QM.cardShadow,
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniItem: { flex: 1, alignItems: 'center', gap: 4 },
  miniLabel: { fontSize: 11, color: '#9097A0', fontWeight: '700', textAlign: 'center', lineHeight: 14, minHeight: 28 },
  miniVal: { fontSize: 14, color: QM.ink, fontWeight: '800' },
  miniSep: { width: 1, height: 28, backgroundColor: QM.hairline },

  segment: {
    marginHorizontal: SPACING.xl,
    marginTop: 24,
    flexDirection: 'row',
    backgroundColor: COLORS.ink[100],
    borderRadius: 10,
    padding: 4,
  },
  segItem: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segItemActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[500] },
  segTextActive: { color: COLORS.ink[900], fontWeight: '700' },

  periodRow: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.ink[200],
  },
  periodChipActive: {
    backgroundColor: COLORS.ink[900],
    borderColor: COLORS.ink[900],
  },
  periodText: { fontSize: 12, fontWeight: '600', color: COLORS.ink[700] },
  periodTextActive: { color: COLORS.white, fontWeight: '700' },

  list: {
    marginHorizontal: SPACING.xl,
    marginTop: 8,
    paddingHorizontal: 16,
    backgroundColor: QM.card,
    borderRadius: 18,
    ...QM.cardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: QM.hairline,
  },
  rowIcon: { width: 36, alignItems: 'center' },
  rowTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, fontSize: 14, color: QM.ink, fontWeight: '600' },
  rowAmount: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  rowMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  rowMeta: { fontSize: 11, color: COLORS.ink[500] },
  metaDot: { width: 2, height: 2, borderRadius: 1, backgroundColor: COLORS.ink[300] },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: { fontSize: 10, fontWeight: '700' },

});

const sheetStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.xl,
    paddingTop: 12,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center',
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.ink[200],
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: COLORS.ink[900], letterSpacing: -0.3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '700' },

  amountRow: { marginTop: 10, marginBottom: 6 },
  amount: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },

  divider: { height: 1, backgroundColor: COLORS.ink[100], marginVertical: 14 },

  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  k: { fontSize: 13, color: COLORS.ink[500], fontWeight: '500' },
  v: { fontSize: 13, color: COLORS.ink[900], fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },

  helpBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[50],
  },
  helpText: { fontSize: 13, color: COLORS.ink[800], fontWeight: '600' },

  closeBtn: {
    marginTop: 10,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.ink[900],
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});

const guestStyles = StyleSheet.create({
  cta: {
    margin: SPACING.xl,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 18,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  ctaIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  ctaSub: { fontSize: 12, color: COLORS.ink[700], marginTop: 4, fontWeight: '500' },
  ctaArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  howWrap: { paddingHorizontal: SPACING.xl, paddingTop: 4, paddingBottom: 8, gap: 12 },
  howTitle: { fontSize: 15, fontWeight: '800', color: COLORS.ink[900], marginBottom: 4 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 8 },
  howDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  howNum: { fontSize: 14, fontWeight: '800', color: COLORS.white },
  howStepTitle: { fontSize: 14, fontWeight: '700', color: COLORS.ink[900] },
  howStepSub: { fontSize: 12, color: COLORS.ink[600], marginTop: 2 },
  divider: { height: 8, backgroundColor: QM.pageBg, marginTop: 12 },
  section: { paddingHorizontal: SPACING.xl, paddingTop: 22, paddingBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  sectionSub: { fontSize: 12, color: COLORS.ink[500], marginTop: 3 },
  loginBtn: {
    marginHorizontal: SPACING.xl, marginTop: 24,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.ink[200],
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.ink[800] },
});
