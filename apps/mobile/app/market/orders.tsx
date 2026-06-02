import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/constants/theme';
import { getMyOrders, type MarketOrderItem, type OrderStatus } from '../../src/api/market';

const PURPLE = '#6633CC';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  shipping: '배송 중',
  delivered: '배송 완료',
  cancelled: '취소됨',
  refunded: '환불됨',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: COLORS.gray[500],
  paid: PURPLE,
  shipping: COLORS.warning,
  delivered: COLORS.success,
  cancelled: COLORS.gray[400],
  refunded: COLORS.error,
};

export default function MarketOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<MarketOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMyOrders(1);
      setOrders(data.items || []);
    } catch {
      // error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>🧾</Text>
        <Text style={styles.emptyText}>주문 내역이 없습니다</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => router.replace('/market')}
        >
          <Text style={styles.shopBtnText}>번개장터 둘러보기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md }}
      data={orders}
      keyExtractor={(o) => o.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PURPLE} />}
      renderItem={({ item }) => {
        const status = item.status as OrderStatus;
        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => item.product && router.push(`/market/${item.product.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              <Text style={[styles.status, { color: STATUS_COLOR[status] || COLORS.gray[500] }]}>
                {STATUS_LABEL[status] || status}
              </Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.thumb}>
                <Text style={{ fontSize: 26 }}>📦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={2}>
                  {item.product?.title || '상품'}
                </Text>
                <Text style={styles.qty}>수량 {item.quantity}개</Text>
                <Text style={styles.price}>{Number(item.totalPrice).toLocaleString()}원</Text>
              </View>
            </View>

            {(Number(item.usedPoint) > 0 || Number(item.pointEarned) > 0) && (
              <View style={styles.pointRow}>
                {Number(item.usedPoint) > 0 && (
                  <Text style={styles.pointUsed}>
                    포인트 {Number(item.usedPoint).toLocaleString()}P 사용
                  </Text>
                )}
                {Number(item.pointEarned) > 0 && (
                  <Text style={styles.pointEarn}>
                    {Number(item.pointEarned).toLocaleString()}P 적립
                  </Text>
                )}
              </View>
            )}

            {item.trackingNumber ? (
              <Text style={styles.tracking}>운송장 {item.trackingNumber}</Text>
            ) : null}
          </TouchableOpacity>
        );
      }}
    />
  );
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
  },
  emptyText: { fontSize: FONT.sizes.md, color: COLORS.gray[500], marginBottom: SPACING.xl },
  shopBtn: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    backgroundColor: PURPLE,
    borderRadius: RADIUS.lg,
  },
  shopBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT.sizes.sm },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  date: { fontSize: FONT.sizes.xs, color: COLORS.gray[500] },
  status: { fontSize: FONT.sizes.sm, fontWeight: '800' },

  cardBody: { flexDirection: 'row', gap: SPACING.md },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    backgroundColor: PURPLE + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.gray[900], lineHeight: 19 },
  qty: { fontSize: FONT.sizes.xs, color: COLORS.gray[500], marginTop: 2 },
  price: { fontSize: FONT.sizes.md, fontWeight: '800', color: COLORS.black, marginTop: 4 },

  pointRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  pointUsed: { fontSize: FONT.sizes.xs, color: COLORS.gray[600], fontWeight: '600' },
  pointEarn: { fontSize: FONT.sizes.xs, color: PURPLE, fontWeight: '700' },

  tracking: { fontSize: FONT.sizes.xs, color: COLORS.gray[600], marginTop: SPACING.sm },
});
