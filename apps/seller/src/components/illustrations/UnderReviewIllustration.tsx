import React from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import { useLanguageStore } from '../../store/language.store';

const ART_NATIVE_W = 340;
const ART_NATIVE_H = 290;

interface Props {
  width?: number;
  height?: number;
}

export function UnderReviewIllustration({ width, height }: Props) {
  const { t } = useLanguageStore();
  const { width: winW } = useWindowDimensions();
  const computedW = Math.min(
    620,
    Math.max(440, Math.round(Math.min(winW, 1440) * 0.48)),
  );
  const imgW = Math.round(Math.max(width ?? 0, computedW));
  const imgH = Math.round(
    height ?? (imgW * ART_NATIVE_H) / ART_NATIVE_W,
  );

  return (
    <View style={styles.root}>
      <View style={styles.artColumn}>
        <Image
          source={require('../../../assets/illustrations/under-review.png')}
          style={{ width: imgW, height: imgH }}
          resizeMode="contain"
          accessibilityLabel={t('review.title')}
        />
      </View>
      <Text style={styles.heroTitle}>{t('review.title')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    alignItems: 'center',
  },
  artColumn: {
    marginTop: spacing.sm,
    alignItems: 'center',
    width: '100%',
  },
  heroTitle: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: colors.primary[700],
    textAlign: 'center',
    letterSpacing: -0.45,
    lineHeight: 30,
    maxWidth: 440,
  },
});
