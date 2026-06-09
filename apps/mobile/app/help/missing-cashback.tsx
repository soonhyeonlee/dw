import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, QM } from '../../src/constants/theme';

const REASONS = [
  '구매 후 4일이 지났는데 적립이 안 됐어요',
  '경유했는데 적립이 누락됐어요',
  '적립 금액이 다르게 들어왔어요',
  '기타',
];

const MALL_PRESETS = ['쿠팡', '11번가', 'G마켓', '옥션', 'SSG', '네이버', '직접 입력'];

function fmt(v: number) { return v.toLocaleString(); }

export default function MissingCashbackScreen() {
  const router = useRouter();
  const [mall, setMall] = useState<string>('');
  const [mallCustom, setMallCustom] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderAmountStr, setOrderAmountStr] = useState('');
  const [reason, setReason] = useState<string>('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isCustomMall = mall === '직접 입력';
  const finalMall = isCustomMall ? mallCustom.trim() : mall;
  const orderAmount = Number(orderAmountStr.replace(/[^0-9]/g, ''));

  const valid =
    !!finalMall &&
    /^\d{4}[-./]?\d{1,2}[-./]?\d{1,2}$/.test(orderDate.trim()) &&
    orderId.trim().length > 0 &&
    orderAmount > 0 &&
    !!reason;

  const handleSubmit = async () => {
    if (!valid) {
      Alert.alert('입력 확인', '쇼핑몰, 주문일, 주문번호, 주문금액, 사유는 필수예요.');
      return;
    }
    setSubmitting(true);
    try {
      // backend endpoint not yet wired — simulate optimistically
      await new Promise((res) => setTimeout(res, 600));
      Alert.alert(
        '신고 접수 완료',
        `[${finalMall}] 거래에 대한 누락 캐시 도움 요청이 접수되었어요.\n영업일 기준 3~5일 내에 결과를 알려드릴게요.`,
        [{ text: '확인', onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert('전송 실패', e?.message || '잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: '누락 캐시 도움 요청', headerBackTitle: '뒤로' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Notice */}
          <View style={styles.notice}>
            <View style={styles.noticeRow}>
              <Ionicons name="information-circle" size={16} color={COLORS.primary} />
              <Text style={styles.noticeTitle}>도움 요청 전 확인해주세요</Text>
            </View>
            <Text style={styles.noticeText}>
              · 구매 후 <Text style={styles.b}>최소 4일</Text>이 경과한 거래만 신청 가능해요{'\n'}
              · 주문번호와 주문일은 쇼핑몰의 <Text style={styles.b}>주문 내역</Text>에서 확인할 수 있어요{'\n'}
              · 더블윈 경유 없이 직접 방문해 구매한 경우 적립 대상이 아니에요
            </Text>
          </View>

          {/* Mall */}
          <View style={styles.section}>
            <Label required>쇼핑몰</Label>
            <View style={styles.chipRow}>
              {MALL_PRESETS.map((m) => {
                const active = mall === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setMall(m)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {isCustomMall ? (
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="쇼핑몰 이름을 입력해주세요"
                placeholderTextColor={COLORS.ink[400]}
                value={mallCustom}
                onChangeText={setMallCustom}
              />
            ) : null}
          </View>

          {/* Order date */}
          <View style={styles.section}>
            <Label required>주문일</Label>
            <TextInput
              style={styles.input}
              placeholder="예: 2026.05.01"
              placeholderTextColor={COLORS.ink[400]}
              value={orderDate}
              onChangeText={setOrderDate}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Order ID */}
          <View style={styles.section}>
            <Label required>주문번호</Label>
            <TextInput
              style={styles.input}
              placeholder="쇼핑몰 주문 내역의 주문번호"
              placeholderTextColor={COLORS.ink[400]}
              value={orderId}
              onChangeText={setOrderId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Order amount */}
          <View style={styles.section}>
            <Label required>주문금액</Label>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="0"
                placeholderTextColor={COLORS.ink[400]}
                value={orderAmountStr ? fmt(orderAmount) : ''}
                onChangeText={(v) => setOrderAmountStr(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
              />
              <Text style={styles.inputUnit}>원</Text>
            </View>
          </View>

          {/* Reason */}
          <View style={styles.section}>
            <Label required>사유</Label>
            <View style={{ gap: 8 }}>
              {REASONS.map((r) => {
                const active = reason === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.reasonRow, active && styles.reasonRowActive]}
                    onPress={() => setReason(r)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text style={[styles.reasonText, active && styles.reasonTextActive]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Label>상세 설명 (선택)</Label>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="추가로 알려주실 내용이 있으면 적어주세요"
              placeholderTextColor={COLORS.ink[400]}
              value={details}
              onChangeText={setDetails}
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.helper}>{details.length} / 500</Text>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Submit */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, (!valid || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!valid || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>도움 요청 제출</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{children}</Text>
      {required ? <Text style={styles.required}>*</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: QM.pageBg },
  scroll: { flex: 1 },

  notice: {
    marginHorizontal: SPACING.xl,
    marginTop: 16,
    padding: 14,
    backgroundColor: QM.coralSoft,
    borderRadius: 18,
  },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  noticeTitle: { fontSize: 13, fontWeight: '800', color: COLORS.ink[900] },
  noticeText: { fontSize: 12, color: COLORS.ink[700], lineHeight: 18 },
  b: { fontWeight: '800', color: COLORS.ink[900] },

  section: { paddingHorizontal: SPACING.xl, marginTop: 24 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.ink[900] },
  required: { fontSize: 14, fontWeight: '800', color: QM.coral },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.ink[200],
  },
  chipActive: { backgroundColor: QM.coral, borderColor: QM.coral },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.ink[700] },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },

  input: {
    height: 48,
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    fontSize: 14,
    color: COLORS.ink[900],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputUnit: { fontSize: 15, fontWeight: '700', color: COLORS.ink[700] },
  textarea: { height: 110, paddingTop: 12, paddingBottom: 12 },
  helper: { fontSize: 11, color: COLORS.ink[500], marginTop: 6, textAlign: 'right' },

  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: QM.card,
    borderRadius: 14,
    borderWidth: 1, borderColor: QM.hairline,
  },
  reasonRowActive: { borderColor: QM.coral, backgroundColor: QM.coralSoft },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.ink[300],
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: QM.coral },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: QM.coral },
  reasonText: { flex: 1, fontSize: 13, color: COLORS.ink[800], fontWeight: '500' },
  reasonTextActive: { color: COLORS.ink[900], fontWeight: '700' },

  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 0 : 12,
    backgroundColor: QM.pageBg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: QM.hairline,
  },
  submitBtn: {
    height: 52, borderRadius: 16,
    backgroundColor: QM.coral,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: QM.coral, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  submitBtnDisabled: { backgroundColor: COLORS.ink[200] },
  submitText: { color: COLORS.white, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
});
