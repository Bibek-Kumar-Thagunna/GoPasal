import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { GText } from './GText';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { useTranslation } from '../i18n';

interface Props {
  name: string;
  imageUrl: string;
  rating: number;
  deliveryTime: string;
  isTopRated?: boolean;
  variant?: 'horizontal' | 'vertical';
  onPress?: () => void;
}

export const ShopCard = ({ name, imageUrl, rating, deliveryTime, isTopRated, variant = 'horizontal', onPress }: Props) => {
  const { t } = useTranslation();
  const isVertical = variant === 'vertical';
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isVertical ? styles.cardVertical : styles.cardHorizontal,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={[styles.imageWrapper, isVertical && styles.imageWrapperVertical]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={250}
        />
        {isTopRated && (
          <View style={styles.badge}>
            <Ionicons name="star" size={10} color="#fff" />
            <GText style={styles.badgeText} weight="semiBold">{t('search.topRated')}</GText>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <GText style={styles.title} weight="semiBold" numberOfLines={1}>{name}</GText>
        
        <View style={styles.metaRow}>
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={12} color={colors.star.filled} />
            <GText style={styles.ratingText} weight="medium">{rating.toFixed(1)}</GText>
          </View>
          <View style={styles.dot} />
          <GText style={styles.timeText}>{deliveryTime}</GText>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(0,0,0,0.03)',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionProperty: 'transform, box-shadow',
        transitionDuration: '200ms',
        transitionTimingFunction: 'ease-out',
      } as any,
    }),
  },
  cardHorizontal: {
    width: 200,
  },
  cardVertical: {
    width: '100%',
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageWrapper: {
    width: '100%',
    height: 120,
    backgroundColor: colors.neutral[100],
    position: 'relative',
  },
  imageWrapperVertical: {
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.gold[500],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: 16,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  ratingText: {
    fontSize: 12,
    color: colors.neutral[800],
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.neutral[300],
    marginHorizontal: 4,
  },
  timeText: {
    fontSize: 12,
    color: colors.neutral[500],
    fontFamily: 'Inter',
  },
});
