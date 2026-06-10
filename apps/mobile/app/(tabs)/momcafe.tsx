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
import { COLORS, SPACING, RADIUS, QM } from '../../src/constants/theme';

// 맘카페 디렉터리. 카페 고유 ID 하드코딩 대신 네이버 카페 검색으로 연결 —
// 항상 해당 지역/이름의 실제 카페로 정확히 도달(추후 직접 cafe.naver.com URL 로 교체 가능).
function openCafe(query: string) {
  const url = `https://m.search.naver.com/search.naver?query=${encodeURIComponent(query + ' 맘카페')}`;
  Linking.openURL(url).catch(() => {});
}

// 전국 인기 맘카페 (이름으로 검색 → 해당 카페가 최상단)
const FEATURED: { name: string; desc: string }[] = [
  { name: '맘스홀릭 베이비', desc: '국내 최대 임신·출산·육아 카페' },
  { name: '맘이베베', desc: '임신 준비부터 육아까지' },
  { name: '레몬테라스', desc: '살림·인테리어·육아 정보' },
];

// 권역별 지역 맘카페
const REGIONS: { group: string; items: string[] }[] = [
  { group: '서울', items: ['강남', '서초', '송파', '강동', '노원', '강서', '마포', '은평'] },
  { group: '경기·인천', items: ['분당', '판교', '일산', '동탄', '수원', '용인', '평촌', '광교', '부천', '인천', '김포', '하남'] },
  { group: '영남', items: ['부산', '대구', '울산', '창원', '김해', '포항', '진주', '경주'] },
  { group: '호남', items: ['광주', '전주', '여수', '순천', '목포', '익산'] },
  { group: '충청', items: ['대전', '세종', '청주', '천안', '아산', '충주'] },
  { group: '강원·제주', items: ['춘천', '원주', '강릉', '속초', '제주', '서귀포'] },
];

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
            <Text style={styles.introSub}>전국 각지의 맘카페를 한 곳에서. 눌러서 바로 이동하세요.</Text>
          </View>
        </View>

        {/* 전국 인기 */}
        <Text style={styles.sectionTitle}>전국 인기 맘카페</Text>
        <View style={styles.featuredWrap}>
          {FEATURED.map((f) => (
            <TouchableOpacity key={f.name} style={styles.featuredCard} activeOpacity={0.85} onPress={() => openCafe(f.name)}>
              <View style={styles.featuredIcon}>
                <Ionicons name="heart" size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featuredName}>{f.name}</Text>
                <Text style={styles.featuredDesc} numberOfLines={1}>{f.desc}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={COLORS.ink[400]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 권역별 */}
        <Text style={styles.sectionTitle}>지역별 맘카페</Text>
        {REGIONS.map((r) => (
          <View key={r.group} style={styles.regionBlock}>
            <Text style={styles.regionGroup}>{r.group}</Text>
            <View style={styles.chipWrap}>
              {r.items.map((city) => (
                <TouchableOpacity key={city} style={styles.chip} activeOpacity={0.8} onPress={() => openCafe(city)}>
                  <Text style={styles.chipText}>{city}맘</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.foot}>
          찾는 지역이 없나요? 위 지역을 눌러 네이버 카페에서 더 많은 맘카페를 만나보세요.
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

  featuredWrap: { paddingHorizontal: SPACING.xl, gap: 10 },
  featuredCard: {
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
  featuredIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: QM.coralSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  featuredName: { fontSize: 15, fontWeight: '700', color: QM.ink },
  featuredDesc: { fontSize: 12, color: COLORS.ink[500], marginTop: 2 },

  regionBlock: { paddingHorizontal: SPACING.xl, marginBottom: 18 },
  regionGroup: { fontSize: 13, fontWeight: '700', color: COLORS.ink[700], marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: QM.card,
    borderWidth: 1,
    borderColor: QM.hairline,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: COLORS.ink[700] },

  foot: {
    paddingHorizontal: SPACING.xl, marginTop: 8,
    fontSize: 12, color: COLORS.ink[400], lineHeight: 18,
  },
});
