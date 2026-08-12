import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GText } from './GText';
import { colors } from '../tokens/colors';
import { radius, spacing } from '../tokens/spacing';

type BadgeVariant = 'discount' | 'delivery' | 'status' | 'count' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantConfig: Record<BadgeVariant, { bg: string; text: string }> = {
  discount: { bg: colors.accent[500], text: '#FFFFFF' },
  delivery: { bg: colors.primary[500], text: '#FFFFFF' },
  status: { bg: colors.success.light, text: colors.success.dark },
  count: { bg: colors.accent[500], text: '#FFFFFF' },
  info: { bg: colors.mint[100], text: colors.primary[700] },
};

export function Badge({ label, variant = 'info', size = 'sm' }: BadgeProps) {
  const config = variantConfig[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={{
        backgroundColor: config.bg,
        paddingHorizontal: isSmall ? 6 : 10,
        paddingVertical: isSmall ? 2 : 4,
        borderRadius: radius.sm,
        alignSelf: 'flex-start',
      }}
    >
      <GText
        variant="caption"
        weight="semibold"
        color={config.text}
        style={{ fontSize: isSmall ? 10 : 11 }}
      >
        {label}
      </GText>
    </View>
  );
}

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '?';

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.mint[200],
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {uri ? (
        <View style={{ width: size, height: size, backgroundColor: colors.mint[100] }} />
      ) : (
        <GText
          variant="bodySm"
          weight="bold"
          color={colors.primary[700]}
          style={{ fontSize: size * 0.38 }}
        >
          {initials}
        </GText>
      )}
    </View>
  );
}

interface IconBoxProps {
  icon: React.ReactNode;
  size?: number;
  bg?: string;
  rounded?: boolean;
}

export function IconBox({
  icon,
  size = 44,
  bg = colors.mint[50],
  rounded = true,
}: IconBoxProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? size / 2 : radius.md,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon as any}
    </View>
  );
}
