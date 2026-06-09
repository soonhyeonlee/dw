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

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ nickname: nickname.trim() });
      await refreshProfile();
      Alert.alert('완료', '프로필이 수정되었습니다', [
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
        <View style={styles.field}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={user?.email || ''}
            editable={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>닉네임</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="닉네임을 입력하세요"
            placeholderTextColor={COLORS.gray[400]}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? '저장 중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  inputDisabled: { backgroundColor: QM.hairline, color: QM.sub },
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
