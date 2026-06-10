import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, QM } from '../../src/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

type Group = {
  key: string;
  label: string;
  desc?: string;
  items: { key: string; icon: IconName; label: string; sub?: string; defaultOn?: boolean }[];
};

const GROUPS: Group[] = [
  {
    key: 'cashback',
    label: '내 활동',
    items: [
      { key: 'cashback_added',     icon: 'add-circle-outline', label: '캐시백 적립', sub: '구매 후 적립이 완료되면 알려드려요', defaultOn: true },
      { key: 'cashback_confirmed', icon: 'checkmark-circle-outline', label: '캐시백 확정', sub: '대기 → 확정 상태로 변경 시 알려드려요', defaultOn: true },
      { key: 'withdrawal',         icon: 'arrow-up-circle-outline', label: '환급 처리', sub: '환급 신청·완료 시 알려드려요', defaultOn: true },
      { key: 'wishlist_price',     icon: 'pricetag-outline',   label: '찜 상품 가격 변동', sub: '찜한 상품 가격 인하 시 알려드려요', defaultOn: false },
    ],
  },
  {
    key: 'promo',
    label: '혜택과 이벤트',
    desc: '쇼핑몰 프로모션·쿠폰·기획전 안내',
    items: [
      { key: 'promo_mall',  icon: 'megaphone-outline',  label: '쇼핑몰 프로모션', sub: '내가 자주 쓰는 쇼핑몰 캐시백 상향', defaultOn: true },
      { key: 'promo_event', icon: 'gift-outline',       label: '이벤트·쿠폰',     sub: '추첨·다운로드 쿠폰 안내', defaultOn: true },
    ],
  },
  {
    key: 'system',
    label: '서비스',
    items: [
      { key: 'system_notice',  icon: 'document-text-outline', label: '공지사항', sub: '약관·정책 변경 등 중요 공지', defaultOn: true },
      { key: 'system_support', icon: 'chatbubble-ellipses-outline', label: '1:1 문의 답변', defaultOn: true },
    ],
  },
];

const NIGHT_KEY = 'night_quiet';

export default function NotificationSettingsScreen() {
  const [state, setState] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of GROUPS) {
      for (const it of g.items) init[it.key] = !!it.defaultOn;
    }
    init[NIGHT_KEY] = true;
    return init;
  });

  const toggle = (k: string) => setState((s) => ({ ...s, [k]: !s[k] }));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: '알림 설정', headerBackTitle: '뒤로' }} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Master notice */}
        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.ink[600]} />
          <Text style={styles.noticeText}>
            기기 설정에서 더블원플러스 알림을 차단한 경우, 아래 설정과 무관하게 알림이 도착하지 않아요.
          </Text>
        </View>

        {GROUPS.map((g) => (
          <View key={g.key} style={styles.group}>
            <Text style={styles.groupLabel}>{g.label}</Text>
            {g.desc ? <Text style={styles.groupDesc}>{g.desc}</Text> : null}
            <View style={styles.card}>
              {g.items.map((it, i) => (
                <View
                  key={it.key}
                  style={[styles.row, i < g.items.length - 1 && styles.rowDivider]}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={it.icon} size={20} color={COLORS.ink[700]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{it.label}</Text>
                    {it.sub ? <Text style={styles.rowSub}>{it.sub}</Text> : null}
                  </View>
                  <Switch
                    value={!!state[it.key]}
                    onValueChange={() => toggle(it.key)}
                    trackColor={{ false: COLORS.ink[200], true: COLORS.primary }}
                    thumbColor={COLORS.white}
                    ios_backgroundColor={COLORS.ink[200]}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Quiet hours */}
        <View style={styles.group}>
          <Text style={styles.groupLabel}>방해 금지 시간</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowIcon}>
                <Ionicons name="moon-outline" size={20} color={COLORS.ink[700]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>야간 알림 끄기 (22:00 ~ 08:00)</Text>
                <Text style={styles.rowSub}>해당 시간엔 푸시를 보류해요</Text>
              </View>
              <Switch
                value={!!state[NIGHT_KEY]}
                onValueChange={() => toggle(NIGHT_KEY)}
                trackColor={{ false: COLORS.ink[200], true: COLORS.primary }}
                thumbColor={COLORS.white}
                ios_backgroundColor={COLORS.ink[200]}
              />
            </View>
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

  notice: {
    marginHorizontal: SPACING.xl,
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  noticeText: { flex: 1, fontSize: 12, color: COLORS.ink[700], lineHeight: 17 },

  group: { paddingHorizontal: SPACING.xl, paddingTop: 24 },
  groupLabel: { fontSize: 13, fontWeight: '700', color: '#9097A0', letterSpacing: -0.2, marginBottom: 4 },
  groupDesc: { fontSize: 11, color: COLORS.ink[500], marginBottom: 8 },
  card: {
    backgroundColor: QM.card,
    borderRadius: 18,
    ...QM.cardShadow,
    overflow: 'hidden',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#F1F2F4' },
  rowIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: COLORS.ink[50],
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontSize: 14, fontWeight: '600', color: COLORS.ink[900] },
  rowSub: { fontSize: 11, color: COLORS.ink[500], marginTop: 2, lineHeight: 15 },
});
