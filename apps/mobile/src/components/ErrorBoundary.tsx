import React, { Component, ErrorInfo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONT, SPACING, RADIUS } from '../constants/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>문제가 발생했습니다</Text>
          <Text style={styles.message}>
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다'}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.buttonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.background,
  },
  icon: { fontSize: 48, marginBottom: SPACING.lg },
  title: {
    fontSize: FONT.sizes.lg,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONT.sizes.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT.sizes.md,
  },
});
