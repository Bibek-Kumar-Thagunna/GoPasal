import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="warning-outline" size={44} color={colors.error.main} />
      </View>
      <Animated.Text style={styles.title}>Something went wrong</Animated.Text>
      <Animated.Text style={styles.message}>
        The app encountered an unexpected error.
      </Animated.Text>
      {__DEV__ && error && (
        <Animated.Text style={styles.errorText}>{error.message}</Animated.Text>
      )}
      <Pressable onPress={onReset} style={styles.retryBtn}>
        <Animated.Text style={styles.retryText}>Try Again</Animated.Text>
      </Pressable>
    </View>
  );
}

import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
    gap: spacing.lg,
    backgroundColor: colors.surface.background,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.error.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: colors.neutral[800],
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.error.main,
    textAlign: 'center',
    padding: spacing.md,
    backgroundColor: colors.error.light,
    borderRadius: radius.md,
    width: '100%',
  },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: radius.pill,
  },
  retryText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#fff',
  },
});
