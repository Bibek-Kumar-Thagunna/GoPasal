import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GText } from '../design-system/primitives/GText';
import { colors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import type { Cart } from '../types';
import { getDeliveryFeeDisplay } from '../utils/delivery-fee';
import { useTranslation } from '../i18n';

type DeliveryFeeLineProps = {
  cart: Cart | null | undefined;
  pickup?: boolean;
};

export function DeliveryFeeLine({ cart, pickup = false }: DeliveryFeeLineProps) {
  const { t } = useTranslation();

  if (pickup) {
    return (
      <View style={styles.wrap}>
        <View style={styles.row}>
          <GText variant="body" color={colors.neutral[600]}>{t('common.deliveryFee')}</GText>
          <GText variant="body" weight="medium" color={colors.neutral[500]}>
            {t('checkout.pickupLabel', { defaultValue: 'Store pickup' })}
          </GText>
        </View>
        <GText variant="caption" color={colors.neutral[500]} style={styles.hint}>
          {t('checkout.pickupFeeHint', { defaultValue: 'No delivery charge — you collect the order.' })}
        </GText>
      </View>
    );
  }

  const delivery = getDeliveryFeeDisplay(cart, t);
  const valueColor =
    delivery.tone === 'free'
      ? colors.success.dark
      : delivery.tone === 'muted'
        ? colors.neutral[500]
        : colors.neutral[900];

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <GText variant="body" color={colors.neutral[600]}>{t('common.deliveryFee')}</GText>
        <GText variant="body" weight="medium" color={valueColor}>
          {delivery.label}
        </GText>
      </View>
      {delivery.hint ? (
        <GText variant="caption" color={colors.neutral[500]} style={styles.hint}>
          {delivery.hint}
        </GText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hint: { lineHeight: 18 },
});
