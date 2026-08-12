import React from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import { useLanguageStore } from '../../store/language.store';

interface Props {
  width?: number;
  height?: number;
}

export function CategoryIllustration({ width, height }: Props) {
  const { t } = useLanguageStore();
  const { width: winW } = useWindowDimensions();
  const computed = Math.min(
    560,
    Math.max(380, Math.round(Math.min(winW, 1440) * 0.42)),
  );
  const size = Math.round(Math.max(width ?? 0, height ?? 0, computed));

  return (
    <View style={styles.root}>
      <View style={styles.artColumn}>
        <Image
          source={require('../../../assets/illustrations/category-select.png')}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessibilityLabel={t('category.illustrationTitle')}
        />
      </View>
      <Text style={styles.heroTitle}>{t('category.illustrationTitle')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    alignItems: 'center',
  },
  artColumn: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  heroTitle: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: colors.primary[700],
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
    maxWidth: 420,
  },
});
