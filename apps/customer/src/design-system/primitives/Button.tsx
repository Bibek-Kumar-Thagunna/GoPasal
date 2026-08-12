import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GText } from './GText';
import { colors } from '../tokens/colors';
import { radius } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import { shadows } from '../tokens/shadows';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary[500], text: '#FFFFFF' },
  secondary: { bg: colors.mint[100], text: colors.primary[700] },
  ghost: { bg: 'transparent', text: colors.primary[600] },
  outline: { bg: 'transparent', text: colors.primary[600], border: colors.primary[300] },
  danger: { bg: colors.error.main, text: '#FFFFFF' },
};

const sizeStyles: Record<ButtonSize, { height: number; px: number; fontSize: number }> = {
  sm: { height: 36, px: 14, fontSize: 13 },
  md: { height: 48, px: 20, fontSize: 15 },
  lg: { height: 56, px: 28, fontSize: 17 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
      disabled={disabled || loading}
      style={[
        {
          height: s.height,
          paddingHorizontal: s.px,
          borderRadius: radius.xl,
          backgroundColor: v.bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
          ...(v.border ? { borderWidth: 1.5, borderColor: v.border } : {}),
          ...(fullWidth ? { width: '100%' } : {}),
          ...(variant === 'primary' ? shadows.md : {}),
        },
        animatedStyle,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <GText
            variant={size === 'sm' ? 'buttonSm' : 'button'}
            color={v.text}
          >
            {label}
          </GText>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </AnimatedPressable>
  );
}
