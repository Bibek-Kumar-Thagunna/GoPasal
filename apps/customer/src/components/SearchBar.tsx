import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../design-system/primitives/Input';
import { colors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { GText } from '../design-system/primitives/GText';
import { useTranslation } from '../i18n';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  placeholder?: string;
  editable?: boolean;
}

export function SearchBar({
  value,
  onChangeText,
  onPress,
  placeholder,
  editable = true,
}: SearchBarProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t('header.searchPlaceholder');
  if (!editable && onPress) {
    return (
      <View style={styles.fakeSearchBar}>
        <Pressable onPress={onPress} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: '100%' }}>
          <Ionicons name="search-outline" size={20} color={colors.neutral[400]} />
          <GText variant="body" color={colors.neutral[400]}>
            {resolvedPlaceholder}
          </GText>
        </Pressable>
      </View>
    );
  }

  return (
    <Input
      variant="search"
      placeholder={resolvedPlaceholder}
      value={value}
      onChangeText={onChangeText}
      leftIcon={<Ionicons name="search-outline" size={20} color={colors.neutral[400]} />}
    />
  );
}

const styles = StyleSheet.create({
  fakeSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral[100],
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    height: 48,
  },
});
