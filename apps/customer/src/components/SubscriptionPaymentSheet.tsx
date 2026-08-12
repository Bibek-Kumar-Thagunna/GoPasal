import React, { useMemo, useState } from 'react';
import { View, Modal, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { Button } from '../design-system/primitives/Button';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { submitPaymentFormPost } from '../utils/submit-payment-form';
import { apiClient } from '../services/api-client';
import { ENDPOINTS } from '../services/endpoints';
import type { PaymentChannelOption } from './PaymentBottomSheet';
import { PaymentBrandIcon } from './PaymentBrandIcon';

type Capabilities = {
  khalti?: boolean;
  esewa?: boolean;
  fonepay?: boolean;
  aggregator?: string;
};

type Props = {
  visible: boolean;
  planId: string;
  planName: string;
  amount: number;
  currencySymbol: string;
  capabilities: Capabilities;
  onClose: () => void;
  onPaymentStarted: (params: {
    billingIntentId: string;
    provider: string;
    mock?: boolean;
    paymentId?: string;
  }) => void;
};

const METHODS: {
  key: PaymentChannelOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'KHALTI', label: 'Khalti', icon: 'wallet-outline' },
  { key: 'ESEWA', label: 'eSewa', icon: 'card-outline' },
  { key: 'FONEPAY_QR', label: 'Fonepay QR', icon: 'qr-code-outline' },
];

export function SubscriptionPaymentSheet({
  visible,
  planId,
  planName,
  amount,
  currencySymbol,
  capabilities,
  onClose,
  onPaymentStarted,
}: Props) {
  const [selected, setSelected] = useState<PaymentChannelOption>('KHALTI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const options = useMemo(
    () =>
      METHODS.filter((m) => {
        if (m.key === 'KHALTI') return capabilities.khalti === true;
        if (m.key === 'ESEWA') return capabilities.esewa === true;
        if (m.key === 'FONEPAY_QR') return capabilities.fonepay === true;
        return false;
      }),
    [capabilities]
  );

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post<{
        data: {
          billingIntentId: string;
          paymentUrl?: string;
          deepLink?: string;
          formPost?: { action: string; fields: Record<string, string> };
          mock?: boolean;
          paymentId?: string;
        };
      }>(ENDPOINTS.billing.subscriptionInit, { planId, channel: selected });

      const pay = data.data;
      if (pay.formPost && Platform.OS === 'web') {
        submitPaymentFormPost(pay.formPost.action, pay.formPost.fields);
        return;
      }

      const url = pay.deepLink ?? pay.paymentUrl;
      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) await Linking.openURL(url);
        else if (pay.paymentUrl) await Linking.openURL(pay.paymentUrl);
      }

      onClose();
      onPaymentStarted({
        billingIntentId: pay.billingIntentId,
        provider: selected === 'ESEWA' ? 'ESEWA' : 'KHALTI',
        mock: pay.mock,
        paymentId: pay.paymentId,
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      setError(err?.response?.data?.error?.message ?? 'Payment could not start');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <GText variant="h3">Subscribe to {planName}</GText>
          <GText variant="bodySm" color={colors.neutral[500]}>
            {currencySymbol}{amount}
            {capabilities.aggregator === 'SKYPAY' ? ' · via SkyPay' : ''}
          </GText>
          <View style={styles.methods}>
            {options.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setSelected(m.key)}
                style={[styles.methodRow, selected === m.key && styles.methodSelected]}
              >
                {m.key === 'FONEPAY_QR' ? (
                  <View style={styles.methodIconFallback}>
                    <Ionicons name={m.icon} size={22} color={colors.primary[600]} />
                  </View>
                ) : (
                  <PaymentBrandIcon method={m.key} size={40} />
                )}
                <GText variant="body" weight="semibold">{m.label}</GText>
              </Pressable>
            ))}
          </View>
          {error ? <GText variant="caption" color={colors.error.main}>{error}</GText> : null}
          <Button
            label={loading ? 'Processing…' : `Pay ${currencySymbol}${amount}`}
            fullWidth
            size="lg"
            loading={loading}
            onPress={() => void handlePay()}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface.background,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
  },
  methods: { gap: spacing.sm },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  methodSelected: { borderColor: colors.primary[400], backgroundColor: colors.mint[50] },
  methodIconFallback: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.mint[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
