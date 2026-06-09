import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, QM } from '../../src/constants/theme';
import {
  RegionContent,
  type RegionContentHandle,
} from '../../src/components/home/RegionContent';

const LOCATION_OPTIONS = ['서울 강남구', '서울 서초구', '서울 송파구', '서울 마포구', '경기 성남시 분당구'];

function showActionSheet(title: string, options: string[], onPick: (idx: number) => void) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        options: [...options, '취소'],
        cancelButtonIndex: options.length,
      },
      (idx) => {
        if (idx >= 0 && idx < options.length) onPick(idx);
      },
    );
    return;
  }
  Alert.alert(
    title,
    undefined,
    [
      ...options.map((label, idx) => ({ text: label, onPress: () => onPick(idx) })),
      { text: '취소', style: 'cancel' as const },
    ],
  );
}

export default function RegionScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(LOCATION_OPTIONS[0]);
  const regionRef = useRef<RegionContentHandle>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await regionRef.current?.reload();
    setRefreshing(false);
  }, []);

  const handlePickLocation = () => {
    showActionSheet('지역 선택', LOCATION_OPTIONS, (idx) => setLocation(LOCATION_OPTIONS[idx]));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Header */}
        <View style={styles.topbar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>우리지역</Text>
            <TouchableOpacity style={styles.locRow} onPress={handlePickLocation} activeOpacity={0.7}>
              <Ionicons name="location" size={14} color={COLORS.primary} />
              <Text style={styles.loc}>{location}</Text>
              <Ionicons name="chevron-down" size={14} color={COLORS.ink[500]} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/search')}>
            <Ionicons name="search-outline" size={22} color={COLORS.ink[800]} />
          </TouchableOpacity>
        </View>

        <RegionContent ref={regionRef} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: QM.pageBg },
  container: { flex: 1, backgroundColor: QM.pageBg },

  topbar: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 6,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '800', color: QM.ink, letterSpacing: -0.5 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-start' },
  loc: { fontSize: 13, color: QM.ink, fontWeight: '600' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: QM.card,
    ...QM.cardShadow,
  },
});
