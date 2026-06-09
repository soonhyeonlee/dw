import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT, SPACING, RADIUS, QM } from '../../src/constants/theme';
import { changePassword } from '../../src/api/auth-extra';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('알림', '모든 항목을 입력해주세요');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('알림', '새 비밀번호는 8자 이상이어야 합니다');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('알림', '새 비밀번호가 일치하지 않습니다');
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      Alert.alert('완료', '비밀번호가 변경되었습니다', [
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
      <View style={styles.content}>
        <View style={styles.field}>
          <Text style={styles.label}>현재 비밀번호</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="현재 비밀번호"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>새 비밀번호</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="8자 이상"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>새 비밀번호 확인</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="새 비밀번호 다시 입력"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? '변경 중...' : '비밀번호 변경'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: QM.pageBg },
  content: { padding: SPACING.xl, gap: SPACING.lg },
  field: { gap: SPACING.sm },
  label: { fontSize: FONT.sizes.sm, fontWeight: '700', color: '#9097A0' },
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
