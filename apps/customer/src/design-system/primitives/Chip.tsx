import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GText } from './GText';
import { colors } from '../tokens/colors';
import { radius, spacing } from '../tokens/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChipProps {
  label: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  variant?: 'filled' | 'outlined' | 'tinted';
  size?: 'sm' | 'md';
}

export function Chip({
  label,
  icon,
  selected = false,
  onPress,
  variant = 'tinted',
  size = 'md',
}: ChipProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isSmall = size === 'sm';

  const bgColor = selected
    ? colors.primary[500]
    : variant === 'filled'
      ? colors.neutral[100]
      : variant === 'tinted'
        ? colors.mint[50]
        : 'transparent';

  const textColor = selected
    ? '#FFFFFF'
    : variant === 'tinted'
      ? colors.primary[700]
      : colors.neutral[700];

  const borderColor = variant === 'outlined'
    ? selected ? colors.primary[500] : colors.neutral[300]
    : 'transparent';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: isSmall ? 4 : 6,
          paddingHorizontal: isSmall ? 10 : 14,
          paddingVertical: isSmall ? 6 : 8,
          borderRadius: radius.pill,
          backgroundColor: bgColor,
          borderWidth: variant === 'outlined' ? 1.5 : 0,
          borderColor,
        },
        animatedStyle,
      ]}
    >
      {icon ? <View>{icon as any}</View> : null}
      <GText
        variant={isSmall ? 'caption' : 'bodySm'}
        weight="semibold"
        color={textColor}
      >
        {label}
      </GText>
    </AnimatedPressable>
  );
}
