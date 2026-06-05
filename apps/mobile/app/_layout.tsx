import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants/theme';
import { AuthProvider } from '../src/contexts/AuthContext';
import ErrorBoundary from '../src/components/ErrorBoundary';

const isExpoGo = Constants.appOwnership === 'expo';

function NotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    if (isExpoGo) return;

    let sub: { remove: () => void } | undefined;
    (async () => {
      const Notifications = await import('expo-notifications');
      const { registerForPushNotifications } = await import('../src/lib/notifications');
      registerForPushNotifications();

      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, string> | undefined;
        const type = data?.type;
        if (type === 'cashback' || (type && type.startsWith('withdrawal'))) {
          router.push('/(tabs)/cashback');
        }
      });
    })();

    return () => sub?.remove();
  }, [router]);

  return null;
}

export default function RootLayout() {

  return (
    <ErrorBoundary>
    <SafeAreaProvider>
    <AuthProvider>
      <StatusBar style="dark" />
      <NotificationHandler />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.white },
          headerTintColor: COLORS.secondary,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth/login"
          options={{ title: '로그인', presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="auth/register"
          options={{ title: '회원가입', presentation: 'modal' }}
        />
        <Stack.Screen
          name="product/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="mall/[platform]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="market/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="market/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="market/checkout"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="market/search"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="market/orders"
          options={{ title: '주문 내역' }}
        />
        <Stack.Screen
          name="market/order/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="region/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="mypage/wishlist"
          options={{ title: '찜한 상품' }}
        />
        <Stack.Screen
          name="mypage/recent"
          options={{ title: '최근 본 상품' }}
        />
        <Stack.Screen
          name="mypage/profile"
          options={{ title: '프로필 수정' }}
        />
        <Stack.Screen
          name="mypage/bank-account"
          options={{ title: '계좌 관리' }}
        />
        <Stack.Screen
          name="mypage/change-password"
          options={{ title: '비밀번호 변경' }}
        />
        <Stack.Screen
          name="cashback/withdraw"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="help/index"
          options={{ title: '고객센터' }}
        />
        <Stack.Screen
          name="help/missing-cashback"
          options={{ title: '누락 캐시 도움 요청' }}
        />
        <Stack.Screen
          name="guide"
          options={{ title: '이용가이드' }}
        />
        <Stack.Screen
          name="notifications"
          options={{ title: '알림' }}
        />
        <Stack.Screen
          name="settings/notifications"
          options={{ title: '알림 설정' }}
        />
        <Stack.Screen
          name="settings/legal/[type]"
          options={{ title: '약관' }}
        />
        <Stack.Screen
          name="settings/about"
          options={{ title: '앱 정보' }}
        />
      </Stack>
    </AuthProvider>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}
