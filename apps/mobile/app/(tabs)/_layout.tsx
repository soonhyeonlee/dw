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
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          headerShown: false,
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: '번개장터',
          headerShown: false,
          tabBarIcon: tabIcon('flash-outline', 'flash'),
        }}
      />
      <Tabs.Screen
        name="cashback"
        options={{
          title: '캐시백',
          headerShown: false,
          tabBarIcon: tabIcon('wallet-outline', 'wallet'),
        }}
      />
      <Tabs.Screen
        name="region"
        options={{
          title: '우리지역',
          headerShown: false,
          tabBarIcon: tabIcon('location-outline', 'location'),
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
      <Tabs.Screen
        name="search"
        options={{
          title: '검색',
          headerShown: false,
          tabBarIcon: tabIcon('search-outline', 'search'),
          href: null,
        }}
      />
    </Tabs>
  );
}

function StyleSheetHairline(): number {
  // thin 1px divider across platforms
  return Platform.OS === 'android' ? 1 : 0.5;
}
