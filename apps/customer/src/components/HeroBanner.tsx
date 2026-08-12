import React from 'react';
import { View, StyleSheet, Pressable, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from './GText';
import { HeroVisual } from './HeroVisual';
import { colors } from '../design-system/tokens/colors';
import { radius } from '../design-system/tokens/spacing';
import { useTranslation, type TranslationKey } from '../i18n';

const TRUST: { icon: 'leaf-outline' | 'shield-checkmark-outline' | 'wallet-outline'; labelKey: TranslationKey }[] = [
  { icon: 'leaf-outline', labelKey: 'hero.trustFresh' },
  { icon: 'shield-checkmark-outline', labelKey: 'hero.trustGenuine' },
  { icon: 'wallet-outline', labelKey: 'hero.trustPay' },
];

export const HeroBanner = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompact = width < 600;
  const isWide = width >= 1024;

  // On mobile devices, we use MobilePromoCarousel instead
  if (width < 768 && !isWeb) {
    return null;
  }

  const titleSize = isCompact ? 32 : isWide ? 50 : 40;

  return (
    <View style={[styles.container, { paddingTop: isWeb ? 96 : 56 }]}>
      <View style={[styles.content, isWide ? styles.contentRow : styles.contentCol]}>
        <Animated.View
          entering={FadeInDown.delay(80).duration(550)}
          style={[styles.textCol, !isWide && styles.textColCentered]}
        >
          <View style={[styles.eyebrowRow, !isWide && styles.centerRow]}>
            <Ionicons name="location-sharp" size={14} color={colors.accent[500]} />
            <GText style={styles.eyebrow} weight="bold">{t('hero.eyebrow')}</GText>
          </View>

          <GText
            style={[
              styles.title,
              { fontSize: titleSize, lineHeight: Math.round(titleSize * 1.08) },
              !isWide && { textAlign: 'center' },
            ]}
            weight="bold"
          >
            {t('hero.title')}
          </GText>

          <GText style={[styles.subtitle, isCompact && { fontSize: 15 }, !isWide && { textAlign: 'center' }]}>
            {t('hero.subtitle')}
          </GText>

          <View style={[styles.ctaRow, !isWide && styles.centerRow]}>
            <Pressable style={styles.ctaPrimary} onPress={() => router.push('/(tabs)/categories' as any)}>
              <GText style={styles.ctaPrimaryText} weight="bold">{t('hero.startShopping')}</GText>
              <Ionicons name="arrow-forward" size={17} color="#fff" />
            </Pressable>
            <Pressable style={styles.ctaSecondary} onPress={() => router.push('/search?tab=shops' as any)}>
              <Ionicons name="storefront-outline" size={16} color={colors.primary[700]} />
              <GText style={styles.ctaSecondaryText} weight="semiBold">{t('hero.exploreShops')}</GText>
            </Pressable>
          </View>

          <View style={[styles.trustRow, !isWide && styles.centerRow]}>
            {TRUST.map((item) => (
              <View key={item.labelKey} style={styles.trustItem}>
                <Ionicons name={item.icon} size={15} color={colors.primary[600]} />
                <GText style={styles.trustText} weight="medium">{t(item.labelKey)}</GText>
              </View>
            ))}
          </View>
        </Animated.View>

        {isWide && (
          <View style={styles.visualCol}>
            <HeroVisual />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'visible',
    position: 'relative',
    paddingBottom: 40,
    backgroundColor: colors.surface.background,
  },
  content: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  contentCol: {
    flexDirection: 'column',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  textColCentered: {
    alignItems: 'center',
  },
  visualCol: {
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  visualColCompact: {
    width: '100%',
    alignItems: 'center',
    marginTop: 28,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  centerRow: {
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11.5,
    color: colors.accent[700],
    letterSpacing: 1,
  },
  title: {
    color: colors.neutral[900],
    letterSpacing: -1,
    marginBottom: 14,
  },
  subtitle: {
    fontSize: 17,
    color: colors.neutral[600],
    marginBottom: 26,
    lineHeight: 26,
    maxWidth: 460,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.pill,
    shadowColor: colors.primary[700],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s ease, background-color 0.2s ease',
      } as any,
    }),
  },
  ctaPrimaryText: {
    color: '#fff',
    fontSize: 16,
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface.card,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
      } as any,
    }),
  },
  ctaSecondaryText: {
    color: colors.primary[700],
    fontSize: 15,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    flexWrap: 'wrap',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 13,
    color: colors.neutral[600],
  },
});
