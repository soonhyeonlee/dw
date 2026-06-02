import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { getAcademy, getCoupons, downloadCoupon, type Academy, type Coupon } from '../../src/api/region';
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

const ICON_TINT = {
  blue:   { bg: '#EAF2FE', fg: '#1673E8' },
  green:  { bg: '#E5F6EB', fg: '#118658' },
  orange: { bg: COLORS.primarySoft, fg: COLORS.primary },
} as const;

const CHANNELS: {
  key: 'kakao' | 'instagram' | 'facebook' | 'band';
  label: string;
  icon: any;
  bg: string;
  fg: string;
}[] = [
  { key: 'kakao',     label: '카톡문의',  icon: 'chatbubble-ellipses', bg: '#FAE100', fg: '#3C1E1E' },
  { key: 'instagram', label: '인스타그램', icon: 'logo-instagram',      bg: '#E4405F', fg: '#FFFFFF' },
  { key: 'facebook',  label: '페이스북',   icon: 'logo-facebook',       bg: '#1877F2', fg: '#FFFFFF' },
  { key: 'band',      label: '밴드',       icon: 'people',              bg: '#03C75A', fg: '#FFFFFF' },
];

function openUrl(url?: string) {
  if (!url) return;
  Linking.openURL(url).catch(() => Alert.alert('열기 실패', '링크를 열 수 없습니다.'));
}

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

function RoundBtn({ icon, onPress }: { icon: any; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.roundBtn} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={20} color={COLORS.ink[900]} />
    </TouchableOpacity>
  );
}

function DetailRow({
  icon,
  tint,
  label,
  action,
  actionIcon = 'map-outline',
  onAction,
}: {
  icon: any;
  tint: keyof typeof ICON_TINT;
  label: string;
  action?: string;
  actionIcon?: any;
  onAction?: () => void;
}) {
  const t = ICON_TINT[tint];
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={14} color={t.fg} />
      </View>
      <Text style={styles.detailText} numberOfLines={2}>{label}</Text>
      {action ? (
        <TouchableOpacity style={styles.detailAction} onPress={onAction} activeOpacity={0.7}>
          <Ionicons name={actionIcon} size={13} color={COLORS.primary} />
          <Text style={styles.detailActionText}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function AcademyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleDownloadCoupon = async (c: Coupon) => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '쿠폰을 받으려면 로그인이 필요합니다', [
        { text: '취소' },
        { text: '로그인', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }
    try {
      await downloadCoupon(c.id);
      Alert.alert('쿠폰 다운로드', `'${c.title}' 쿠폰을 받았어요. 쿠폰함에서 확인하세요.`);
    } catch (e: any) {
      Alert.alert('다운로드 실패', e?.message || '쿠폰을 받지 못했습니다.');
    }
  };

  const [tab, setTab] = useState<Tab>('info');
  const [hearted, setHearted] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  const [academy, setAcademy] = useState<Academy | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const a = await getAcademy(String(id));
        if (!alive) return;
        setAcademy(a);
        const cp = await getCoupons(a.category ? { category: a.category } : undefined).catch(
          () => ({ items: [] as Coupon[] }),
        );
        if (alive) setCoupons((cp?.items as Coupon[]) || []);
      } catch {
        if (alive) setAcademy(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

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

  const academyCoupons = coupons;
  const momCafeViews = Math.round((academy.viewCount || 0) * 0.42);
  const generalViews = (academy.viewCount || 0) - momCafeViews;

  const photos = academy.photos && academy.photos.length ? academy.photos : [];
  const addr = academy.address || academy.region || '';
  const region = addr.split(' ')[1] || addr.split(' ')[0] || '우리지역';
  const liveViewers = 8 + ((academy.reviewCount || 0) % 30);
  const channels = CHANNELS.filter((c) => !!(academy.sns && academy.sns[c.key]));

  const onHeroScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / width));
  };

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

  const handleCall = () => {
    Linking.openURL(`tel:${(academy.phone || '').replace(/-/g, '')}`).catch(() =>
      Alert.alert('전화 연결 실패', `${academy.phone || ''} 로 직접 연락해 주세요.`),
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Floating top bar */}
      <SafeAreaView style={styles.floatBar} edges={['top']} pointerEvents="box-none">
        <View style={styles.topbar}>
          <View style={styles.topGroup}>
            <RoundBtn icon="chevron-back" onPress={() => router.back()} />
            <RoundBtn icon="home-outline" onPress={() => router.push('/(tabs)' as any)} />
          </View>
          <View style={styles.topGroup}>
            <RoundBtn icon="share-social-outline" />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
        {/* Hero — 사진 여러 장 스크롤 */}
        <View style={styles.heroWrap}>
          {photos.length ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onHeroScroll}
            >
              {photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.heroImg} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.heroImg, styles.heroEmpty]}>
              <Ionicons name="school-outline" size={52} color={COLORS.ink[300]} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            style={styles.heroShade}
            pointerEvents="none"
          />
          {photos.length > 1 ? (
            <View style={styles.heroDots} pointerEvents="none">
              {photos.map((_, i) => (
                <View key={i} style={[styles.heroDot, i === photoIdx && styles.heroDotActive]} />
              ))}
            </View>
          ) : null}
          <View style={styles.liveBadge} pointerEvents="none">
            <Text style={styles.liveBadgeText}>🔥 {liveViewers}명이 보고 있어요!</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.breadcrumb}>{region} | {academy.category}</Text>

          <View style={styles.titleRow}>
            <Text style={styles.name}>{academy.name}</Text>
            <TouchableOpacity style={styles.phoneBtn} onPress={handleCall} activeOpacity={0.8}>
              <Ionicons name="call" size={14} color={COLORS.ink[800]} />
              <Text style={styles.phoneBtnText}>전화</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.ratingRow} onPress={() => setTab('review')} activeOpacity={0.7}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={styles.ratingNum}>{academy.rating}</Text>
            <Text style={styles.ratingDot}>·</Text>
            <Text style={styles.ratingLink}>리뷰 {academy.reviewCount}개</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.ink[400]} />
          </TouchableOpacity>

          <Text style={styles.tagline}>{academy.category} 전문 · 체험수업 가능</Text>

          <View style={styles.detailList}>
            <DetailRow
              icon="location"
              tint="blue"
              label={addr || '주소 미등록'}
              action="지도"
              onAction={() => Alert.alert('지도', '지도 기능을 준비 중입니다.')}
            />
            <DetailRow
              icon="call"
              tint="orange"
              label={academy.phone || '전화번호 미등록'}
              action="전화"
              actionIcon="call-outline"
              onAction={handleCall}
            />
            <DetailRow
              icon="time-outline"
              tint="green"
              label="평일 14:00 - 22:00 · 주말 10:00 - 18:00"
            />
            <DetailRow
              icon="eye-outline"
              tint="orange"
              label={`일반 ${generalViews.toLocaleString()} · 맘카페 ${momCafeViews.toLocaleString()} 열람`}
            />
          </View>

          <View style={styles.chipRow}>
            {(academy.tags || []).map((t) => (
              <View key={t} style={styles.chip}>
                <Text style={styles.chipText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Underline tabs */}
        <View style={styles.tabBar}>
          {([
            { k: 'info' as const,   l: '학원 정보' },
            { k: 'review' as const, l: `리뷰 ${academy.reviewCount}` },
            { k: 'coupon' as const, l: `쿠폰 ${academyCoupons.length}` },
          ]).map((s) => {
            const active = tab === s.k;
            return (
              <TouchableOpacity
                key={s.k}
                style={styles.tabItem}
                onPress={() => setTab(s.k)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{s.l}</Text>
                {active ? <View style={styles.tabUnderline} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {tab === 'info' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>소개</Text>
            <Text style={styles.bodyText}>
              {academy.name}은 {academy.address}에 위치한 {academy.category} 전문 교육기관입니다.
              {'\n\n'}
              풍부한 경력의 강사진과 체계적인 커리큘럼을 통해 수강생 한 명 한 명의 성장에 집중합니다.
            </Text>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>수업 내용</Text>
            <Text style={styles.bodyText}>{academy.curriculum}</Text>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>안내 및 유의사항</Text>
            <View style={styles.noticeBox}>
              <Ionicons name="information-circle" size={16} color={COLORS.primary} style={{ marginTop: 1 }} />
              <Text style={styles.noticeText}>{academy.notice}</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>운영 시간</Text>
            <View style={styles.kvList}>
              <Row k="평일" v="14:00 - 22:00" />
              <Row k="주말" v="10:00 - 18:00" />
              <Row k="휴무" v="공휴일" />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>주차 안내</Text>
            <View style={styles.parkingRow}>
              <Ionicons name="car-outline" size={16} color={COLORS.ink[600]} />
              <Text style={styles.parkingText}>{academy.parking}</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>위치</Text>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={32} color={COLORS.ink[400]} />
              <Text style={styles.mapText}>{academy.address}</Text>
            </View>

            {channels.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>문의 및 채널</Text>
                <View style={styles.channelRow}>
                  {channels.map((c) => (
                    <TouchableOpacity
                      key={c.key}
                      style={styles.channelBtn}
                      onPress={() => openUrl(academy.sns ? academy.sns[c.key] : undefined)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.channelIcon, { backgroundColor: c.bg }]}>
                        <Ionicons name={c.icon} size={22} color={c.fg} />
                      </View>
                      <Text style={styles.channelLabel}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : null}
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
                  onPress={() => handleDownloadCoupon(c)}
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

      {/* Bottom: notice strip + action bar */}
      <View style={styles.bottomWrap}>
        <View style={styles.noticeStrip}>
          <Text style={styles.noticeStripText} numberOfLines={1}>
            🔥 최근 인기 급상승! 평점 {academy.rating}점 인기 학원이에요
          </Text>
        </View>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarSafe}>
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.heartBtn} onPress={toggleHeart}>
              <Ionicons
                name={hearted ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={hearted ? COLORS.primary : COLORS.ink[700]}
              />
              <Text style={[styles.heartCount, hearted && { color: COLORS.primary }]}>
                {academy.heartCount + (hearted ? 1 : 0)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Ionicons name="call-outline" size={20} color={COLORS.ink[800]} />
              <Text style={styles.callText}>전화</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.consultBtn} onPress={handleConsult} activeOpacity={0.9}>
              <Text style={styles.consultText}>상담 신청</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
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
  topGroup: { flexDirection: 'row', gap: 8 },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },

  heroWrap: { width, height: 280, position: 'relative' },
  heroImg: { width, height: 280, backgroundColor: COLORS.ink[100] },
  heroEmpty: { alignItems: 'center', justifyContent: 'center' },
  heroShade: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    height: 110,
  },
  heroDots: {
    position: 'absolute', bottom: 18, right: 18,
    flexDirection: 'row', gap: 5,
  },
  heroDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  heroDotActive: { backgroundColor: COLORS.white, width: 16 },
  liveBadge: {
    position: 'absolute', bottom: 16, left: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999,
  },
  liveBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.ink[900] },

  infoSection: { paddingHorizontal: SPACING.xl, paddingTop: 18 },
  breadcrumb: { fontSize: 12, color: COLORS.ink[500], fontWeight: '500' },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 12,
  },
  name: { flex: 1, fontSize: 22, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.4 },
  phoneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1, borderColor: COLORS.ink[200],
  },
  phoneBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.ink[800] },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  ratingNum: { fontSize: 14, fontWeight: '800', color: COLORS.ink[900] },
  ratingDot: { fontSize: 13, color: COLORS.ink[300], marginHorizontal: 2 },
  ratingLink: { fontSize: 13, fontWeight: '600', color: COLORS.ink[600] },

  tagline: { fontSize: 13, color: COLORS.ink[600], marginTop: 8 },

  detailList: { marginTop: 16, gap: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailIcon: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  detailText: { flex: 1, fontSize: 13, color: COLORS.ink[800], fontWeight: '500' },
  detailAction: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  detailActionText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },

  chipRow: { flexDirection: 'row', gap: 6, marginTop: 16, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.ink[50] },
  chipText: { fontSize: 11, color: COLORS.ink[600], fontWeight: '600' },

  divider: { height: 8, backgroundColor: COLORS.ink[50], marginTop: 20 },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink[100],
  },
  tabItem: { paddingVertical: 14, marginRight: 24, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.ink[400] },
  tabTextActive: { color: COLORS.ink[900], fontWeight: '800' },
  tabUnderline: {
    position: 'absolute',
    left: 0, right: 0, bottom: -1,
    height: 2.5,
    backgroundColor: COLORS.ink[900],
  },

  section: { paddingHorizontal: SPACING.xl, paddingVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink[900], marginBottom: 8 },
  bodyText: { fontSize: 13, color: COLORS.ink[700], lineHeight: 20 },

  noticeBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  noticeText: { flex: 1, fontSize: 12.5, color: COLORS.ink[700], lineHeight: 19 },

  kvList: { gap: 10 },
  kvRow: { flexDirection: 'row', alignItems: 'center' },
  kvKey: { width: 60, fontSize: 13, color: COLORS.ink[500], fontWeight: '500' },
  kvVal: { flex: 1, fontSize: 13, color: COLORS.ink[800], fontWeight: '600' },

  parkingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  parkingText: { flex: 1, fontSize: 13, color: COLORS.ink[700], lineHeight: 20 },

  mapPlaceholder: {
    height: 140,
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    gap: 6,
    borderWidth: 1, borderColor: COLORS.divider,
  },
  mapText: { fontSize: 12, color: COLORS.ink[600] },

  channelRow: { flexDirection: 'row', gap: 18, marginTop: 4 },
  channelBtn: { alignItems: 'center', gap: 6 },
  channelIcon: {
    width: 50, height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
  },
  channelLabel: { fontSize: 11, color: COLORS.ink[600], fontWeight: '600' },

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

  bottomWrap: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },
  noticeStrip: {
    backgroundColor: '#FFF4EE',
    paddingVertical: 9,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.primarySoft,
  },
  noticeStripText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  bottomBarSafe: {
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
    width: 56, height: 52,
    alignItems: 'center', justifyContent: 'center',
    gap: 2,
  },
  heartCount: { fontSize: 11, color: COLORS.ink[700], fontWeight: '700' },
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
