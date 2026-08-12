import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PaymentMethod } from '../types';
import { PAYMENT_BRAND_ASSETS } from '../constants/payment-brands';
import { colors } from '../design-system/tokens/colors';
import { radius } from '../design-system/tokens/spacing';

type PaymentBrandIconProps = {
  method: PaymentMethod | 'COD';
  size?: number;
};

function BrandImageMark({
  method,
  size,
  rounded,
}: {
  method: PaymentMethod;
  size: number;
  rounded?: boolean;
}) {
  const source = PAYMENT_BRAND_ASSETS[method];
  if (!source) {
    return null;
  }

  return (
    <View
      style={[
        styles.brandWrap,
        {
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : radius.md,
          backgroundColor: rounded ? 'transparent' : colors.neutral[0],
        },
      ]}
    >
      <Image
        source={source}
        style={{
          width: rounded ? size : size * 0.72,
          height: rounded ? size : size * 0.72,
          borderRadius: rounded ? size / 2 : 0,
        }}
        resizeMode="contain"
        accessibilityLabel={method}
      />
    </View>
  );
}

export function PaymentBrandIcon({ method, size = 40 }: PaymentBrandIconProps) {
  if (method === 'COD') {
    return (
      <View style={[styles.wrap, { width: size, height: size, backgroundColor: colors.mint[100] }]}>
        <Ionicons name="cash-outline" size={size * 0.5} color={colors.primary[600]} />
      </View>
    );
  }

  if (method === 'KHALTI') {
    return <BrandImageMark method="KHALTI" size={size} />;
  }

  if (method === 'ESEWA') {
    return <BrandImageMark method="ESEWA" size={size} rounded />;
  }

  return (
    <View style={[styles.wrap, { width: size, height: size, backgroundColor: colors.mint[100] }]}>
      <Ionicons name="wallet-outline" size={size * 0.5} color={colors.primary[600]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[150],
    overflow: 'hidden',
  },
});
