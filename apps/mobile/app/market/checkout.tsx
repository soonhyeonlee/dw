import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, SPACING, RADIUS } from '../../src/constants/theme';
import { getMarketProduct, createOrder, type MarketProduct } from '../../src/api/market';
import { useAuth } from '../../src/contexts/AuthContext';

const PURPLE = '#6633CC';
const POINT_RATE = 0.02; // 번개장터 적립률 2% (백엔드 MARKET_POINT_RATE_PERCENT 와 동기)

export default function MarketCheckout() {
  const { id, qty } = useLocalSearchParams<{ id: string; qty?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshProfile } = useAuth();

  const [product, setProduct] = useState<MarketProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [quantity, setQuantity] = useState(Math.max(1, Number(qty) || 1));
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [deliveryMemo, setDeliveryMemo] = useState('');
  const [usePointInput, setUsePointInput] = useState('');

  const pointBalance = Math.floor(Number(user?.marketPointBalance) || 0);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await getMarketProduct(id!);
      setProduct(data);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>상품 정보를 불러올 수 없습니다</Text>
      </View>
    );
  }

  const unitPrice = Number(product.price);
  const maxQty = Math.max(1, Number(product.stockQuantity) || 1);
  const totalPrice = unitPrice * quantity;

  // 포인트 사용액 — 보유 잔액과 주문 금액 안에서만 (백엔드와 동일 규칙).
  const requestedPoint = Math.max(0, Math.floor(Number(usePointInput) || 0));
  const usedPoint = Math.min(requestedPoint, pointBalance, totalPrice);
  const payable = totalPrice - usedPoint;
  const pointEarned = Math.floor(payable * POINT_RATE);

  const changeQty = (delta: number) => {
    setQuantity((q) => Math.min(maxQty, Math.max(1, q + delta)));
  };

  const applyAllPoint = () => {
    setUsePointInput(String(Math.min(pointBalance, totalPrice)));
  };

  const handlePay = async () => {
    if (!recipientName.trim()) return Alert.alert('받는 분', '받는 분 이름을 입력해 주세요');
    if (!recipientPhone.trim()) return Alert.alert('연락처', '연락처를 입력해 주세요');
    if (!zipCode.trim() || !address.trim())
      return Alert.alert('배송지', '우편번호와 주소를 입력해 주세요');

    setSubmitting(true);
    try {
      await createOrder({
        productId: product.id,
        quantity,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        zipCode: zipCode.trim(),
        address: address.trim(),
        addressDetail: addressDetail.trim() || undefined,
        deliveryMemo: deliveryMemo.trim() || undefined,
        usePoint: usedPoint > 0 ? usedPoint : undefined,
      });

      // 포인트 잔액(사용/적립) 갱신
      await refreshProfile();

      Alert.alert(
        '주문 완료',
        `결제가 완료되었습니다.\n${
          usedPoint > 0 ? `포인트 ${usedPoint.toLocaleString()}P 사용 · ` : ''
        }${pointEarned.toLocaleString()}P 적립 예정`,
        [
          {
            text: '주문 내역 보기',
            onPress: () => router.replace('/market/orders'),
          },
          {
            text: '확인',
            onPress: () => router.replace('/market'),
          },
        ],
      );
    } catch (e: any) {
      Alert.alert('주문 실패', e?.message || '주문 처리 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>주문/결제</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* 상품 요약 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주문 상품</Text>
          <View style={styles.productRow}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={styles.thumb}>
                <Text style={{ fontSize: 28 }}>📦</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.productTitle} numberOfLines={2}>
                {product.title}
              </Text>
              <Text style={styles.productPrice}>{unitPrice.toLocaleString()}원</Text>
            </View>
          </View>

          {/* 수량 */}
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>수량</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => changeQty(-1)}
                disabled={quantity <= 1}
              >
                <Ionicons
                  name="remove"
                  size={18}
                  color={quantity <= 1 ? COLORS.gray[400] : COLORS.gray[900]}
                />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => changeQty(1)}
                disabled={quantity >= maxQty}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color={quantity >= maxQty ? COLORS.gray[400] : COLORS.gray[900]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 배송지 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>배송지</Text>
          <TextInput
            style={styles.input}
            placeholder="받는 분 이름"
            placeholderTextColor={COLORS.gray[400]}
            value={recipientName}
            onChangeText={setRecipientName}
          />
          <TextInput
            style={styles.input}
            placeholder="연락처 (010-0000-0000)"
            placeholderTextColor={COLORS.gray[400]}
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            keyboardType="phone-pad"
          />
          <View style={styles.zipRow}>
            <TextInput
              style={[styles.input, styles.zipInput]}
              placeholder="우편번호"
              placeholderTextColor={COLORS.gray[400]}
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="number-pad"
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="주소"
            placeholderTextColor={COLORS.gray[400]}
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="상세주소 (선택)"
            placeholderTextColor={COLORS.gray[400]}
            value={addressDetail}
            onChangeText={setAddressDetail}
          />
          <TextInput
            style={styles.input}
            placeholder="배송 메모 (선택)"
            placeholderTextColor={COLORS.gray[400]}
            value={deliveryMemo}
            onChangeText={setDeliveryMemo}
          />
        </View>

        {/* 번개장터 포인트 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>번개장터 포인트</Text>
          <Text style={styles.pointBalance}>
            보유 <Text style={{ color: PURPLE, fontWeight: '800' }}>{pointBalance.toLocaleString()}P</Text>
          </Text>
          <View style={styles.pointInputRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="사용할 포인트"
              placeholderTextColor={COLORS.gray[400]}
              value={usePointInput}
              onChangeText={setUsePointInput}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.allBtn} onPress={applyAllPoint}>
              <Text style={styles.allBtnText}>전액사용</Text>
            </TouchableOpacity>
          </View>
          {requestedPoint > usedPoint && (
            <Text style={styles.pointHint}>
              최대 {usedPoint.toLocaleString()}P 까지 사용할 수 있습니다
            </Text>
          )}
        </View>

        {/* 결제 요약 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 금액</Text>
          <SummaryRow label="상품 금액" value={`${totalPrice.toLocaleString()}원`} />
          {usedPoint > 0 && (
            <SummaryRow label="포인트 사용" value={`-${usedPoint.toLocaleString()}원`} accent />
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.payLabel}>최종 결제 금액</Text>
            <Text style={styles.payValue}>{payable.toLocaleString()}원</Text>
          </View>
          <Text style={styles.earnHint}>
            구매 시 {pointEarned.toLocaleString()}P 적립 예정 (번개장터 전용)
          </Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.ctaBar}>
        <TouchableOpacity
          style={[styles.payBtn, submitting && { opacity: 0.6 }]}
          onPress={handlePay}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.payBtnText}>{payable.toLocaleString()}원 결제하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  errorText: { color: COLORS.gray[500], fontSize: FONT.sizes.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerTitle: { fontSize: FONT.sizes.lg, fontWeight: '800', color: COLORS.secondary },

  section: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT.sizes.md,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },

  productRow: { flexDirection: 'row', gap: SPACING.md, alignItems: 'center' },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.sm,
    backgroundColor: PURPLE + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productTitle: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.gray[900], lineHeight: 19 },
  productPrice: { fontSize: FONT.sizes.md, fontWeight: '800', color: COLORS.black, marginTop: 4 },

  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  qtyLabel: { fontSize: FONT.sizes.sm, color: COLORS.gray[700], fontWeight: '600' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.sm,
  },
  stepBtn: { width: 38, height: 36, justifyContent: 'center', alignItems: 'center' },
  qtyValue: {
    width: 40,
    textAlign: 'center',
    fontSize: FONT.sizes.md,
    fontWeight: '700',
    color: COLORS.gray[900],
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT.sizes.sm,
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.white,
  },
  zipRow: { flexDirection: 'row' },
  zipInput: { flex: 1 },

  pointBalance: { fontSize: FONT.sizes.sm, color: COLORS.gray[600], marginBottom: SPACING.sm },
  pointInputRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  allBtn: {
    paddingHorizontal: SPACING.lg,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  allBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT.sizes.sm },
  pointHint: { fontSize: FONT.sizes.xs, color: COLORS.error, marginTop: SPACING.xs },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  summaryLabel: { fontSize: FONT.sizes.sm, color: COLORS.gray[600] },
  summaryValue: { fontSize: FONT.sizes.sm, fontWeight: '600', color: COLORS.gray[900] },
  divider: { height: 1, backgroundColor: COLORS.gray[200], marginVertical: SPACING.sm },
  payLabel: { fontSize: FONT.sizes.md, fontWeight: '800', color: COLORS.secondary },
  payValue: { fontSize: FONT.sizes.lg, fontWeight: '900', color: PURPLE },
  earnHint: { fontSize: FONT.sizes.xs, color: COLORS.gray[500], marginTop: SPACING.sm },

  ctaBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  payBtn: {
    height: 52,
    backgroundColor: PURPLE,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtnText: { color: COLORS.white, fontSize: FONT.sizes.lg, fontWeight: '800' },
});
