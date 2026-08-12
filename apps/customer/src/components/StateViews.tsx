import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { Button } from '../design-system/primitives/Button';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { Platform, Dimensions } from 'react-native';
import { useTranslation } from '../i18n';

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
      <GText variant="h3" color={colors.neutral[800]} align="center">
        {title}
      </GText>
      <GText variant="body" color={colors.neutral[500]} align="center">
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
  const { t } = useTranslation();
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.error.light }]}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.error.main} />
      </View>
      <GText variant="h3" color={colors.neutral[800]} align="center">
        {t('common.oops')}
      </GText>
      <GText variant="body" color={colors.neutral[500]} align="center">
        {message ?? t('common.somethingWentWrong')}
      </GText>
      {onRetry && (
        <Button label={t('common.tryAgain')} onPress={onRetry} variant="outline" size="md" />
      )}
    </Animated.View>
  );
}

// Premium Skeletons
import { Shimmer } from './Shimmer';

export function SkeletonCard() {
  const cardWidth = Platform.OS === 'web' ? 240 : (Dimensions.get('window').width - spacing.lg * 2 - spacing.md) / 2;
  return (
    <View style={[styles.skeletonCard, { width: cardWidth }]}>
      <Shimmer height={Platform.OS === 'web' ? 180 : 140} borderRadius={0} />
      <View style={styles.skeletonContent}>
        <Shimmer width="80%" height={16} borderRadius={radius.sm} />
        <Shimmer width="50%" height={14} borderRadius={radius.sm} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
          <Shimmer width="40%" height={18} borderRadius={radius.sm} />
          <Shimmer width={32} height={32} borderRadius={radius.pill} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skeletonList}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </ScrollView>
  );
}

export function OrderSkeletonCard() {
  return (
    <View style={styles.orderSkeleton}>
      <View style={styles.orderSkeletonHeader}>
        <Shimmer width="60%" height={18} borderRadius={radius.sm} />
        <Shimmer width={80} height={20} borderRadius={radius.pill} />
      </View>
      <View style={styles.orderSkeletonMeta}>
        <Shimmer width="30%" height={14} borderRadius={radius.sm} />
        <Shimmer width="25%" height={20} borderRadius={radius.sm} />
      </View>
      <View style={styles.orderSkeletonFooter}>
        <Shimmer width="40%" height={14} borderRadius={radius.sm} />
      </View>
    </View>
  );
}

export function OrderSkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.orderSkeletonList}>
      {Array.from({ length: count }).map((_, i) => (
        <OrderSkeletonCard key={i} />
      ))}
    </View>
  );
}

export function ProductSkeleton() {
  return (
    <View style={{ flex: 1, padding: spacing.lg, paddingTop: Platform.OS === 'web' ? 64 + spacing.md : spacing.lg }}>
      <Shimmer height={340} borderRadius={radius.xl} />
      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        <Shimmer width="40%" height={16} borderRadius={radius.sm} />
        <Shimmer width="80%" height={32} borderRadius={radius.sm} />
        <Shimmer width="60%" height={32} borderRadius={radius.sm} />
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <Shimmer width={60} height={24} borderRadius={radius.sm} />
          <Shimmer width={100} height={24} borderRadius={radius.sm} />
        </View>
        <Shimmer width="30%" height={40} borderRadius={radius.sm} style={{ marginTop: spacing.lg }} />
        
        <View style={{ marginTop: spacing['2xl'], gap: spacing.sm }}>
          <Shimmer width="100%" height={16} borderRadius={radius.sm} />
          <Shimmer width="100%" height={16} borderRadius={radius.sm} />
          <Shimmer width="70%" height={16} borderRadius={radius.sm} />
        </View>
      </View>
    </View>
  );
}

export function CategorySkeletonCard() {
  const cardWidth = Dimensions.get('window').width >= 768 ? 72 : 64; // Approximating categoryBadgeSize
  return (
    <View style={{ alignItems: 'center', gap: 8, width: 80 }}>
      <Shimmer width={cardWidth} height={cardWidth} borderRadius={cardWidth / 2} />
      <Shimmer width="80%" height={12} borderRadius={radius.sm} />
    </View>
  );
}

export function CategorySkeletonList({ count = 8, columns = 4 }: { count?: number, columns?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: `${100 / columns}%`, alignItems: 'center' }}>
          <CategorySkeletonCard />
        </View>
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
  skeletonList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    paddingHorizontal: Platform.OS === 'web' ? 0 : spacing.lg,
  },
  orderSkeleton: {
    backgroundColor: '#fff', 
    padding: spacing.lg, 
    borderRadius: radius.lg,
    borderWidth: 1, 
    borderColor: colors.neutral[100],
  },
  orderSkeletonHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderSkeletonMeta: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  orderSkeletonFooter: {
    marginTop: spacing.md, 
    paddingTop: spacing.md,
    borderTopWidth: 1, 
    borderTopColor: colors.neutral[100],
  },
  orderSkeletonList: {
    gap: spacing.md,
  },
});
