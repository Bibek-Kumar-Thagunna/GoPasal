import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { Button } from '../design-system/primitives/Button';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { submitPaymentFormPost } from '../utils/submit-payment-form';
import { apiClient } from '../services/api-client';
import { ENDPOINTS } from '../services/endpoints';
import type { PaymentMethod } from '../types';
import { PaymentBrandIcon } from './PaymentBrandIcon';

export type PaymentChannelOption = 'COD' | 'ESEWA' | 'KHALTI' | 'FONEPAY_QR';

type PaymentCapabilities = {
  cod?: boolean;
  khalti?: boolean;
  esewa?: boolean;
  fonepay?: boolean;
  skypay?: boolean;
  aggregator?: string;
};

type InitResult = {
  paymentId?: string;
  billingIntentId?: string;
  channel: string;
  provider: string;
  status: string;
  paymentUrl?: string;
  qrPayload?: string;
  deepLink?: string;
  providerRef?: string;
  formPost?: { action: string; fields: Record<string, string> };
  mock?: boolean;
};

type PaymentBottomSheetProps = {
  visible: boolean;
  orderId: string;
  amount: number;
  currencySymbol: string;
  capabilities: PaymentCapabilities;
  initialChannel?: PaymentChannelOption;
  onClose: () => void;
  onPaymentStarted: (params: {
    orderId: string;
    provider: string;
    channel: PaymentChannelOption;
    mock?: boolean;
    paymentId?: string;
  }) => void;
  onCodConfirmed: () => void;
};

const METHODS: {
  key: PaymentChannelOption;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'COD', label: 'Cash on Delivery', subtitle: 'Pay when delivered', icon: 'cash-outline' },
  { key: 'KHALTI', label: 'Khalti', subtitle: 'Wallet', icon: 'wallet-outline' },
  { key: 'ESEWA', label: 'eSewa', subtitle: 'Wallet', icon: 'card-outline' },
  { key: 'FONEPAY_QR', label: 'Fonepay QR', subtitle: 'Scan & pay', icon: 'qr-code-outline' },
];

function isMethodEnabled(key: PaymentChannelOption, caps: PaymentCapabilities): boolean {
  if (key === 'COD') return caps.cod !== false;
  if (key === 'KHALTI') return caps.khalti === true;
  if (key === 'ESEWA') return caps.esewa === true;
  if (key === 'FONEPAY_QR') return caps.fonepay === true;
  return false;
}

export function PaymentBottomSheet({
  visible,
  orderId,
  amount,
  currencySymbol,
  capabilities,
  initialChannel,
  onClose,
  onPaymentStarted,
  onCodConfirmed,
}: PaymentBottomSheetProps) {
  const [selected, setSelected] = useState<PaymentChannelOption>(initialChannel ?? 'KHALTI');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialChannel) setSelected(initialChannel);
  }, [initialChannel, visible]);

  const options = useMemo(
    () => METHODS.filter((m) => isMethodEnabled(m.key, capabilities)),
    [capabilities]
  );

  const handlePay = async () => {
    setError('');
    setLoading(true);
    try {
      if (selected === 'COD') {
        onCodConfirmed();
        return;
      }

      const { data } = await apiClient.post<{ data: InitResult }>(
        ENDPOINTS.payment.checkoutInit,
        { orderId, channel: selected }
      );
      const pay = data.data;

      if (pay.formPost && Platform.OS === 'web') {
        submitPaymentFormPost(pay.formPost.action, pay.formPost.fields);
        return;
      }

      const url = pay.deepLink || pay.paymentUrl;
      if (url) {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) await Linking.openURL(url);
        else if (pay.paymentUrl) await Linking.openURL(pay.paymentUrl);
      }

      onPaymentStarted({
        orderId,
        provider: pay.provider === 'SKYPAY' ? (selected === 'ESEWA' ? 'ESEWA' : 'KHALTI') : pay.provider,
        channel: selected,
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

  const isWeb = Platform.OS === 'web';

  return (
    <Modal visible={visible} animationType={isWeb ? 'fade' : 'slide'} transparent onRequestClose={onClose}>
      <Pressable style={[styles.overlay, isWeb && styles.overlayWeb]} onPress={onClose}>
        <Pressable style={[styles.sheet, isWeb && styles.sheetWeb]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <GText variant="h3">Complete payment</GText>
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
                {m.key === 'FONEPAY_QR' || m.key === 'COD' ? (
                  <View style={styles.methodIconFallback}>
                    <Ionicons name={m.icon} size={22} color={colors.primary[600]} />
                  </View>
                ) : (
                  <PaymentBrandIcon method={m.key} size={40} />
                )}
                <View style={{ flex: 1 }}>
                  <GText variant="body" weight="semibold">{m.label}</GText>
                  <GText variant="caption" color={colors.neutral[500]}>{m.subtitle}</GText>
                </View>
                <Ionicons
                  name={selected === m.key ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={colors.primary[500]}
                />
              </Pressable>
            ))}
          </View>

          {error ? (
            <GText variant="caption" color={colors.error.main}>{error}</GText>
          ) : null}

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

export function mapOrderMethodToChannel(method: PaymentMethod): PaymentChannelOption {
  return method;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  overlayWeb: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface.background,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
    gap: spacing.md,
  },
  sheetWeb: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radius['2xl'],
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  methods: {
    gap: spacing.sm,
    ...(Platform.OS === 'web' ? { flexDirection: 'row', flexWrap: 'wrap' } : {}),
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    ...(Platform.OS === 'web' ? { flexGrow: 1, flexBasis: '48%', minWidth: 200 } : {}),
  },
  methodSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.mint[50],
  },
  methodIconFallback: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.mint[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
