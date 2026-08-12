import React, { useState } from 'react';
import { TextInput, TextInputProps, View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { colors } from '../tokens/colors';
import { radius, spacing } from '../tokens/spacing';
import { typography } from '../tokens/typography';
import { GText } from './GText';

const AnimatedView = Animated.createAnimatedComponent(View as any) as any;

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'search';
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  variant = 'default',
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [colors.neutral[200], colors.primary[400]]
    ),
    borderWidth: withTiming(focusAnim.value ? 2 : 1.5, { duration: 150 }),
  }));

  const handleFocus = () => {
    setFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    setFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
  };

  const isSearch = variant === 'search';

  return (
    <View style={{ gap: spacing.xs }}>
      {label && (
        <GText variant="bodySm" weight="medium" color={colors.neutral[600]}>
          {label}
        </GText>
      )}
      <AnimatedView
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isSearch ? colors.neutral[100] : colors.surface.card,
            borderRadius: isSearch ? radius.pill : radius.lg,
            paddingHorizontal: spacing.lg,
            height: isSearch ? 48 : 52,
            gap: spacing.sm,
          },
          animatedBorderStyle,
        ]}
      >
        {leftIcon ? <View>{leftIcon as any}</View> : null}
        <TextInput
          placeholderTextColor={colors.neutral[400]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            {
              flex: 1,
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily,
              color: colors.neutral[900],
              paddingVertical: 0,
              // Remove the browser's default focus outline on web — the
              // wrapper already shows an animated green focus border.
              outlineStyle: 'none',
              outlineWidth: 0,
            } as any,
            style,
          ]}
          {...props}
        />
        {rightIcon ? <View>{rightIcon as any}</View> : null}
      </AnimatedView>
      {error && (
        <GText variant="caption" color={colors.error.main}>
          {error}
        </GText>
      )}
    </View>
  );
}
