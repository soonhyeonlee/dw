import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT, SPACING, RADIUS, QM } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { updateProfile } from '../../src/api/user';

const BANKS = [
  '신한은행', 'KB국민은행', '우리은행', '하나은행', 'NH농협',
  'IBK기업은행', 'SC제일은행', '씨티은행', '카카오뱅크', '토스뱅크',
  '케이뱅크', '새마을금고', '우체국', '수협은행',
];

export default function BankAccountScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [bankName, setBankName] = useState((user as any)?.bankName || '');
  const [accountNumber, setAccountNumber] = useState((user as any)?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState((user as any)?.accountHolder || '');
  const [saving, setSaving] = useState(false);
  const isEdit = !!((user as any)?.bankName);

  const handleSave = async () => {
    if (!bankName || !accountNumber.trim() || !accountHolder.trim()) {
      Alert.alert('알림', '모든 항목을 입력해주세요');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        bankName,
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      });
      await refreshProfile();
      Alert.alert('완료', '계좌 정보가 저장되었습니다', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('오류', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.notice}>
          출금 시 사용될 계좌 정보를 등록하세요
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>은행 선택</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankScroll}>
            <View style={styles.bankRow}>
              {BANKS.map((bank) => (
                <TouchableOpacity
                  key={bank}
                  style={[styles.bankChip, bankName === bank && styles.bankChipActive]}
                  onPress={() => setBankName(bank)}
                >
                  <Text style={[styles.bankChipText, bankName === bank && styles.bankChipTextActive]}>
                    {bank}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>계좌번호</Text>
          <TextInput
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="계좌번호를 입력하세요 (- 제외)"
            placeholderTextColor={COLORS.gray[400]}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>예금주</Text>
          <TextInput
            style={styles.input}
            value={accountHolder}
            onChangeText={setAccountHolder}
            placeholder="예금주명을 입력하세요"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? '저장 중...' : isEdit ? '계좌 변경' : '계좌 등록'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: QM.pageBg },
  content: { padding: SPACING.xl, gap: SPACING.lg },
  notice: {
    fontSize: FONT.sizes.sm,
    color: QM.coral,
    backgroundColor: QM.coralSoft,
    padding: SPACING.md,
    borderRadius: 14,
  },
  field: { gap: SPACING.sm },
  label: { fontSize: FONT.sizes.sm, fontWeight: '700', color: '#9097A0' },
  bankScroll: { marginHorizontal: -SPACING.xl },
  bankRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, paddingHorizontal: SPACING.xl },
  bankChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: QM.card,
    borderWidth: 1,
    borderColor: QM.hairline,
  },
  bankChipActive: {
    backgroundColor: QM.coral,
    borderColor: QM.coral,
  },
  bankChipText: { fontSize: FONT.sizes.sm, color: COLORS.gray[700] },
  bankChipTextActive: { color: COLORS.white, fontWeight: '700' },
  input: {
    height: 52,
    backgroundColor: QM.fieldBg,
    borderRadius: 14,
    paddingHorizontal: SPACING.lg,
    fontSize: FONT.sizes.md,
    color: QM.ink,
    borderWidth: 1,
    borderColor: QM.hairline,
  },
  saveBtn: {
    height: 52,
    backgroundColor: QM.coral,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    ...QM.cardShadow,
    shadowColor: QM.coral,
    shadowOpacity: 0.28,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: FONT.sizes.lg, fontWeight: '800', color: COLORS.white },
});
