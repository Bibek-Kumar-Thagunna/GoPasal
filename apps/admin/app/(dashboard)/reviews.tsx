import React, { useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/services/api';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';

function T({ style, children, n }: any) {
  return <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Poppins', color: colors.neutral[900] }, style]}>{children}</Animated.Text>;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={12} color={i <= rating ? colors.star.filled : colors.star.empty} />
      ))}
    </View>
  );
}

function AdminReviewCard({ review, onModerate, index }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)} style={styles.card}>
      <View style={styles.reviewHeader}>
        <View style={{ flex: 1 }}>
          <T style={styles.reviewerName}>{review.user?.name || 'Customer'}</T>
          <StarDisplay rating={review.rating} />
        </View>
        <T style={styles.date}>{new Date(review.createdAt).toLocaleDateString('en-NP')}</T>
      </View>

      <T style={styles.comment}>{review.comment || 'No text comment provided.'}</T>

      <View style={styles.metaRow}>
        <T style={styles.metaText}>Store: {review.store?.name || review.storeId}</T>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: review.isHidden ? colors.success.main + '20' : colors.error.light }]}
          onPress={() => onModerate(review.id, review.isHidden ? 'SHOW' : 'HIDE')}
        >
          <Ionicons name={review.isHidden ? 'eye-outline' : 'eye-off-outline'} size={14} color={review.isHidden ? colors.success.dark : colors.error.main} />
          <T style={[styles.actionText, { color: review.isHidden ? colors.success.dark : colors.error.main }]}>
            {review.isHidden ? 'Restore' : 'Hide'}
          </T>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.warning.main + '20' }]}
          onPress={() => onModerate(review.id, 'FLAG')}
        >
          <Ionicons name="flag-outline" size={14} color={colors.warning.main} />
          <T style={[styles.actionText, { color: colors.warning.main }]}>Flag</T>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function ModerationScreen() {
  const [filter, setFilter] = useState<'pending' | 'hidden' | 'all'>('pending');
  const qc = useQueryClient();

  const { data: reviews = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-reviews', filter],
    queryFn: async () => {
      let url = '/reviews/admin/all?limit=50';
      if (filter !== 'all') url += `&filter=${filter}`;
      const { data } = await apiClient.get(url);
      return data?.data || data || [];
    },
  });

  const { mutate: moderateReview } = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'HIDE' | 'SHOW' | 'FLAG' }) => {
      await apiClient.put(`/reviews/${id}/moderate`, { action });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <T style={styles.title}>Review Moderation</T>
      </View>

      <View style={styles.tabs}>
        {(['pending', 'hidden', 'all'] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, filter === t && styles.tabActive]}
            onPress={() => setFilter(t)}
          >
            <T style={[styles.tabText, filter === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </T>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1f3a" />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AdminReviewCard
              review={item}
              index={index}
              onModerate={(id: string, action: string) => moderateReview({ id, action: action as any })}
            />
          )}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.neutral[300]} />
              <T style={styles.emptyText}>Queue is empty</T>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: { paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.neutral[100] },
  tabActive: { backgroundColor: '#1a1f3a' },
  tabText: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: colors.neutral[500] },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: colors.surface.card, borderRadius: radius.lg, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  reviewerName: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.neutral[900] },
  date: { fontFamily: 'Inter', fontSize: 11, color: colors.neutral[400] },
  comment: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[700], marginVertical: spacing.xs, lineHeight: 20 },
  metaRow: { marginVertical: spacing.xs },
  metaText: { fontFamily: 'Inter-Medium', fontSize: 11, color: colors.neutral[500] },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm },
  actionText: { fontFamily: 'Poppins-SemiBold', fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[400] },
});
