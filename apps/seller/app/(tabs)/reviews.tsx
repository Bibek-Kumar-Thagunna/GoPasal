import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSellerTenantReady } from '../../src/hooks/useSellerTenantReady';
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
        <Ionicons key={i} name={i <= rating ? 'star' : 'star-outline'} size={13} color={i <= rating ? colors.star.filled : colors.star.empty} />
      ))}
    </View>
  );
}

function ReviewCard({ review, onReply, index }: any) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState(review.ownerReply || '');
  const hasReply = !!review.ownerReply;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View>
          <T style={styles.reviewerName}>{review.user?.name || 'Customer'}</T>
          <T style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('en-NP')}</T>
        </View>
        <StarDisplay rating={review.rating} />
      </View>

      {review.comment ? (
        <T style={styles.reviewComment} n={4}>{review.comment}</T>
      ) : (
        <T style={styles.noComment}>No comment</T>
      )}

      {/* Owner reply area */}
      {hasReply && !showReply ? (
        <View style={styles.replyBox}>
          <T style={styles.replyLabel}>Your reply:</T>
          <T style={styles.replyText} n={3}>{review.ownerReply}</T>
          <Pressable onPress={() => setShowReply(true)}>
            <T style={styles.editReply}>Edit reply</T>
          </Pressable>
        </View>
      ) : showReply || !hasReply ? (
        <View style={styles.replyInput}>
          <TextInput
            style={styles.replyInputField}
            placeholder="Write a reply to this review..."
            value={replyText}
            onChangeText={setReplyText}
            multiline
            placeholderTextColor={colors.neutral[400]}
          />
          <View style={styles.replyBtns}>
            {showReply && (
              <Pressable onPress={() => { setShowReply(false); setReplyText(review.ownerReply || ''); }}>
                <T style={styles.cancelBtn}>Cancel</T>
              </Pressable>
            )}
            <Pressable
              style={styles.submitReplyBtn}
              onPress={() => { onReply(review.id, replyText); setShowReply(false); }}
            >
              <T style={styles.submitReplyText}>{hasReply ? 'Update Reply' : 'Reply'}</T>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function ReviewsScreen() {
  const qc = useQueryClient();
  const { isReady, activeStoreId } = useSellerTenantReady();

  const { data: reviews = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['seller-reviews', activeStoreId],
    queryFn: async () => {
      if (!activeStoreId) return [];
      const { data } = await apiClient.get(`/reviews/store/${activeStoreId}?limit=50`);
      return data?.data || data || [];
    },
    enabled: isReady,
    retry: 1,
  });

  const { mutate: replyToReview } = useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      await apiClient.post(`/reviews/${reviewId}/reply`, { reply });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-reviews'] }),
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <T style={styles.title}>Customer Reviews</T>
        <View style={styles.ratingChip}>
          <Ionicons name="star" size={14} color={colors.star.filled} />
          <T style={styles.avgRating}>{avgRating}</T>
          <T style={styles.reviewCount}>({reviews.length})</T>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.hero.gradientStart} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ReviewCard
              review={item}
              index={index}
              onReply={(id: string, reply: string) => replyToReview({ reviewId: id, reply })}
            />
          )}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.hero.gradientStart} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="star-outline" size={48} color={colors.neutral[300]} />
              <T style={styles.emptyText}>No reviews yet</T>
              <T style={styles.emptySubtext}>Reviews from customers will appear here</T>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  ratingChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.star.filled + '20', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill },
  avgRating: { fontFamily: 'Poppins-Bold', fontSize: 15, color: colors.star.filled },
  reviewCount: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500] },
  reviewCard: { backgroundColor: colors.surface.card, borderRadius: radius.lg, padding: spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  reviewerName: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.neutral[900] },
  reviewDate: { fontFamily: 'Inter', fontSize: 11, color: colors.neutral[400], marginTop: 1 },
  reviewComment: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[700], lineHeight: 20, marginVertical: spacing.sm },
  noComment: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[400], fontStyle: 'italic', marginVertical: spacing.sm },
  replyBox: { backgroundColor: colors.surface.subtle, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm, gap: spacing.xs },
  replyLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 11, color: colors.primary[500], letterSpacing: 0.5 },
  replyText: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[700] },
  editReply: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: colors.accent[500], marginTop: spacing.xs },
  replyInput: { marginTop: spacing.md, gap: spacing.sm },
  replyInputField: { borderWidth: 1.5, borderColor: colors.neutral[200], borderRadius: radius.md, padding: spacing.md, fontFamily: 'Inter', fontSize: 13, color: colors.neutral[900], minHeight: 80, textAlignVertical: 'top' },
  replyBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, alignItems: 'center' },
  cancelBtn: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: colors.neutral[500] },
  submitReplyBtn: { backgroundColor: colors.primary[500], paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.pill },
  submitReplyText: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyText: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: colors.neutral[400] },
  emptySubtext: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[300], textAlign: 'center' },
});
