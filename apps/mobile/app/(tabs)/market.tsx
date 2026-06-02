import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../src/constants/theme';
import {
  MarketContent,
  type MarketContentHandle,
} from '../../src/components/home/MarketContent';

export default function MarketScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const marketRef = useRef<MarketContentHandle>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await marketRef.current?.reload();
    setRefreshing(false);
  }, []);

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
          <View>
            <Text style={styles.title}>번개장터</Text>
            <Text style={styles.subtitle}>더블윈 산지직송 위탁판매</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/market/search')}>
            <Ionicons name="search-outline" size={24} color={COLORS.ink[800]} />
          </TouchableOpacity>
        </View>

        <MarketContent ref={marketRef} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.ink[900], letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: COLORS.ink[500], marginTop: 2, fontWeight: '500' },
  iconBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
