import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/spacing';
import { shadows } from '../tokens/shadows';
import { spacing } from '../tokens/spacing';

interface CardProps extends ViewProps {
  variant?: 'elevated' | 'outlined' | 'flat' | 'tinted';
  padding?: keyof typeof spacing;
  pressable?: boolean;
  onPress?: () => void;
  animated?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  variant = 'elevated',
  padding = 'lg',
  pressable = false,
  onPress,
  animated = true,
  style,
  children,
  ...props
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardStyles = {
    elevated: {
      backgroundColor: colors.surface.card,
      ...shadows.md,
    },
    outlined: {
      backgroundColor: colors.surface.card,
      borderWidth: 1,
      borderColor: colors.neutral[200],
    },
    flat: {
      backgroundColor: colors.neutral[100],
    },
    tinted: {
      backgroundColor: colors.surface.tint,
    },
  };

  const baseStyle = {
    borderRadius: radius.xl,
    padding: spacing[padding],
    overflow: 'hidden' as const,
    ...cardStyles[variant],
  };

  if (pressable || onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 15, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
        style={[baseStyle, animatedStyle, style]}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      entering={animated ? FadeIn.duration(300) : undefined}
      style={[baseStyle, style]}
      {...props}
    >
      {children}
    </Animated.View>
  );
}
