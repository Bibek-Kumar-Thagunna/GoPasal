import React from 'react';
import { StyleSheet, Pressable, Platform, Image, View } from 'react-native';
import { GText } from './GText';
import { colors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { resolveCategoryIconUrl } from '../constants/category-icons';

interface Props {
  title: string;
  /** Store category slug from API (e.g. photo-print, grocery). */
  slug?: string;
  onPress?: () => void;
  /** Used to pick a color from the palette for visual variety. */
  index?: number;
  /** Diameter of the icon badge. Defaults to 64. */
  size?: number;
}

const PALETTE: string[] = [
  '#E7F5F0', // jade
  '#FFF3D6', // gold
  '#FDE8D6', // marigold
  '#E7EEFB', // soft blue
  '#F2E8FB', // soft purple
  '#FBE7EF', // soft pink
  '#E4F4F7', // teal
  '#EBF5E1', // leafy green
];

export const CategoryCard = ({ title, slug, onPress, index = 0, size = 64 }: Props) => {
  const bg = PALETTE[index % PALETTE.length];
  const iconUrl = resolveCategoryIconUrl(slug, title);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View
        style={[
          styles.badge,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        ]}
      >
        <Image
          source={typeof iconUrl === 'string' ? { uri: iconUrl } : iconUrl}
          style={{ width: Math.round(size * 0.58), height: Math.round(size * 0.58) }}
          resizeMode="contain"
        />
      </View>
      <GText style={styles.title} weight="semiBold" numberOfLines={2}>
        {title}
      </GText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    ...Platform.select({
      web: { transition: 'transform 0.18s ease', cursor: 'pointer' } as any,
      default: {},
    }),
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  title: {
    fontSize: 11.5,
    lineHeight: 14,
    textAlign: 'center',
    color: colors.neutral[700],
    marginTop: 2,
  },
});
