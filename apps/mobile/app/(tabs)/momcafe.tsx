import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Linking,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SPACING, QM } from '../../src/constants/theme';
import { getMomCafes, type MomCafe } from '../../src/api/momcafe';

type LocationInfo = {
  area: string;
};

function formatLocationAddress(place: Location.LocationGeocodedAddress | null | undefined) {
  if (!place) return '주소 확인 중';
  return [place.region, place.city, place.district, place.street]
    .filter(Boolean)
    .join(' ') || '주소 확인 중';
}

function openCafe(url: string) {
  Linking.openURL(url).catch(() => {});
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), ms);
    }),
  ]);
}

function CafeRow({ c }: { c: MomCafe }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => openCafe(c.url)}>
      <View style={styles.cardIcon}>
        <Ionicons name="heart" size={18} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{c.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={1}>{c.region} · {c.desc}</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={COLORS.ink[400]} />
    </TouchableOpacity>
  );
}

export default function MomCafeScreen() {
  const [cafes, setCafes] = useState<MomCafe[]>([]);
  const [searchResults, setSearchResults] = useState<MomCafe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cafesLoading, setCafesLoading] = useState(true);
  const [cafesError, setCafesError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [locationMessage, setLocationMessage] = useState('현재 위치를 확인하고 있어요.');

  async function loadCafes(region?: string) {
    try {
      setCafesLoading(true);
      const data = await getMomCafes({
        region,
        limit: 2,
      });
      setCafes(data.items || []);
      setCafesError('');
    } catch {
      setCafesError('맘카페 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setCafesLoading(false);
    }
  }

  async function searchCafes() {
    try {
      setHasSearched(true);
      setSearchLoading(true);
      const data = await getMomCafes({
        region: locationInfo?.area,
        q: searchQuery.trim(),
      });
      setSearchResults(data.items || []);
      setSearchError('');
    } catch {
      setSearchError('검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSearchLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadLocationAndCafes() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          if (!mounted) return;
          setLocationMessage('위치 권한이 필요해요. 기기 설정에서 위치 권한을 허용해 주세요.');
          await loadCafes();
          return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          if (!mounted) return;
          setLocationMessage('위치 서비스가 꺼져 있어요. 기기 설정에서 위치 서비스를 켜 주세요.');
          await loadCafes();
          return;
        }

        const position =
          (await Location.getLastKnownPositionAsync({ maxAge: 300000, requiredAccuracy: 3000 })) ??
          (await withTimeout(
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest }),
            7000,
          ));

        if (!position) {
          if (!mounted) return;
          setLocationMessage('현재 위치 신호를 기다리고 있어요. 에뮬레이터 위치를 지정한 뒤 다시 열어 주세요.');
          await loadCafes();
          return;
        }

        const { latitude, longitude } = position.coords;
        const [place] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
        const area = formatLocationAddress(place);

        if (!mounted) return;
        setLocationInfo({
          area,
        });
        setLocationMessage('');
        await loadCafes(area);
      } catch {
        if (!mounted) return;
        setLocationMessage('현재 위치를 확인할 수 없어요. 위치 서비스를 켜고 다시 시도해 주세요.');
        await loadCafes();
      }
    }

    loadLocationAndCafes();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={QM.pageBg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>맘카페</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>현재 위치 기준 맘카페</Text>
        {cafesLoading ? (
          <Text style={styles.messageText}>맘카페 목록을 불러오고 있어요.</Text>
        ) : cafesError ? (
          <Text style={styles.messageText}>{cafesError}</Text>
        ) : cafes.length === 0 ? (
          <Text style={styles.messageText}>검색 결과가 없어요.</Text>
        ) : (
          <View style={styles.cardWrap}>
            {cafes.map((c) => <CafeRow key={c.url} c={c} />)}
          </View>
        )}

        <View style={styles.searchBox}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="지역이나 카페명을 검색해 보세요"
            placeholderTextColor={COLORS.ink[400]}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={COLORS.ink[400]} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.searchButton}
            activeOpacity={0.85}
            onPress={searchCafes}
          >
          <Ionicons name="search" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {hasSearched ? (
          <>
            <Text style={styles.sectionTitle}>검색 결과</Text>
            {searchLoading ? (
              <Text style={styles.messageText}>검색 결과를 불러오고 있어요.</Text>
            ) : searchError ? (
              <Text style={styles.messageText}>{searchError}</Text>
            ) : searchResults.length === 0 ? (
              <Text style={styles.messageText}>검색 결과가 없어요.</Text>
            ) : (
              <View style={styles.cardWrap}>
                {searchResults.map((c) => <CafeRow key={c.url} c={c} />)}
              </View>
            )}
          </>
        ) : null}

        <Text style={styles.foot}>
          각 카페를 누르면 네이버 카페로 바로 이동합니다. 회원 가입·등급은 카페 정책을 따릅니다.
        </Text>

        <View style={styles.locationBox}>
          <Ionicons name="location" size={17} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.locationTitle}>현재 위치</Text>
            {locationInfo ? (
              <Text style={styles.locationText}>{locationInfo.area}</Text>
            ) : (
              <Text style={styles.locationText}>{locationMessage}</Text>
            )}
          </View>
        </View>

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
  headerTitle: { fontSize: 20, fontWeight: '800', color: QM.ink },

  searchBox: {
    marginHorizontal: SPACING.xl,
    marginTop: 8,
    marginBottom: 6,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: QM.card,
    borderWidth: 1,
    borderColor: QM.hairline,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: QM.ink,
    paddingVertical: 10,
  },
  searchButton: {
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },

  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: QM.ink,
    paddingHorizontal: SPACING.xl, marginTop: 26, marginBottom: 12,
  },

  cardWrap: { paddingHorizontal: SPACING.xl, gap: 10 },
  messageText: {
    paddingHorizontal: SPACING.xl,
    fontSize: 13,
    color: COLORS.ink[500],
    lineHeight: 18,
  },
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

  locationBox: {
    marginHorizontal: SPACING.xl,
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: QM.card,
    borderWidth: 1,
    borderColor: QM.hairline,
    flexDirection: 'row',
    gap: 10,
  },
  locationTitle: { fontSize: 12, fontWeight: '800', color: COLORS.ink[700], marginBottom: 3 },
  locationText: { fontSize: 13, fontWeight: '700', color: QM.ink, lineHeight: 18 },

  foot: {
    paddingHorizontal: SPACING.xl, marginTop: 8,
    fontSize: 12, color: COLORS.ink[400], lineHeight: 18,
  },
});
