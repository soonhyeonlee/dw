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
      {/* 1차 오픈은 쿠폰 미노출 — 쿠폰 탭 자리를 맘카페로 대체 */}
      <Tabs.Screen
        name="momcafe"
        options={{
          title: '맘카페',
          headerShown: false,
          tabBarIcon: tabIcon('people-outline', 'people'),
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
      {/* 번개장터 진열은 루트 스택 라우트 app/market/index.tsx (/market) 로 이동 —
          탭이 아니라 push 되어 뒤로가기 시 직전 화면으로 정확히 복귀. */}
      {/* 쿠폰: 1차 오픈 미노출 — 탭바·접근 모두 차단(href: null). 라우트 파일은 보존. */}
      <Tabs.Screen name="coupons" options={{ headerShown: false, href: null }} />
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
