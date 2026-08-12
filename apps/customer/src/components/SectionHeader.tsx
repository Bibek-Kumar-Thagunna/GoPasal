import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { GText } from '../design-system/primitives/GText';
import { colors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <GText variant="h3" color={colors.neutral[900]}>
        {title}
      </GText>
      {action && (
        <Pressable onPress={onAction} style={styles.actionBtn}>
          <GText variant="bodySm" weight="semibold" color={colors.primary[600]}>
            {action}
          </GText>
          <Ionicons name="chevron-forward" size={14} color={colors.primary[600]} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 0 : spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
