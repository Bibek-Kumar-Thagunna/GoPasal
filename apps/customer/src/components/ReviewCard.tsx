import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GText } from './GText';
import { StarRating } from './StarRating';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { name: string };
  ownerReply?: string;
  ownerRepliedAt?: string;
}

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <GText style={styles.avatarText} weight="bold">{review.user.name.charAt(0)}</GText>
        </View>
        <View style={styles.headerText}>
          <GText weight="semiBold" style={{ fontSize: 14 }}>{review.user.name}</GText>
          <GText style={styles.date}>{new Date(review.createdAt).toLocaleDateString('en-NP')}</GText>
        </View>
        <StarRating rating={review.rating} size={14} disabled />
      </View>

      {review.comment && (
        <GText style={styles.comment}>{review.comment}</GText>
      )}

      {review.ownerReply && (
        <View style={styles.replyBox}>
          <View style={styles.replyHeader}>
            <Ionicons name="storefront" size={12} color={colors.primary[500]} />
            <GText weight="semiBold" style={styles.replyTitle}>Store Owner Reply</GText>
            {review.ownerRepliedAt && (
              <GText style={styles.replyDate}>{new Date(review.ownerRepliedAt).toLocaleDateString('en-NP')}</GText>
            )}
          </View>
          <GText style={styles.replyComment}>{review.ownerReply}</GText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: colors.primary[600],
    fontSize: 16,
  },
  headerText: {
    flex: 1,
  },
  date: {
    fontSize: 11,
    color: colors.neutral[400],
    marginTop: 2,
  },
  comment: {
    fontSize: 14,
    color: colors.neutral[800],
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  replyBox: {
    marginTop: spacing.md,
    backgroundColor: colors.neutral[50],
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary[400],
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  replyTitle: {
    fontSize: 12,
    color: colors.primary[700],
    flex: 1,
  },
  replyDate: {
    fontSize: 10,
    color: colors.neutral[400],
  },
  replyComment: {
    fontSize: 13,
    color: colors.neutral[700],
    lineHeight: 18,
  },
});
