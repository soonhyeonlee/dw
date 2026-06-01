import React, { useMemo, useState } from 'react';
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
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';
import { EmptyState } from '../src/components/EmptyState';

type IconName = keyof typeof Ionicons.glyphMap;

type NotiType = 'cashback' | 'withdrawal' | 'promo' | 'notice';

interface Noti {
  id: string;
  type: NotiType;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  route?: string;
}

const TYPE_META: Record<NotiType, { icon: IconName; bg: string; fg: string; label: string }> = {
  cashback:   { icon: 'add-circle',         bg: COLORS.primarySoft,  fg: COLORS.primary, label: '캐시백' },
  withdrawal: { icon: 'arrow-up-circle',    bg: '#E5F6EB',           fg: '#118658',      label: '환급' },
  promo:      { icon: 'megaphone',          bg: '#EEEEFF',           fg: '#4B4BF4',      label: '이벤트' },
  notice:     { icon: 'document-text',      bg: COLORS.ink[100],     fg: COLORS.ink[700], label: '공지' },
};

const FILTERS: { key: 'all' | NotiType; label: string }[] = [
  { key: 'all',        label: '전체' },
  { key: 'cashback',   label: '캐시백' },
  { key: 'withdrawal', label: '환급' },
  { key: 'promo',      label: '이벤트' },
  { key: 'notice',     label: '공지' },
];

const NOW = Date.now();
const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const MOCK_NOTIS: Noti[] = [
  {
    id: 'n1', type: 'cashback', read: false,
    title: '캐시백 적립 완료',
    body: '쿠팡 주문에서 1,250원이 적립됐어요. 잔액 확인해보세요.',
    createdAt: NOW - 30 * MIN,
    route: '/(tabs)/cashback',
  },
  {
    id: 'n2', type: 'promo', read: false,
    title: '쿠팡 캐시백 5% → 7% UP!',
    body: '오늘 자정까지 쿠팡 모든 카테고리 캐시백 상향 중.',
    createdAt: NOW - 2 * HOUR,
    route: '/mall/coupang',
  },
  {
    id: 'n3', type: 'withdrawal', read: true,
    title: '환급 신청이 접수됐어요',
    body: '신한은행 ***1234 계좌로 30,000원이 곧 입금됩니다.',
    createdAt: NOW - 5 * HOUR,
    route: '/(tabs)/cashback',
  },
  {
    id: 'n4', type: 'cashback', read: true,
    title: '캐시백 적립 완료',
    body: '11번가 주문에서 870원이 적립됐어요.',
    createdAt: NOW - 1 * DAY,
    route: '/(tabs)/cashback',
  },
  {
    id: 'n5', type: 'notice', read: true,
    title: '서비스 이용약관 변경 안내',
    body: '2026년 5월 15일부터 변경된 이용약관이 적용됩니다.',
    createdAt: NOW - 1 * DAY - 4 * HOUR,
  },
  {
    id: 'n7', type: 'cashback', read: true,
    title: '캐시백 적립 완료',
    body: 'G마켓 주문에서 2,400원이 적립됐어요.',
    createdAt: NOW - 8 * DAY,
    route: '/(tabs)/cashback',
  },
];

function relativeLabel(ms: number): string {
  const diff = NOW - ms;
  if (diff < HOUR) return `${Math.max(1, Math.floor(diff / MIN))}분 전`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}일 전`;
  const d = new Date(ms);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
}

function bucket(ms: number): 'today' | 'yesterday' | 'thisWeek' | 'older' {
  const diff = NOW - ms;
  if (diff < DAY) return 'today';
  if (diff < 2 * DAY) return 'yesterday';
  if (diff < 7 * DAY) return 'thisWeek';
  return 'older';
}

const BUCKET_LABEL: Record<ReturnType<typeof bucket>, string> = {
  today:     '오늘',
  yesterday: '어제',
  thisWeek:  '이번 주',
  older:     '이전',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Noti[]>(MOCK_NOTIS);
  const [filter, setFilter] = useState<typeof FILTERS[number]['key']>('all');

  const filtered = useMemo(() => {
    return items.filter((n) => filter === 'all' || n.type === filter);
  }, [items, filter]);

  const grouped = useMemo(() => {
    const map: Record<string, Noti[]> = {};
    for (const n of filtered) {
      const k = bucket(n.createdAt);
      if (!map[k]) map[k] = [];
      map[k].push(n);
    }
    return (['today', 'yesterday', 'thisWeek', 'older'] as const)
      .filter((k) => map[k]?.length)
      .map((k) => ({ key: k, label: BUCKET_LABEL[k], items: map[k] }));
  }, [filtered]);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleTap = (n: Noti) => {
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    if (n.route) router.push(n.route as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '알림',
          headerBackTitle: '뒤로',
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity onPress={markAllRead} style={styles.markAll}>
                <Text style={styles.markAllText}>모두 읽음</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />

      {/* Filters */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title={filter === 'all' ? '아직 받은 알림이 없어요' : '해당 분류의 알림이 없어요'}
          subtitle="새로운 캐시백·이벤트 소식을 알려드릴게요."
        />
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {grouped.map((g) => (
            <View key={g.key}>
              <Text style={styles.groupLabel}>{g.label}</Text>
              {g.items.map((n) => {
                const meta = TYPE_META[n.type];
                return (
                  <TouchableOpacity
                    key={n.id}
                    style={[styles.row, !n.read && styles.rowUnread]}
                    onPress={() => handleTap(n)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
                      <Ionicons name={meta.icon} size={20} color={meta.fg} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.typeLabel}>{meta.label}</Text>
                        {!n.read ? <View style={styles.unreadDot} /> : null}
                        <Text style={styles.time}>{relativeLabel(n.createdAt)}</Text>
                      </View>
                      <Text style={[styles.title, !n.read && styles.titleUnread]} numberOfLines={1}>{n.title}</Text>
                      <Text style={styles.body} numberOfLines={2}>{n.body}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },

  markAll: { paddingHorizontal: 12, paddingVertical: 6 },
  markAllText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

  filterWrap: {
    backgroundColor: COLORS.background,
    paddingTop: 12, paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  filterRow: { paddingHorizontal: SPACING.xl, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.ink[200],
  },
  chipActive: { backgroundColor: COLORS.ink[900], borderColor: COLORS.ink[900] },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[700] },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },

  groupLabel: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 18, paddingBottom: 8,
    fontSize: 12, fontWeight: '800',
    color: COLORS.ink[500], letterSpacing: -0.2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.ink[100],
  },
  rowUnread: { backgroundColor: '#FFF8F4' },
  iconBox: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  typeLabel: { fontSize: 11, fontWeight: '800', color: COLORS.ink[500], letterSpacing: 0.2 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  time: { fontSize: 11, color: COLORS.ink[500], marginLeft: 'auto' },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.ink[800], marginBottom: 3 },
  titleUnread: { fontWeight: '800', color: COLORS.ink[900] },
  body: { fontSize: 12, color: COLORS.ink[600], lineHeight: 17 },
});
