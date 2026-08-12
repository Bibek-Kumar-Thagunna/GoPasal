import React from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import { useLanguageStore } from '../../store/language.store';

const STOREFRONT_ART_PX = 1024;
const STOREFRONT_MINT_DISC_DIAMETER_PX = 800;

interface Props {
  width?: number;
  height?: number;
}

const discFill = 'rgba(45, 139, 106, 0.12)';

export function StorefrontIllustration({ width, height }: Props) {
  const { t } = useLanguageStore();
  const { width: winW } = useWindowDimensions();
  const computed = Math.min(
    480,
    Math.max(320, Math.round(Math.min(winW, 1440) * 0.38)),
  );
  const size = Math.round(Math.max(width ?? 0, height ?? 0, computed));
  const clipDiameter = size * (STOREFRONT_MINT_DISC_DIAMETER_PX / STOREFRONT_ART_PX);
  const inset = (clipDiameter - size) / 2;

  return (
    <View style={styles.root}>
      <View style={styles.discColumn}>
        <View
          style={[
            styles.discClip,
            {
              width: clipDiameter,
              height: clipDiameter,
              borderRadius: clipDiameter / 2,
              backgroundColor: discFill,
            },
          ]}
        >
          <Image
            source={require('../../../assets/illustrations/storefront.png')}
            style={[styles.squareArt, { width: size, height: size, left: inset, top: inset }]}
            resizeMode="contain"
          />
        </View>
      </View>

      <Text style={styles.heroTitle}>{t('auth.illustration.title')}</Text>
      <Text style={styles.heroSubtitle}>{t('auth.illustration.subtitle')}</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="trending-up" size={20} color="#10B981" />
          <Text style={styles.statValue}>100%</Text>
          <Text style={styles.statLabel}>Direct Payouts</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="flash-outline" size={20} color="#3B82F6" />
          <Text style={styles.statValue}>Instant</Text>
          <Text style={styles.statLabel}>Order Dispatch</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#8B5CF6" />
          <Text style={styles.statValue}>Verified</Text>
          <Text style={styles.statLabel}>Seller Protection</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    alignItems: 'center',
  },
  discColumn: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  discClip: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(45, 139, 106, 0.2)',
  },
  squareArt: {
    position: 'absolute',
  },
  heroTitle: {
    marginTop: spacing.xl,
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  heroSubtitle: {
    marginTop: spacing.xs,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 28,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#0F172A',
    marginTop: 6,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
