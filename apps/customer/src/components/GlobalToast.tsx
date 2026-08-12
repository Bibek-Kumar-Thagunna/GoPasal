import React, { useEffect } from 'react';
import { StyleSheet, Pressable, Platform, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { useUIStore } from '../store/ui.store';

export function GlobalToast() {
  const { genericToast, hideToast } = useUIStore();

  useEffect(() => {
    if (genericToast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [genericToast, hideToast]);

  if (!genericToast) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify()}
      exiting={FadeOutDown.duration(200)}
      style={styles.toastContainer}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons 
          name={(genericToast.icon as any) || "information-circle"} 
          size={20} 
          color={colors.primary[600]} 
        />
        <GText variant="bodySm" weight="semibold" color={colors.neutral[900]}>
          {genericToast.message}
        </GText>
      </View>
      {genericToast.actionLabel && genericToast.onAction && (
        <Pressable 
          style={styles.actionBtn}
          onPress={() => {
            hideToast();
            genericToast.onAction?.();
          }}
        >
          <GText variant="bodySm" weight="bold" color={colors.primary[600]}>
            {genericToast.actionLabel}
          </GText>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 80 : 100, // Above bottom bar/tabs
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 320,
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    zIndex: 9999,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 }
    }),
  },
  actionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.primary[50],
    borderRadius: radius.pill,
  },
});
