import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, QM } from '../../src/constants/theme';

// 실존 네이버 카페로 직접 연결(검색 아님). URL·회원수는 2026-06 기준 검증값.
type Cafe = { name: string; desc: string; url: string };

function openCafe(url: string) {
  Linking.openURL(url).catch(() => {});
}

// 전국 대형 카페
const FEATURED: Cafe[] = [
  { name: '맘스홀릭 베이비', desc: '전국 · 임신·출산·육아 1위 (약 320만)', url: 'https://cafe.naver.com/imsanbu' },
  { name: '레몬테라스', desc: '전국 · 살림·인테리어·육아 (약 296만)', url: 'https://cafe.naver.com/remonterrace' },
];

// 지역별 대표 맘카페
const REGIONS: { group: string; items: Cafe[] }[] = [
  {
    group: '수도권',
    items: [
      { name: '용인맘 모여라', desc: '용인·광교·분당·수지 (약 37만)', url: 'https://cafe.naver.com/easyup' },
      { name: '수원맘 모여라', desc: '수원 (약 33만)', url: 'https://cafe.naver.com/byungs94' },
      { name: '동탄맘들 모여라', desc: '동탄·화성 (약 29만)', url: 'https://cafe.naver.com/dongtanmom' },
      { name: '인천맘톡', desc: '인천 (약 24만)', url: 'https://cafe.naver.com/baby8' },
    ],
  },
  {
    group: '영남',
    items: [
      { name: '부경맘', desc: '부산·경남 (약 35만)', url: 'https://cafe.naver.com/pusanmom' },
      { name: '대구맘 365', desc: '대구 (약 30만)', url: 'https://cafe.naver.com/dgmom365' },
      { name: '울산맘들 모여라', desc: '울산 (약 14만)', url: 'https://cafe.naver.com/mammie' },
    ],
  },
  {
    group: '충청·제주',
    items: [
      { name: '대전 노은맘', desc: '대전 노은·유성 (약 6만)', url: 'https://cafe.naver.com/djnoen' },
      { name: '제주맘', desc: '제주 (약 16만)', url: 'https://cafe.naver.com/jejumam' },
    ],
  },
];

function CafeRow({ c }: { c: Cafe }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openCafe(c.url)}>
      <View style={styles.cardIcon}>
        <Ionicons name="heart" size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{c.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={1}>{c.desc}</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={COLORS.ink[400]} />
    </TouchableOpacity>
  );
}

export default function MomCafeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={QM.pageBg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>맘카페</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 인트로 */}
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.introTitle}>우리 동네 맘카페</Text>
            <Text style={styles.introSub}>전국 각지의 맘카페로 바로 이동하세요.</Text>
          </View>
        </View>

        {/* 전국 인기 */}
        <Text style={styles.sectionTitle}>전국 인기 맘카페</Text>
        <View style={styles.cardWrap}>
          {FEATURED.map((c) => <CafeRow key={c.url} c={c} />)}
        </View>

        {/* 권역별 */}
        <Text style={styles.sectionTitle}>지역별 맘카페</Text>
        {REGIONS.map((r) => (
          <View key={r.group} style={styles.regionBlock}>
            <Text style={styles.regionGroup}>{r.group}</Text>
            <View style={styles.cardWrap}>
              {r.items.map((c) => <CafeRow key={c.url} c={c} />)}
            </View>
          </View>
        ))}

        <Text style={styles.foot}>
          각 카페를 누르면 네이버 카페로 바로 이동합니다. 회원 가입·등급은 카페 정책을 따릅니다.
        </Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: QM.pageBg },
  container: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: QM.ink, letterSpacing: -0.3 },

  intro: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xs,
    backgroundColor: QM.card,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    ...QM.cardShadow,
  },
  introIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: QM.coralSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  introTitle: { fontSize: 15, fontWeight: '800', color: QM.ink },
  introSub: { fontSize: 12, color: COLORS.ink[500], marginTop: 3, lineHeight: 17 },

  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: QM.ink,
    paddingHorizontal: SPACING.xl, marginTop: 26, marginBottom: 12, letterSpacing: -0.3,
  },

  cardWrap: { paddingHorizontal: SPACING.xl, gap: 10 },
  card: {
    backgroundColor: QM.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: QM.hairline,
  },
  cardIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: QM.coralSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontSize: 15, fontWeight: '700', color: QM.ink },
  cardDesc: { fontSize: 12, color: COLORS.ink[500], marginTop: 2 },

  regionBlock: { marginBottom: 18 },
  regionGroup: {
    fontSize: 13, fontWeight: '700', color: COLORS.ink[700],
    paddingHorizontal: SPACING.xl, marginBottom: 10,
  },

  foot: {
    paddingHorizontal: SPACING.xl, marginTop: 8,
    fontSize: 12, color: COLORS.ink[400], lineHeight: 18,
  },
});
