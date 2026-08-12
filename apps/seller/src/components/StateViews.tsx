import React from 'react';
import { View, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from './GText';
import { Button } from './ui/Button';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { Shimmer } from './Shimmer';
import { useLanguageStore } from '../store/language.store';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'cube-outline', title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={40} color={colors.primary[400]} />
      </View>
      <GText weight="bold" style={{ fontSize: 18, color: colors.neutral[800], textAlign: 'center' }}>
        {title}
      </GText>
      <GText style={{ fontSize: 14, color: colors.neutral[500], textAlign: 'center' }}>
        {message}
      </GText>
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="primary" size="md" />
      )}
    </Animated.View>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const t = useLanguageStore((s) => s.t);
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.error.light }]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.error.main} />
      </View>
      <GText weight="bold" style={{ fontSize: 18, color: colors.neutral[800], textAlign: 'center' }}>
        {t('common.error')}
      </GText>
      <GText style={{ fontSize: 14, color: colors.neutral[500], textAlign: 'center' }}>
        {message ?? t('common.retry')}
      </GText>
      {onRetry && (
        <Button label={t('common.retry')} onPress={onRetry} variant="outline" size="md" />
      )}
    </Animated.View>
  );
}

export function SkeletonCard() {
  const cardWidth = Platform.OS === 'web' ? 240 : (Dimensions.get('window').width - spacing.lg * 2 - spacing.md) / 2;
  return (
    <View style={[styles.skeletonCard, { width: cardWidth }]}>
      <Shimmer height={Platform.OS === 'web' ? 180 : 140} borderRadius={0} />
      <View style={styles.skeletonContent}>
        <Shimmer width="80%" height={16} borderRadius={radius.sm} />
        <Shimmer width="50%" height={14} borderRadius={radius.sm} />
        <View style={styles.skeletonRow}>
          <Shimmer width="40%" height={18} borderRadius={radius.sm} />
          <Shimmer width={32} height={32} borderRadius={radius.pill} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={skeletonListStyles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </ScrollView>
  );
}

export function OrderSkeletonCard() {
  return (
    <View style={orderSkelStyles.card}>
      <View style={orderSkelStyles.header}>
        <Shimmer width="60%" height={18} borderRadius={radius.sm} />
        <Shimmer width={80} height={20} borderRadius={radius.pill} />
      </View>
      <View style={orderSkelStyles.meta}>
        <Shimmer width="30%" height={14} borderRadius={radius.sm} />
        <Shimmer width="25%" height={20} borderRadius={radius.sm} />
      </View>
      <View style={orderSkelStyles.footer}>
        <Shimmer width="40%" height={14} borderRadius={radius.sm} />
      </View>
    </View>
  );
}

export function OrderSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={orderSkelStyles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <OrderSkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
    gap: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.mint[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  skeletonCard: {
    borderRadius: radius['2xl'],
    backgroundColor: colors.surface.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  skeletonContent: {
    padding: 12,
    gap: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});

const skeletonListStyles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    paddingHorizontal: Platform.OS === 'web' ? 0 : spacing.lg,
  },
});

const orderSkelStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  list: {
    gap: spacing.md,
  },
});
