import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, QM } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';

type IconName = keyof typeof Ionicons.glyphMap;

type MenuItem = {
  icon: IconName;
  label: string;
  badge?: string;
  route?: string;
  onPress?: () => void;
};

const MEMBER_TYPE_LABEL: Record<string, string> = {
  association: '협회',
  partner: '파트너',
  user: '일반회원',
};

const QUICK_MENU: { key: string; icon: IconName; label: string; route?: string }[] = [
  { key: 'orders',  icon: 'bag-handle-outline', label: '주문내역',  route: '/market/orders' },
  { key: 'coupon',  icon: 'ticket-outline',  label: '내 쿠폰',     route: '/(tabs)/coupons' },
  { key: 'history', icon: 'receipt-outline', label: '적립내역',    route: '/(tabs)/cashback' },
  { key: 'recent',  icon: 'time-outline',    label: '최근 본 상품', route: '/mypage/recent' },
  { key: 'wish',    icon: 'heart-outline',   label: '찜한 상품',   route: '/mypage/wishlist' },
];

type TierKey = 'seed' | 'bronze' | 'silver' | 'gold';
const TIERS: { key: TierKey; label: string; min: number; color: string; emoji: string }[] = [
  { key: 'seed',   label: 'SEED',   min: 0,       color: '#8B909B', emoji: '🌱' },
  { key: 'bronze', label: 'BRONZE', min: 100000,  color: '#C57B41', emoji: '🥉' },
  { key: 'silver', label: 'SILVER', min: 300000,  color: '#7B8896', emoji: '🥈' },
  { key: 'gold',   label: 'GOLD',   min: 1000000, color: '#D4A22A', emoji: '🥇' },
];

function getTier(totalEarned: number) {
  let current = TIERS[0];
  let next: typeof TIERS[number] | null = null;
  for (let i = 0; i < TIERS.length; i++) {
    if (totalEarned >= TIERS[i].min) {
      current = TIERS[i];
      next = TIERS[i + 1] ?? null;
    }
  }
  const progress = next
    ? Math.min(1, (totalEarned - current.min) / (next.min - current.min))
    : 1;
  const remain = next ? Math.max(0, next.min - totalEarned) : 0;
  return { current, next, progress, remain };
}

function formatMoney(v: number) { return v.toLocaleString(); }

export default function MyPageScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const memberType = (user as any)?.memberType ?? 'user';
  const isPartner = memberType === 'partner' || memberType === 'association';

  const balance = isAuthenticated ? Number(user?.cashbackBalance || 0) : 0;
  const totalEarned = isAuthenticated ? Number(user?.totalEarned || 0) : 0;
  const monthEarned = isAuthenticated ? Number((user as any)?.monthEarned || 0) : 0;

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const notReady = () => Alert.alert('준비 중', '해당 기능은 준비 중입니다.');

  const supportItems: MenuItem[] = [
    { icon: 'help-circle-outline',         label: '고객센터',            route: '/help' },
    { icon: 'help-buoy-outline',           label: '누락 캐시 도움 요청',  route: '/help/missing-cashback' },
    { icon: 'chatbubble-ellipses-outline', label: '더블윈 봇 (1:1 문의)', onPress: notReady },
    { icon: 'book-outline',                label: '이용가이드',          route: '/guide' },
    { icon: 'document-text-outline',       label: '공지사항',            onPress: notReady },
  ];

  const partnerItems: MenuItem[] = [
    { icon: 'megaphone-outline', label: '파트너 전용 공지', onPress: notReady, badge: 'NEW' },
    { icon: 'pricetag-outline',  label: '쿠폰 등록 / 관리', onPress: notReady },
    { icon: 'storefront-outline', label: '내 상품 관리',    onPress: notReady },
  ];

  const settingItems: MenuItem[] = [
    { icon: 'business-outline',          label: '계좌 관리',         route: '/mypage/bank-account' },
    { icon: 'person-circle-outline',     label: '내 정보 수정',      route: '/mypage/profile' },
    { icon: 'lock-closed-outline',       label: '비밀번호 변경',     route: '/mypage/change-password' },
    { icon: 'notifications-outline',     label: '알림 설정',         route: '/settings/notifications' },
    { icon: 'shield-checkmark-outline',  label: '개인정보 처리방침',  route: '/settings/legal/privacy' },
    { icon: 'document-outline',          label: '이용약관',          route: '/settings/legal/terms' },
    { icon: 'information-circle-outline', label: '앱 정보 / 회원 탈퇴', route: '/settings/about' },
  ];

  const handleMenuPress = (m: MenuItem) => {
    if (m.route) {
      router.push(m.route as any);
    } else if (m.onPress) {
      m.onPress();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topbar}>
          <Text style={styles.topTitle}>마이</Text>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.ink[800]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/mypage/profile' as any)}>
              <Ionicons name="settings-outline" size={24} color={COLORS.ink[800]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            {isAuthenticated ? (
              <>
                <View style={styles.nameRow}>
                  <Text style={styles.nickname}>{user?.nickname}</Text>
                  <View style={[styles.memberBadge, isPartner && styles.memberBadgePartner]}>
                    <Text style={[styles.memberBadgeText, isPartner && styles.memberBadgeTextPartner]}>
                      {MEMBER_TYPE_LABEL[memberType] || '일반회원'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.email}>{user?.email}</Text>
              </>
            ) : (
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.nickname}>로그인 / 회원가입</Text>
                <Text style={styles.email}>탭하여 로그인</Text>
              </TouchableOpacity>
            )}
          </View>
          {isAuthenticated && (
            <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/mypage/profile' as any)}>
              <Ionicons name="create-outline" size={18} color={COLORS.ink[500]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tier strip */}
        {isAuthenticated && (() => {
          const tier = getTier(totalEarned);
          return (
            <View style={styles.tierCard}>
              <View style={styles.tierHead}>
                <View style={styles.tierLeft}>
                  <Text style={styles.tierEmoji}>{tier.current.emoji}</Text>
                  <View>
                    <Text style={[styles.tierLabel, { color: tier.current.color }]}>{tier.current.label}</Text>
                    <Text style={styles.tierSub}>
                      {tier.next
                        ? `${tier.next.label}까지 ${formatMoney(tier.remain)}원 남음`
                        : '최고 등급 달성!'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={notReady}>
                  <Ionicons name="information-circle-outline" size={18} color={COLORS.ink[400]} />
                </TouchableOpacity>
              </View>
              <View style={styles.tierBarBg}>
                <View
                  style={[
                    styles.tierBarFill,
                    { width: `${Math.round(tier.progress * 100)}%`, backgroundColor: tier.current.color },
                  ]}
                />
              </View>
            </View>
          );
        })()}

        {/* Cashback card — 로그인 시 검정 카드, 비로그인 시 가입 유도 CTA */}
        {isAuthenticated ? (
          <View style={styles.cashcard}>
            <View style={styles.cashcardRow}>
              <Text style={styles.cashcardLabel}>내 캐시백</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/cashback')} style={styles.moreLinkRow}>
                <Text style={styles.cashcardMore}>전체보기</Text>
                <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
              </TouchableOpacity>
            </View>
            <View style={styles.cashcardAmountRow}>
              <Text style={styles.cashcardAmount}>{formatMoney(balance)}</Text>
              <Text style={styles.cashcardUnit}>원</Text>
            </View>
            <View style={styles.cashcardStats}>
              <View style={styles.stat}>
                <Text style={styles.statKey}>이번 달 적립</Text>
                <Text style={styles.statVal}>{formatMoney(monthEarned)}원</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.stat}>
                <Text style={styles.statKey}>누적 적립</Text>
                <Text style={styles.statVal}>{formatMoney(totalEarned)}원</Text>
              </View>
              <TouchableOpacity
                style={styles.withdraw}
                onPress={() => {
                  if (balance < 5000) {
                    Alert.alert('환급 불가', '최소 환급 금액은 5,000원입니다.');
                    return;
                  }
                  router.push('/cashback/withdraw');
                }}
              >
                <Text style={styles.withdrawText}>환급하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.guestCard}
            activeOpacity={0.85}
            onPress={() => router.push('/auth/register' as any)}
          >
            <View style={styles.guestCardIcon}>
              <Ionicons name="gift-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guestCardTitle}>지금 가입하고 캐시백 시작하기</Text>
              <Text style={styles.guestCardSub}>이메일 인증만 하면 바로 적립</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Quick menu */}
        <View style={styles.quickmenu}>
          {QUICK_MENU.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={styles.quickItem}
              onPress={() => (m.route ? router.push(m.route as any) : notReady())}
              activeOpacity={0.7}
            >
              <View style={styles.quickIcon}>
                <Ionicons name={m.icon} size={22} color={COLORS.ink[800]} />
              </View>
              <Text style={styles.quickLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* 고객지원 */}
        <Section title="고객지원" items={supportItems} onPress={handleMenuPress} />

        {/* 파트너 전용 (조건부) */}
        {isPartner && (
          <>
            <View style={styles.divider} />
            <Section
              title="파트너 전용"
              subtitle={
                memberType === 'association'
                  ? '협회 운영 메뉴'
                  : (user as any)?.businessName || '파트너 운영 메뉴'
              }
              items={partnerItems}
              onPress={handleMenuPress}
            />
          </>
        )}

        <View style={styles.divider} />

        {/* 설정 */}
        <Section title="설정" items={settingItems} onPress={handleMenuPress} />

        {/* 로그인/로그아웃 */}
        {isAuthenticated ? (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={16} color={COLORS.ink[600]} />
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginBtnText}>로그인</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.versionText}>더블윈 v0.3</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  subtitle,
  items,
  onPress,
}: {
  title: string;
  subtitle?: string;
  items: MenuItem[];
  onPress: (m: MenuItem) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSub}>{subtitle}</Text>}
      </View>
      <View style={styles.sectionCard}>
        {items.map((m, i) => (
          <TouchableOpacity
            key={m.label}
            style={[styles.menuItem, i === items.length - 1 && styles.menuItemLast]}
            onPress={() => onPress(m)}
            activeOpacity={0.6}
          >
            <Ionicons name={m.icon} size={20} color={COLORS.ink[700]} />
            <Text style={styles.menuLabel}>{m.label}</Text>
            {m.badge && (
              <View style={styles.menuBadge}>
                <Text style={styles.menuBadgeText}>{m.badge}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color="#C7CCD2" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
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
  topTitle: { fontSize: 24, fontWeight: '800', color: QM.ink, letterSpacing: -0.5 },
  topActions: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: QM.card,
    borderWidth: 1, borderColor: '#ECEEF1',
    alignItems: 'center', justifyContent: 'center',
    ...QM.cardShadow, shadowOpacity: 0.04, shadowRadius: 8,
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
    marginTop: 4,
    marginBottom: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: QM.card,
    ...QM.cardShadow,
    gap: 14,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.ink[800],
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nickname: { fontSize: 17, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  email: { fontSize: 12, color: COLORS.ink[500], marginTop: 3 },
  memberBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: COLORS.ink[100],
  },
  memberBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.ink[700] },
  memberBadgePartner: { backgroundColor: COLORS.primarySoft },
  memberBadgeTextPartner: { color: COLORS.primary },
  editBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  tierCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: QM.card,
    ...QM.cardShadow,
  },
  tierHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierEmoji: { fontSize: 24 },
  tierLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 0.6 },
  tierSub: { fontSize: 12, color: COLORS.ink[600], marginTop: 2 },
  tierBarBg: {
    height: 6, borderRadius: 3,
    backgroundColor: COLORS.ink[100],
    marginTop: 12,
    overflow: 'hidden',
  },
  tierBarFill: { height: 6, borderRadius: 3 },

  cashcard: {
    marginHorizontal: SPACING.xl,
    backgroundColor: QM.card,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    ...QM.cardShadow,
  },
  cashcardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashcardLabel: { fontSize: 12.5, color: QM.sub, fontWeight: '600' },
  moreLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cashcardMore: { fontSize: 12, color: '#B6BBC2' },
  cashcardAmountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 5 },
  cashcardAmount: { fontSize: 30, fontWeight: '800', color: QM.ink, letterSpacing: -1 },
  cashcardUnit: { fontSize: 20, fontWeight: '800', color: QM.coral, marginLeft: 2 },
  cashcardStats: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stat: { gap: 2 },
  statKey: { fontSize: 11, color: '#9097A0', fontWeight: '500' },
  statVal: { fontSize: 14, color: QM.ink, fontWeight: '700' },
  statSep: { width: 0, height: 0 },
  withdraw: {
    marginLeft: 'auto',
    backgroundColor: QM.coral,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 999,
    ...QM.cardShadow, shadowColor: QM.coral, shadowOpacity: 0.22, shadowRadius: 14,
  },
  withdrawText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  guestCard: {
    marginHorizontal: SPACING.xl,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  guestCardIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
  },
  guestCardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  guestCardSub: { fontSize: 12, color: COLORS.ink[700], marginTop: 3 },

  quickmenu: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 20,
  },
  quickItem: { flex: 1, alignItems: 'center', gap: 7 },
  quickIcon: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: QM.card,
    borderWidth: 1, borderColor: '#EEF0F3',
    alignItems: 'center', justifyContent: 'center',
    ...QM.cardShadow, shadowOpacity: 0.05, shadowRadius: 10,
  },
  quickLabel: { fontSize: 11, color: '#5A6069', fontWeight: '600' },

  divider: { height: 6 },

  section: {
    marginHorizontal: SPACING.xl,
    marginBottom: 16,
  },
  sectionCard: {
    borderRadius: 20,
    backgroundColor: QM.card,
    ...QM.cardShadow,
    overflow: 'hidden',
  },
  sectionHead: {
    paddingHorizontal: 4, paddingTop: 2, paddingBottom: 10,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9097A0', letterSpacing: 0.3 },
  sectionSub: { fontSize: 11, color: COLORS.ink[400], marginTop: 2 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F4',
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLabel: { flex: 1, fontSize: 14, color: COLORS.ink[800], fontWeight: '500' },
  menuBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  menuBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.white, letterSpacing: 0.3 },

  logoutBtn: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.ink[200],
    borderRadius: RADIUS.md,
  },
  logoutText: { fontSize: 13, color: COLORS.ink[700], fontWeight: '600' },
  loginBtn: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  loginBtnText: { fontSize: 15, fontWeight: '800', color: COLORS.white },

  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.ink[400],
    marginTop: 8,
  },
});
