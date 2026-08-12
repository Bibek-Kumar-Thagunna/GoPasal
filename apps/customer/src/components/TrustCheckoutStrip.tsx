import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { useTranslation } from '../i18n';

type Props = {
  variant?: 'checkout' | 'order';
};

export function TrustCheckoutStrip({ variant = 'checkout' }: Props) {
  const { t } = useTranslation();
  const isCheckout = variant === 'checkout';
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Ionicons name="shield-checkmark" size={18} color={colors.primary[600]} />
        <GText variant="bodySm" weight="semibold" color={colors.neutral[800]}>
          {isCheckout ? t('trust.secureCheckout') : t('trust.protected')}
        </GText>
      </View>
      <GText variant="caption" color={colors.neutral[500]} style={styles.copy}>
        {isCheckout ? t('trust.secureCopy') : t('trust.orderCopy')}
      </GText>
      <View style={styles.badges}>
        <Badge icon="lock-closed-outline" label={t('trust.encrypted')} />
        <Badge icon="wallet-outline" label={t('trust.escrow')} />
        <Badge icon="storefront-outline" label={t('trust.localShops')} />
      </View>
    </View>
  );
}

function Badge({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.badge}>
      <Ionicons name={icon} size={14} color={colors.primary[700]} />
      <GText variant="caption" color={colors.primary[800]} weight="medium">
        {label}
      </GText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.mint[50],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary[100],
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copy: { lineHeight: 18 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
});
