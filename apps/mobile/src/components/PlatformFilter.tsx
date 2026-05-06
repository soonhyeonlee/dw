import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, FONT, SPACING, RADIUS } from '../constants/theme';

interface Props {
  selected: string | null;
  onSelect: (platform: string | null) => void;
}

const PLATFORMS = [
  { key: null, label: '전체', color: COLORS.primary },
  { key: 'coupang', label: '쿠팡', color: COLORS.coupang },
  { key: 'naver', label: '네이버', color: COLORS.naver },
  { key: '11st', label: '11번가', color: COLORS.eleventh },
];

export default function PlatformFilter({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {PLATFORMS.map((p) => {
        const isActive = selected === p.key;
        return (
          <TouchableOpacity
            key={p.key ?? 'all'}
            style={[
              styles.chip,
              isActive && { backgroundColor: p.color },
            ]}
            onPress={() => onSelect(p.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                isActive && styles.chipTextActive,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[100],
  },
  chipText: {
    fontSize: FONT.sizes.sm,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  chipTextActive: {
    color: COLORS.white,
  },
});
