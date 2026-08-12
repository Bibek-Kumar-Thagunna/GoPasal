import React, { useEffect } from 'react';
import { StyleSheet, DimensionValue, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../design-system/tokens/colors';
import { radius } from '../design-system/tokens/spacing';

interface ShimmerProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

export function Shimmer({ width = '100%', height = 20, borderRadius = radius.md, style }: ShimmerProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.bezier(0.4, 0.0, 0.2, 1) }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(animatedValue.value, [0, 1], [-200, 200]);
    return { transform: [{ translateX }] };
  });

  return (
    <Animated.View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmerWrapper, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[200],
    overflow: 'hidden',
  },
  shimmerWrapper: {
    ...StyleSheet.absoluteFillObject,
    width: '200%',
  },
});
