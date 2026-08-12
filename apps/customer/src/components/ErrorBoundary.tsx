import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { Button } from '../design-system/primitives/Button';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { useTranslation } from '../i18n';

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
      <GText variant="h3" color={colors.neutral[800]} align="center">
        Something went wrong
      </GText>
      <GText variant="body" color={colors.neutral[500]} align="center">
        The app encountered an unexpected error.
      </GText>
      {__DEV__ && error && (
        <GText variant="caption" color={colors.error.main} align="center" style={styles.errorText}>
          {error.message}
        </GText>
      )}
      <Button label="Try Again" onPress={onReset} variant="primary" size="md" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['4xl'],
    gap: spacing.lg,
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
  errorText: {
    padding: spacing.md,
    backgroundColor: colors.error.light,
    borderRadius: radius.md,
    width: '100%',
  },
});
