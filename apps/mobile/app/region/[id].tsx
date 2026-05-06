import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { MOCK_ACADEMIES, MOCK_COUPONS, type MockAcademy } from '../../src/mock/feed';
import { useAuth } from '../../src/contexts/AuthContext';

const { width } = Dimensions.get('window');

type Tab = 'info' | 'review' | 'coupon';

type ReviewSeed = {
  id: string;
  nickname: string;
  rating: number;
  body: string;
  date: string;
  isMomCafe?: boolean;
};

const REVIEWS: ReviewSeed[] = [
  {
    id: 'rv1',
    nickname: '강남맘',
    rating: 5,
    body: '아이가 처음 다녀봤는데 선생님이 너무 친절하시고 시범도 잘 보여주세요. 체험수업 후 바로 등록했어요.',
    date: '2026.04.22',
    isMomCafe: true,
  },
  {
    id: 'rv2',
    nickname: '도윤맘',
    rating: 4,
    body: '셔틀이 있어서 너무 편하고 소수정예라 관리가 잘 되는 것 같아요. 시설은 평범한 편.',
    date: '2026.04.18',
    isMomCafe: true,
  },
  {
    id: 'rv3',
    nickname: '민준아빠',
    rating: 5,
    body: '아이가 가장 좋아하는 학원. 운동량도 적당하고 예의 교육도 시켜주셔서 감사해요.',
    date: '2026.04.15',
  },
];

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color="#F59E0B"
        />
      ))}
    </View>
  );
}

export default function AcademyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('info');
  const [hearted, setHearted] = useState(false);

  const academy: MockAcademy | undefined = MOCK_ACADEMIES.find((a) => a.id === id);
  const academyCoupons = academy
    ? MOCK_COUPONS.filter((c) => c.category === academy.category)
    : [];
  const momCafeViews = academy ? Math.round(academy.viewCount * 0.42) : 0;
  const generalViews = academy ? academy.viewCount - momCafeViews : 0;

  if (!academy) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Ionicons name="school-outline" size={48} color={COLORS.ink[300]} />
          <Text style={styles.emptyText}>학원 정보를 찾을 수 없습니다</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.back()}>
            <Text style={styles.emptyBtnText}>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleHeart = () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '관심 등록은 로그인 후 이용할 수 있습니다.');
      return;
    }
    setHearted((v) => !v);
  };

  const handleConsult = () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '문의는 로그인 후 이용할 수 있습니다.');
      return;
    }
    Alert.alert('상담 신청', `${academy.name}에 상담 신청이 접수되었습니다.`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Floating top bar */}
      <SafeAreaView style={styles.floatBar} edges={['top']} pointerEvents="box-none">
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.roundBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={COLORS.ink[900]} />
          </TouchableOpacity>
          <View style={styles.rightActions}>
            <TouchableOpacity style={styles.roundBtn}>
              <Ionicons name="share-outline" size={20} color={COLORS.ink[900]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.roundBtn}>
              <Ionicons name="ellipsis-vertical" size={20} color={COLORS.ink[900]} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        {/* Hero image */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: academy.thumbnail }} style={styles.heroImg} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{academy.category}</Text>
          </View>
        </View>

        {/* Header info */}
        <View style={styles.header}>
          <Text style={styles.name}>{academy.name}</Text>
          <View style={styles.addrRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.ink[500]} />
            <Text style={styles.addr}>{academy.address}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={styles.statTopRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.statValue}>{academy.rating}</Text>
              </View>
              <Text style={styles.statLabel}>리뷰 {academy.reviewCount}</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statTopRow}>
                <Ionicons name="eye-outline" size={14} color={COLORS.ink[700]} />
                <Text style={styles.statValue}>{academy.viewCount.toLocaleString()}</Text>
              </View>
              <Text style={styles.statLabel}>일반 {generalViews.toLocaleString()} · 맘카페 {momCafeViews.toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statTopRow}>
                <Ionicons name="heart" size={14} color={COLORS.primary} />
                <Text style={styles.statValue}>{academy.heartCount}</Text>
              </View>
              <Text style={styles.statLabel}>관심 등록</Text>
            </View>
          </View>

          <View style={styles.tagRow}>
            {academy.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Segmented tabs */}
        <View style={styles.segment}>
          {([
            { k: 'info' as const,   l: '학원 정보' },
            { k: 'review' as const, l: `리뷰 ${academy.reviewCount}` },
            { k: 'coupon' as const, l: `쿠폰 ${academyCoupons.length}` },
          ]).map((s) => (
            <TouchableOpacity
              key={s.k}
              style={[styles.segItem, tab === s.k && styles.segItemActive]}
              onPress={() => setTab(s.k)}
            >
              <Text style={[styles.segText, tab === s.k && styles.segTextActive]}>{s.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'info' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>소개</Text>
            <Text style={styles.bodyText}>
              {academy.name}은 {academy.address}에 위치한 {academy.category} 전문 교육기관입니다.
              {'\n\n'}
              풍부한 경력의 강사진과 체계적인 커리큘럼을 통해 수강생 한 명 한 명의 성장에 집중합니다.
              체험 수업을 통해 부담 없이 분위기를 확인할 수 있습니다.
            </Text>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>운영 시간</Text>
            <View style={styles.kvList}>
              <Row k="평일" v="14:00 - 22:00" />
              <Row k="주말" v="10:00 - 18:00" />
              <Row k="휴무" v="공휴일" />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>위치</Text>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={32} color={COLORS.ink[400]} />
              <Text style={styles.mapText}>{academy.address}</Text>
            </View>
          </View>
        )}

        {tab === 'review' && (
          <View style={styles.section}>
            <View style={styles.reviewHead}>
              <View>
                <Text style={styles.bigRating}>{academy.rating}</Text>
                <StarRow rating={academy.rating} size={16} />
                <Text style={styles.reviewCount}>리뷰 {academy.reviewCount}개</Text>
              </View>
              <TouchableOpacity
                style={styles.writeBtn}
                onPress={() => Alert.alert('리뷰 작성', '준비 중입니다.')}
              >
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                <Text style={styles.writeText}>리뷰 작성</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reviewList}>
              {REVIEWS.map((r) => (
                <View key={r.id} style={styles.reviewItem}>
                  <View style={styles.reviewTop}>
                    <View style={styles.reviewAvatar}>
                      <Ionicons name="person" size={16} color={COLORS.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.reviewNameRow}>
                        <Text style={styles.reviewName}>{r.nickname}</Text>
                        {r.isMomCafe && (
                          <View style={styles.momBadge}>
                            <Text style={styles.momBadgeText}>맘카페</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.reviewMeta}>
                        <StarRow rating={r.rating} size={12} />
                        <Text style={styles.reviewDate}>{r.date}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewBody}>{r.body}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 'coupon' && (
          <View style={styles.section}>
            {academyCoupons.length === 0 ? (
              <View style={styles.emptyCoupon}>
                <Ionicons name="ticket-outline" size={36} color={COLORS.ink[300]} />
                <Text style={styles.emptyText}>등록된 쿠폰이 없습니다</Text>
              </View>
            ) : (
              academyCoupons.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.couponCard}
                  onPress={() => Alert.alert('쿠폰 다운로드', `${c.title} 쿠폰이 다운로드되었습니다.`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.couponLeftBar} />
                  <View style={{ flex: 1, padding: 14, gap: 4 }}>
                    <View style={styles.couponTypeBadge}>
                      <Text style={styles.couponTypeText}>{c.couponType}</Text>
                    </View>
                    <Text style={styles.couponTitle}>{c.title}</Text>
                    <Text style={styles.couponMeta}>~ {c.expireAt} · 잔여 {c.remainingQuantity}매</Text>
                  </View>
                  <View style={styles.couponRight}>
                    <Text style={styles.couponValue}>{c.value}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBarWrap}>
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.heartBtn} onPress={toggleHeart}>
            <Ionicons
              name={hearted ? 'heart' : 'heart-outline'}
              size={24}
              color={hearted ? COLORS.primary : COLORS.ink[700]}
            />
            <Text style={[styles.heartCount, hearted && { color: COLORS.primary }]}>
              {academy.heartCount + (hearted ? 1 : 0)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={() => Alert.alert('전화 연결', '준비 중입니다.')}>
            <Ionicons name="call-outline" size={20} color={COLORS.ink[800]} />
            <Text style={styles.callText}>전화</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.consultBtn} onPress={handleConsult} activeOpacity={0.9}>
            <Text style={styles.consultText}>상담 신청</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvKey}>{k}</Text>
      <Text style={styles.kvVal}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },

  floatBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topbar: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightActions: { flexDirection: 'row', gap: 8 },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },

  heroWrap: { width, height: 240, position: 'relative' },
  heroImg: { width: '100%', height: '100%', backgroundColor: COLORS.ink[100] },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  catBadge: {
    position: 'absolute', bottom: 16, left: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6,
  },
  catBadgeText: { fontSize: 11, color: COLORS.white, fontWeight: '800' },

  header: { paddingHorizontal: SPACING.xl, paddingTop: 20, gap: 6 },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.3 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addr: { fontSize: 13, color: COLORS.ink[600] },

  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.md,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statTopRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statValue: { fontSize: 14, fontWeight: '800', color: COLORS.ink[900] },
  statLabel: { fontSize: 10, color: COLORS.ink[500], textAlign: 'center', paddingHorizontal: 4 },

  tagRow: { flexDirection: 'row', gap: 6, marginTop: 14, flexWrap: 'wrap', paddingBottom: 4 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: COLORS.ink[100] },
  tagText: { fontSize: 11, color: COLORS.ink[700], fontWeight: '600' },

  divider: { height: 8, backgroundColor: COLORS.ink[50], marginTop: 20 },

  segment: {
    marginHorizontal: SPACING.xl,
    marginTop: 16,
    flexDirection: 'row',
    backgroundColor: COLORS.ink[100],
    borderRadius: 10,
    padding: 4,
  },
  segItem: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segItemActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[500] },
  segTextActive: { color: COLORS.ink[900], fontWeight: '700' },

  section: { paddingHorizontal: SPACING.xl, paddingVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink[900], marginBottom: 8 },
  bodyText: { fontSize: 13, color: COLORS.ink[700], lineHeight: 20 },

  kvList: { gap: 10 },
  kvRow: { flexDirection: 'row', alignItems: 'center' },
  kvKey: { width: 60, fontSize: 13, color: COLORS.ink[500], fontWeight: '500' },
  kvVal: { flex: 1, fontSize: 13, color: COLORS.ink[800], fontWeight: '600' },

  mapPlaceholder: {
    height: 140,
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    gap: 6,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  mapText: { fontSize: 12, color: COLORS.ink[600] },

  reviewHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  bigRating: { fontSize: 32, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.5 },
  reviewCount: { fontSize: 12, color: COLORS.ink[500], marginTop: 4 },
  writeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.primarySoft,
    backgroundColor: COLORS.primarySoft,
  },
  writeText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },

  reviewList: { gap: 16 },
  reviewItem: {
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
  },
  reviewTop: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.ink[700],
    alignItems: 'center', justifyContent: 'center',
  },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewName: { fontSize: 13, fontWeight: '700', color: COLORS.ink[900] },
  momBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#EEEEFF',
  },
  momBadgeText: { fontSize: 9, fontWeight: '800', color: '#6161FF' },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  reviewDate: { fontSize: 11, color: COLORS.ink[500] },
  reviewBody: { fontSize: 13, color: COLORS.ink[700], lineHeight: 19 },

  couponCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.divider,
    overflow: 'hidden',
    marginBottom: 12,
  },
  couponLeftBar: { width: 4, backgroundColor: COLORS.primary },
  couponTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  couponTypeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  couponTitle: { fontSize: 14, fontWeight: '700', color: COLORS.ink[900] },
  couponMeta: { fontSize: 11, color: COLORS.ink[500], marginTop: 4 },
  couponRight: {
    width: 100,
    borderLeftWidth: 1, borderLeftColor: COLORS.divider, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.ink[50],
  },
  couponValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary, letterSpacing: -0.3 },

  emptyCoupon: { alignItems: 'center', paddingVertical: 40, gap: 8 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  emptyText: { fontSize: 13, color: COLORS.ink[500] },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.ink[100], borderRadius: RADIUS.md },
  emptyBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[800] },

  bottomBarWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.divider,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  heartBtn: {
    width: 60, height: 52,
    alignItems: 'center', justifyContent: 'center',
    gap: 2,
  },
  heartCount: { fontSize: 11, color: COLORS.ink[700], fontWeight: '600' },
  callBtn: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.ink[200],
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  callText: { fontSize: 14, fontWeight: '700', color: COLORS.ink[800] },
  consultBtn: {
    flex: 1,
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  consultText: { color: COLORS.white, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
});
