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
import { COLORS, SPACING, RADIUS, QM } from '../src/constants/theme';
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

// 알림 목록은 실제 알림 API 연동 전까지 빈 상태로 둔다(더미 데이터 노출 방지).
// 백엔드 알림 엔드포인트 준비되면 useState 초기값을 fetch 결과로 대체.

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
  const [items, setItems] = useState<Noti[]>([]);
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
  safe: { flex: 1, backgroundColor: QM.pageBg },
  scroll: { flex: 1 },

  markAll: { paddingHorizontal: 12, paddingVertical: 6 },
  markAllText: { fontSize: 13, color: QM.coral, fontWeight: '700' },

  filterWrap: {
    backgroundColor: QM.pageBg,
    paddingTop: 12, paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: QM.hairline,
  },
  filterRow: { paddingHorizontal: SPACING.xl, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.ink[200],
  },
  chipActive: { backgroundColor: QM.coral, borderColor: QM.coral },
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
  rowUnread: { backgroundColor: QM.coralSoft },
  iconBox: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  typeLabel: { fontSize: 11, fontWeight: '800', color: COLORS.ink[500], letterSpacing: 0.2 },
  unreadDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: QM.coral },
  time: { fontSize: 11, color: COLORS.ink[500], marginLeft: 'auto' },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.ink[800], marginBottom: 3 },
  titleUnread: { fontWeight: '800', color: COLORS.ink[900] },
  body: { fontSize: 12, color: COLORS.ink[600], lineHeight: 17 },
});
