import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export interface PromoSlide {
  id: string;
  badge?: string;
  title: string;
  subtitle?: string;
  image?: any;        // require()'d 로컬 에셋 — 풀블리드 배너
  imageUrl?: string;  // 원격 이미지 (연한 배경, 레거시)
  bg?: [string, string];
  fg?: string;
  onPress?: () => void;
}

const SCREEN_W = Dimensions.get('window').width;
const SLIDE_W = SCREEN_W - SPACING.xl * 2;
const SLIDE_GAP = 10;
const AUTO_INTERVAL = 4500;

export function PromoCarousel({ slides }: { slides: PromoSlide[] }) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const userTouching = useRef(false);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      if (userTouching.current) return;
      const next = (active + 1) % slides.length;
      scrollRef.current?.scrollTo({ x: next * (SLIDE_W + SLIDE_GAP), animated: true });
      setActive(next);
    }, AUTO_INTERVAL);
    return () => clearInterval(t);
  }, [active, slides.length]);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (SLIDE_W + SLIDE_GAP));
    setActive(Math.max(0, Math.min(slides.length - 1, idx)));
  };

  if (!slides.length) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={SLIDE_W + SLIDE_GAP}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => { userTouching.current = true; }}
        onScrollEndDrag={() => { userTouching.current = false; }}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl }}
      >
        {slides.map((s, i) => {
          const hasImage = !!s.image;
          const fg = hasImage ? COLORS.ink[900] : (s.fg || COLORS.white);
          const bg = s.bg || [COLORS.primary, COLORS.primaryDark];
          const isLight = !hasImage && !!s.fg && s.fg !== COLORS.white;
          return (
            <TouchableOpacity
              key={s.id}
              activeOpacity={s.onPress ? 0.85 : 1}
              onPress={s.onPress}
              style={[styles.slide, { width: SLIDE_W, marginRight: i === slides.length - 1 ? 0 : SLIDE_GAP }]}
            >
              {hasImage ? (
                <Image source={s.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <>
                  <LinearGradient
                    colors={bg}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {s.imageUrl ? (
                    <Image source={{ uri: s.imageUrl }} style={styles.image} resizeMode="cover" />
                  ) : null}
                </>
              )}
              <View style={styles.content}>
                {s.badge ? (
                  <View style={[styles.badge, { backgroundColor: hasImage || isLight ? COLORS.white : 'rgba(255,255,255,0.22)' }]}>
                    <Text style={[styles.badgeText, { color: fg }]}>{s.badge}</Text>
                  </View>
                ) : null}
                <Text style={[styles.title, { color: fg }, hasImage && styles.imgText]} numberOfLines={hasImage ? 1 : 2}>{s.title}</Text>
                {s.subtitle ? (
                  <Text style={[styles.subtitle, { color: fg, opacity: 0.9 }, hasImage && styles.imgText]} numberOfLines={1}>{s.subtitle}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={fg} style={styles.chev} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === active && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  slide: {
    // 배너 이미지 비율(약 4:1)에 맞춰 풀배너가 잘리지 않게 표시.
    height: Math.round(SLIDE_W / 4),
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  image: { ...StyleSheet.absoluteFillObject, opacity: 0.18 },
  content: { gap: 4 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  title: {
    fontSize: 16, fontWeight: '800', letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 12, fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // 밝은 이미지 배너용 — 어두운 텍스트에 흰 글로우
  imgText: { textShadowColor: 'rgba(255,255,255,0.9)', textShadowRadius: 5 },
  chev: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -9,
    opacity: 0.85,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.ink[200],
  },
  dotActive: {
    width: 16,
    backgroundColor: COLORS.primary,
  },
});
