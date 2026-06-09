import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, QM } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { requestWithdrawal } from '../../src/api/cashback';

const MIN_AMOUNT = 5000;

const QUICK_AMOUNTS = [10000, 30000, 50000, 100000];

function fmt(v: number) { return v.toLocaleString(); }

export default function WithdrawScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const balance = Number(user?.cashbackBalance || 0);
  const bankName = (user as any)?.bankName as string | undefined;
  const accountNumber = (user as any)?.accountNumber as string | undefined;
  const accountHolder = (user as any)?.accountHolder as string | undefined;
  const hasAccount = !!(bankName && accountNumber && accountHolder);

  const [amountStr, setAmountStr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const amount = Number(amountStr.replace(/[^0-9]/g, ''));
  const validAmount = amount >= MIN_AMOUNT && amount <= balance;

  const remaining = useMemo(() => Math.max(0, balance - (validAmount ? amount : 0)), [balance, amount, validAmount]);

  const errorMsg = (() => {
    if (!amountStr) return null;
    if (Number.isNaN(amount) || amount <= 0) return '숫자를 입력해주세요.';
    if (amount < MIN_AMOUNT) return `최소 ${fmt(MIN_AMOUNT)}원부터 환급 가능해요.`;
    if (amount > balance) return '잔액보다 많은 금액은 환급할 수 없어요.';
    return null;
  })();

  const setQuick = (v: number) => {
    setAmountStr(String(Math.min(v, balance)));
  };

  const setAll = () => {
    setAmountStr(String(balance));
  };

  const handleEditAccount = () => {
    router.push('/mypage/bank-account');
  };

  const handleSubmit = async () => {
    if (!hasAccount) {
      handleEditAccount();
      return;
    }
    if (!validAmount) return;
    setSubmitting(true);
    try {
      await requestWithdrawal({
        amount,
        bankName: bankName!,
        accountNumber: accountNumber!,
        accountHolder: accountHolder!,
      });
      await refreshProfile();
      Alert.alert('환급 신청 완료', `${fmt(amount)}원 환급 요청이 접수되었어요.\n영업일 기준 1~3일 내 입금됩니다.`, [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('환급 실패', e?.message || '잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled = submitting || (hasAccount && !validAmount);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color={COLORS.ink[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>환급 신청</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Balance card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>환급 가능 캐시백</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>{fmt(balance)}</Text>
              <Text style={styles.balanceUnit}>원</Text>
            </View>
          </View>

          {/* Amount input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>환급 금액</Text>
            <View style={[
              styles.inputBox,
              amountStr ? (errorMsg ? styles.inputBoxError : styles.inputBoxFocus) : null,
            ]}>
              <TextInput
                style={styles.input}
                value={amountStr ? fmt(amount) : ''}
                onChangeText={(v) => setAmountStr(v.replace(/[^0-9]/g, ''))}
                placeholder="0"
                placeholderTextColor={COLORS.ink[300]}
                keyboardType="number-pad"
                returnKeyType="done"
              />
              <Text style={styles.inputUnit}>원</Text>
            </View>
            {errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : (
              <Text style={styles.helperText}>
                최소 {fmt(MIN_AMOUNT)}원 · 환급 후 잔액 <Text style={styles.helperStrong}>{fmt(remaining)}원</Text>
              </Text>
            )}

            <View style={styles.quickRow}>
              {QUICK_AMOUNTS.map((v) => {
                const disabled = v > balance;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[styles.quickChip, disabled && styles.quickChipDisabled]}
                    onPress={() => setQuick(v)}
                    disabled={disabled}
                  >
                    <Text style={[styles.quickText, disabled && styles.quickTextDisabled]}>
                      +{fmt(v / 10000)}만
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.quickChip, styles.quickChipAll]}
                onPress={setAll}
                disabled={balance < MIN_AMOUNT}
              >
                <Text style={[styles.quickText, styles.quickTextAll]}>전액</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account card */}
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionLabel}>입금 계좌</Text>
              <TouchableOpacity onPress={handleEditAccount}>
                <Text style={styles.sectionAction}>{hasAccount ? '변경' : '등록'}</Text>
              </TouchableOpacity>
            </View>
            {hasAccount ? (
              <View style={styles.accountCard}>
                <View style={styles.accountIcon}>
                  <Ionicons name="card" size={20} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountBank}>{bankName}</Text>
                  <Text style={styles.accountNum}>
                    {accountNumber!.replace(/(\d{4})(?=\d)/g, '$1-')} · {accountHolder}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.accountEmpty} onPress={handleEditAccount}>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.ink[500]} />
                <Text style={styles.accountEmptyText}>출금 계좌를 등록해주세요</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.ink[400]} />
              </TouchableOpacity>
            )}
          </View>

          {/* Notice */}
          <View style={styles.notice}>
            <View style={styles.noticeRow}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.noticeText}>환급 수수료는 무료입니다</Text>
            </View>
            <View style={styles.noticeRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.ink[600]} />
              <Text style={styles.noticeText}>영업일 기준 1~3일 내 입금돼요</Text>
            </View>
            <View style={styles.noticeRow}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.ink[600]} />
              <Text style={styles.noticeText}>예금주명이 회원 정보와 다르면 입금이 거절될 수 있어요</Text>
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Submit */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitBtn, submitDisabled && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitDisabled}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitText}>
                {hasAccount
                  ? validAmount ? `${fmt(amount)}원 환급 신청` : '환급 신청'
                  : '계좌 등록하기'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: QM.pageBg },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink[900] },

  scroll: { flex: 1 },

  balanceCard: {
    marginHorizontal: SPACING.xl,
    marginTop: 20,
    padding: 20,
    backgroundColor: QM.card,
    borderRadius: 20,
    ...QM.cardShadow,
  },
  balanceLabel: { fontSize: 12, color: '#9097A0', fontWeight: '700' },
  balanceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  balanceAmount: { fontSize: 28, fontWeight: '800', color: QM.coral, letterSpacing: -0.5 },
  balanceUnit: { fontSize: 18, fontWeight: '700', color: QM.coral, marginLeft: 4 },

  section: {
    marginHorizontal: SPACING.xl,
    marginTop: 28,
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: QM.ink, marginBottom: 10 },
  sectionAction: { fontSize: 13, color: QM.coral, fontWeight: '700' },

  inputBox: {
    height: 64,
    backgroundColor: QM.fieldBg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBoxFocus: { borderColor: QM.coral, backgroundColor: COLORS.white },
  inputBoxError: { borderColor: COLORS.error, backgroundColor: '#FFE3E2' },
  input: { flex: 1, fontSize: 24, fontWeight: '800', color: COLORS.ink[900], padding: 0 },
  inputUnit: { fontSize: 18, fontWeight: '700', color: COLORS.ink[700], marginLeft: 6 },

  errorText: { fontSize: 12, color: COLORS.error, marginTop: 8, fontWeight: '600' },
  helperText: { fontSize: 12, color: COLORS.ink[500], marginTop: 8 },
  helperStrong: { color: COLORS.ink[900], fontWeight: '700' },

  quickRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.ink[200],
  },
  quickChipAll: { borderColor: QM.coralSoft, backgroundColor: QM.coralSoft },
  quickChipDisabled: { opacity: 0.4 },
  quickText: { fontSize: 13, fontWeight: '700', color: COLORS.ink[800] },
  quickTextAll: { color: QM.coral },
  quickTextDisabled: { color: COLORS.ink[400] },

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: QM.card,
    borderRadius: 18,
    ...QM.cardShadow,
  },
  accountIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: QM.coralSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  accountBank: { fontSize: 14, fontWeight: '700', color: COLORS.ink[900] },
  accountNum: { fontSize: 12, color: COLORS.ink[500], marginTop: 2, fontVariant: ['tabular-nums'] },

  accountEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: COLORS.ink[50],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.ink[100],
    borderStyle: 'dashed',
  },
  accountEmptyText: { flex: 1, fontSize: 13, color: COLORS.ink[600], fontWeight: '500' },

  notice: {
    marginHorizontal: SPACING.xl,
    marginTop: 24,
    padding: 16,
    backgroundColor: QM.card,
    borderRadius: 18,
    ...QM.cardShadow,
    gap: 8,
  },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noticeText: { fontSize: 12, color: COLORS.ink[700], lineHeight: 16, flex: 1 },

  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 0 : 12,
    backgroundColor: QM.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: QM.hairline,
  },
  submitBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: QM.coral,
    alignItems: 'center',
    justifyContent: 'center',
    ...QM.cardShadow,
    shadowColor: QM.coral,
    shadowOpacity: 0.28,
  },
  submitBtnDisabled: { backgroundColor: COLORS.ink[200] },
  submitText: { color: COLORS.white, fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
});
