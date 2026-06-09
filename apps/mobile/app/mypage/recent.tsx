import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS, QM } from '../../src/constants/theme';
import ProductCard from '../../src/components/ProductCard';
import { getRecentlyViewed } from '../../src/api/products';

export default function RecentScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getRecentlyViewed();
      setProducts(data?.items || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="time-outline" size={48} color={COLORS.gray[300]} />
        <Text style={styles.emptyText}>최근 본 상품이 없습니다</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={products}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.listContent}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ProductCard {...item} onPress={(id) => router.push(`/product/${id}`)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: QM.pageBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md, backgroundColor: QM.pageBg },
  emptyText: { fontSize: FONT.sizes.md, color: QM.sub },
  row: { justifyContent: 'space-between', paddingHorizontal: SPACING.lg },
  listContent: { paddingTop: SPACING.md, paddingBottom: SPACING.xxxl },
});
