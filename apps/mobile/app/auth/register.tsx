import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants/theme';

// 회원가입은 아이홈마켓(그누보드) 계정 공유 SSO 로 일원화됨.
// 기존 "회원가입" 진입점들을 모두 SSO 로그인 화면으로 보낸다.
export default function RegisterRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/login');
  }, []);
  return (
    <View style={styles.container}>
      <ActivityIndicator color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
});
