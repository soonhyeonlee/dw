import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(
  name: IconName,
  nameFocused: IconName,
) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons
      name={focused ? nameFocused : name}
      size={24}
      color={color}
      style={{ marginTop: 2 }}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.ink[400],
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.divider,
          borderTopWidth: StyleSheetHairline(),
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 0,
        },
        tabBarItemStyle: { paddingVertical: 2 },
        headerStyle: { backgroundColor: COLORS.white, elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: '700', color: COLORS.ink[900] },
        headerShadowVisible: false,
      }}
    >
      {/* === 하단 네비게이션: 홈 / 카테고리 / 관심목록 / 쿠폰 / 마이계정 === */}
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          headerShown: false,
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: '카테고리',
          headerShown: false,
          tabBarIcon: tabIcon('grid-outline', 'grid'),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: '관심목록',
          headerShown: true,
          tabBarIcon: tabIcon('heart-outline', 'heart'),
        }}
      />
      <Tabs.Screen
        name="coupons"
        options={{
          title: '쿠폰',
          headerShown: false,
          tabBarIcon: tabIcon('ticket-outline', 'ticket'),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: '마이',
          headerShown: false,
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />

      {/* === 탭바에서 숨김 (라우트는 유지 — 홈 폴더탭/마이 등에서 사용) === */}
      <Tabs.Screen name="market" options={{ headerShown: false, href: null }} />
      <Tabs.Screen name="cashback" options={{ headerShown: false, href: null }} />
      <Tabs.Screen name="region" options={{ headerShown: false, href: null }} />
      <Tabs.Screen name="search" options={{ headerShown: false, href: null }} />
    </Tabs>
  );
}

function StyleSheetHairline(): number {
  // thin 1px divider across platforms
  return Platform.OS === 'android' ? 1 : 0.5;
}
