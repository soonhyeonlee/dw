import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS, QM } from '../../../src/constants/theme';
import {
  getMarketOrder,
  cancelMarketOrder,
  type MarketOrderItem,
  type OrderStatus,
} from '../../../src/api/market';
import { useAuth } from '../../../src/contexts/AuthContext';

const PURPLE = QM.coral;

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

// 배송 시작 전 — 사용자 취소 가능.
const CANCELABLE: OrderStatus[] = ['pending', 'paid'];

export default function MarketOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshProfile } = useAuth();

  const [order, setOrder] = useState<MarketOrderItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getMarketOrder(id!);
      setOrder(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = () => {
    Alert.alert('주문 취소', '이 주문을 취소하시겠습니까?\n사용한 포인트는 환급되고 적립은 회수됩니다.', [
      { text: '닫기', style: 'cancel' },
      {
        text: '주문 취소',
        style: 'destructive',
        onPress: async () => {
          setCanceling(true);
          try {
            const updated = await cancelMarketOrder(id!);
            setOrder(updated);
            await refreshProfile(); // 포인트 환급/회수 반영
            Alert.alert('취소 완료', '주문이 취소되었습니다');
          } catch (e: any) {
            Alert.alert('취소 실패', e?.message || '주문 취소 중 오류가 발생했습니다');
          } finally {
            setCanceling(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>주문 정보를 불러올 수 없습니다</Text>
      </View>
    );
  }

  const status = order.status as OrderStatus;
  const cancelable = CANCELABLE.includes(status);
  const totalPrice = Number(order.totalPrice);
  const usedPoint = Number(order.usedPoint) || 0;
  const pointEarned = Number(order.pointEarned) || 0;
  const payable = totalPrice - usedPoint;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>주문 상세</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 상태 */}
        <View style={styles.statusBox}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[status] || COLORS.gray[500] }]}>
            {STATUS_LABEL[status] || status}
          </Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)} 주문</Text>
          {order.trackingNumber ? (
            <Text style={styles.tracking}>운송장번호 {order.trackingNumber}</Text>
          ) : null}
        </View>

        {/* 상품 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주문 상품</Text>
          <TouchableOpacity
            style={styles.productRow}
            activeOpacity={0.8}
            onPress={() => order.product && router.push(`/market/${order.product.id}`)}
          >
            {order.product?.imageUrl ? (
              <Image source={{ uri: order.product.imageUrl }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={styles.thumb}>
                <Text style={{ fontSize: 28 }}>📦</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {order.product?.title || '상품'}
              </Text>
              <Text style={styles.qty}>수량 {order.quantity}개</Text>
              <Text style={styles.productPrice}>{totalPrice.toLocaleString()}원</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
          </TouchableOpacity>
        </View>

        {/* 배송지 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>배송지</Text>
          <InfoRow label="받는 분" value={order.recipientName || '-'} />
          <InfoRow label="연락처" value={order.recipientPhone || '-'} />
          <InfoRow
            label="주소"
            value={
              [order.zipCode && `(${order.zipCode})`, order.address, order.addressDetail]
                .filter(Boolean)
                .join(' ') || '-'
            }
          />
          {order.deliveryMemo ? <InfoRow label="배송 메모" value={order.deliveryMemo} /> : null}
        </View>

        {/* 결제 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 정보</Text>
          <SummaryRow label="상품 금액" value={`${totalPrice.toLocaleString()}원`} />
          {usedPoint > 0 && (
            <SummaryRow label="포인트 사용" value={`-${usedPoint.toLocaleString()}원`} accent />
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.payLabel}>최종 결제 금액</Text>
            <Text style={styles.payValue}>{payable.toLocaleString()}원</Text>
          </View>
          {pointEarned > 0 && (
            <Text style={styles.earnHint}>
              {status === 'cancelled' || status === 'refunded'
                ? `${pointEarned.toLocaleString()}P 적립 회수됨`
                : `${pointEarned.toLocaleString()}P 적립 (번개장터 전용)`}
            </Text>
          )}
        </View>

        <View style={{ height: cancelable ? 110 : SPACING.xl }} />
      </ScrollView>

      {/* 취소 CTA */}
      {cancelable && (
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + SPACING.md }]}>
          <TouchableOpacity
            style={[styles.cancelBtn, canceling && { opacity: 0.6 }]}
            onPress={handleCancel}
            disabled={canceling}
            activeOpacity={0.85}
          >
            {canceling ? (
              <ActivityIndicator color={COLORS.error} />
            ) : (
              <Text style={styles.cancelBtnText}>주문 취소</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, accent && { color: PURPLE }]}>{value}</Text>
    </View>
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
  container: { flex: 1, backgroundColor: QM.pageBg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: QM.pageBg,
  },
  errorText: { color: COLORS.gray[500], fontSize: FONT.sizes.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: QM.hairline,
  },
  headerTitle: { fontSize: FONT.sizes.lg, fontWeight: '800', color: QM.ink },

  statusBox: {
    backgroundColor: QM.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderRadius: 18,
    ...QM.cardShadow,
  },
  statusText: { fontSize: FONT.sizes.xl, fontWeight: '900' },
  orderDate: { fontSize: FONT.sizes.sm, color: COLORS.gray[500], marginTop: SPACING.xs },
  tracking: { fontSize: FONT.sizes.sm, color: COLORS.gray[700], marginTop: SPACING.sm },

  section: {
    backgroundColor: QM.card,
    marginHorizontal: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: 18,
    ...QM.cardShadow,
  },
  sectionTitle: {
    fontSize: FONT.sizes.md,
    fontWeight: '800',
    color: QM.ink,
    marginBottom: SPACING.md,
  },

  productRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    backgroundColor: QM.coralSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productTitle: {
    fontSize: FONT.sizes.sm,
    fontWeight: '600',
    color: QM.ink,
    lineHeight: 19,
  },
  qty: { fontSize: FONT.sizes.xs, color: COLORS.gray[500], marginTop: 2 },
  productPrice: { fontSize: FONT.sizes.md, fontWeight: '800', color: COLORS.black, marginTop: 4 },

  infoRow: { flexDirection: 'row', paddingVertical: 5 },
  infoLabel: { width: 80, fontSize: FONT.sizes.sm, color: COLORS.gray[500] },
  infoValue: { flex: 1, fontSize: FONT.sizes.sm, color: QM.ink, fontWeight: '500' },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  summaryLabel: { fontSize: FONT.sizes.sm, color: COLORS.gray[600] },
  summaryValue: { fontSize: FONT.sizes.sm, fontWeight: '600', color: QM.ink },
  divider: { height: 1, backgroundColor: QM.hairline, marginVertical: SPACING.sm },
  payLabel: { fontSize: FONT.sizes.md, fontWeight: '800', color: QM.ink },
  payValue: { fontSize: FONT.sizes.lg, fontWeight: '900', color: PURPLE },
  earnHint: { fontSize: FONT.sizes.xs, color: COLORS.gray[500], marginTop: SPACING.sm },

  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: QM.hairline,
  },
  cancelBtn: {
    height: 52,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.error, fontSize: FONT.sizes.md, fontWeight: '800' },
});
