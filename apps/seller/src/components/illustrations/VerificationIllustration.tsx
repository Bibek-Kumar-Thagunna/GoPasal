import React from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import { useLanguageStore } from '../../store/language.store';

interface Props {
  width?: number;
  height?: number;
}

export function VerificationIllustration({ width, height }: Props) {
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
          source={require('../../../assets/illustrations/verification.png')}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.heroTitle}>{t('verify.illustration.title')}</Text>
      <Text style={styles.heroSubtitle}>{t('verify.illustration.subtitle')}</Text>
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
    marginTop: spacing['2xl'],
    fontFamily: 'Poppins-Bold',
    fontSize: 29,
    color: colors.primary[700],
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  heroSubtitle: {
    marginTop: spacing.md,
    fontFamily: 'Inter-Medium',
    fontSize: 17,
    color: colors.neutral[600],
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 26,
    letterSpacing: 0.15,
  },
});
