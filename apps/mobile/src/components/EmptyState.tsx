import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.iconBox, compact && styles.iconBoxCompact]}>
        <Ionicons
          name={icon}
          size={compact ? 36 : 56}
          color={COLORS.ink[300]}
        />
      </View>
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 64,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapCompact: { paddingVertical: 32 },
  iconBox: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.ink[50],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  iconBoxCompact: { width: 64, height: 64, borderRadius: 32, marginBottom: 12 },
  title: {
    fontSize: 18, fontWeight: '800',
    color: COLORS.ink[900],
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  titleCompact: { fontSize: 15 },
  subtitle: {
    fontSize: 14,
    color: COLORS.ink[500],
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  subtitleCompact: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  btn: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: COLORS.ink[900],
    borderRadius: RADIUS.full,
  },
  btnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
});

export default EmptyState;
