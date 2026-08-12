import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  title?: string;
  targetTimeMs?: number;
  onPress?: () => void;
}

export function FlashSaleTicker({
  title = '⚡ Flash Deals - Up to 50% Off!',
  targetTimeMs = Date.now() + 4 * 3600 * 1000 + 32 * 60 * 1000,
  onPress,
}: Props) {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, targetTimeMs - Date.now());
      const hours = Math.floor(diff / (3600 * 1000));
      const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTimeMs]);

  const format2Digits = (n: number) => n.toString().padStart(2, '0');

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <AnimatedPressable
        style={[styles.banner, animStyle]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      >
        <View style={styles.left}>
          <Ionicons name="flash" size={20} color="#FEF08A" />
          <GText style={styles.title} weight="bold">{title}</GText>
        </View>
        <View style={styles.right}>
          <GText style={styles.endsIn} weight="medium">Ends in</GText>
          <View style={styles.timerBadge}>
            <GText style={styles.timerText} weight="bold">
              {format2Digits(timeLeft.hours)}:{format2Digits(timeLeft.minutes)}:{format2Digits(timeLeft.seconds)}
            </GText>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#0F766E', // Deep emerald/teal
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    flexWrap: 'wrap',
    gap: spacing.sm,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionProperty: 'transform, box-shadow',
        transitionDuration: '200ms',
        transitionTimingFunction: 'ease-out',
        boxShadow: '0 4px 14px rgba(15, 118, 110, 0.25)',
      } as any,
    }),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  endsIn: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  timerBadge: {
    backgroundColor: '#042F2C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  timerText: {
    color: '#FEF08A',
    fontSize: 13,
    letterSpacing: 1,
  },
});
