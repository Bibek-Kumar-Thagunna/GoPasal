import React from 'react';
import { View, Pressable, StyleSheet, Platform, Image } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { colors } from '../design-system/tokens/colors';
import { radius, spacing } from '../design-system/tokens/spacing';
import { shadows } from '../design-system/tokens/shadows';
import { resolveCategoryIconUrl } from '../constants/category-icons';
import type { Category, StoreCategory } from '../types';

type ChipCategory = Pick<Category | StoreCategory, 'id' | 'name' | 'slug' | 'icon'>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CategoryChipProps {
  category: ChipCategory;
  selected?: boolean;
  onPress?: () => void;
  index?: number;
}

export function CategoryChip({ category, selected = false, onPress, index = 0 }: CategoryChipProps) {
  const scale = useSharedValue(1);
  const [hovered, setHovered] = React.useState(false);
  const isAll = category.id === 'all' || category.slug === 'all';
  const iconUrl =
    category.icon?.startsWith('http')
      ? category.icon
      : !isAll
        ? resolveCategoryIconUrl(category.slug, category.name)
        : null;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(index * 50).duration(400)}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onHoverIn={Platform.OS === 'web' ? () => setHovered(true) : undefined}
        onHoverOut={Platform.OS === 'web' ? () => setHovered(false) : undefined}
        style={[
          styles.chip,
          !selected && hovered && styles.chipHovered,
          selected && styles.chipSelected,
          animatedStyle,
        ]}
      >
        {isAll ? (
          <Ionicons
            name="apps-outline"
            size={20}
            color={selected ? '#FFFFFF' : colors.neutral[600]}
          />
        ) : iconUrl ? (
          <Image
            source={typeof iconUrl === 'string' ? { uri: iconUrl } : iconUrl}
            style={styles.chipIcon}
            resizeMode="contain"
          />
        ) : (
          <Ionicons
            name="storefront-outline"
            size={20}
            color={selected ? '#FFFFFF' : colors.neutral[600]}
          />
        )}
        <GText
          style={{ flexShrink: 1 }}
          variant="bodySm"
          weight="semibold"
          color={selected ? '#FFFFFF' : colors.neutral[800]}
          numberOfLines={1}
        >
          {category.name}
        </GText>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.card,
    marginRight: 0,
    minHeight: 40,
    flexShrink: 0,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        boxShadow: shadows.sm.web?.boxShadow,
      } as any,
      default: { ...shadows.sm, marginRight: spacing.sm },
    }),
  },
  chipHovered: {
    backgroundColor: colors.surface.subtle,
  },
  chipIcon: {
    width: 22,
    height: 22,
  },
  chipSelected: {
    backgroundColor: colors.primary[500],
    ...Platform.select({
      web: { boxShadow: shadows.md.web?.boxShadow } as any,
      default: shadows.md,
    }),
  },
});
