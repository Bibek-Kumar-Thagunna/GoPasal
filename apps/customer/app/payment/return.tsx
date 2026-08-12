import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../../src/design-system/primitives/GText';
import { Button } from '../../src/design-system/primitives/Button';
import { TrustCheckoutStrip } from '../../src/components/TrustCheckoutStrip';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing } from '../../src/design-system/tokens/spacing';
import { apiClient } from '../../src/services/api-client';
import { ENDPOINTS } from '../../src/services/endpoints';
import { buildPaymentCallback } from '../../src/utils/payment-callback';
import type { Order } from '../../src/types';
import { useTranslation } from '../../src/i18n';

function formatErr(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { error?: { message?: string } } | undefined;
    return body?.error?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function PaymentReturnScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    orderId?: string;
    billingIntentId?: string;
    purpose?: string;
    pidx?: string;
    status?: string;
    provider?: string;
    mock?: string;
    paymentId?: string;
    data?: string;
    tx?: string;
    transaction_id?: string;
  }>();

  const orderId = params.orderId ?? '';
  const billingIntentId = params.billingIntentId ?? '';
  const purpose = params.purpose ?? '';
  const provider = (params.provider ?? 'KHALTI').toUpperCase();
  const isMockEsewa = params.mock === '1';
  const esewaData = typeof params.data === 'string' ? params.data : '';
  const pidx = params.pidx ?? '';

  const [phase, setPhase] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(t('payment.confirming'));
  const [order, setOrder] = useState<Order | null>(null);

  const paramsStr = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const parsedParams = JSON.parse(paramsStr);
      const callback = buildPaymentCallback(parsedParams as Record<string, string | undefined>);

      if (billingIntentId && purpose === 'SUBSCRIPTION') {
        try {
          await apiClient.post(ENDPOINTS.billing.subscriptionVerify, {
            billingIntentId,
            callback,
          });
          if (cancelled) return;
          setPhase('success');
          setMessage(t('payment.membershipConfirmed'));
          return;
        } catch (err) {
          if (cancelled) return;
          setPhase('error');
          setMessage(formatErr(err, t('payment.couldNotVerify')));
          return;
        }
      }

      if (!orderId) {
        setPhase('error');
        setMessage(t('payment.missingRef'));
        return;
      }

      const status = (parsedParams.status ?? '').toLowerCase();
      if (status.includes('cancel')) {
        setPhase('error');
        setMessage(t('payment.cancelled'));
        return;
      }

      try {
        const { data } = await apiClient.post<{ data: { order?: Order; verified: boolean } }>(
          ENDPOINTS.payment.checkoutVerify,
          { orderId, callback }
        );
        if (cancelled) return;
        if (data.data.order) setOrder(data.data.order);
        setPhase('success');
        setMessage(t('payment.successOrder'));
        return;
      } catch {
        // fall through to legacy verify
      }

      try {
        if (provider === 'ESEWA' && esewaData && !isMockEsewa) {
          const { data } = await apiClient.post<{ data: { order: Order } }>(
            ENDPOINTS.payment.esewaVerify,
            { orderId, data: esewaData }
          );
          if (cancelled) return;
          setOrder(data.data.order);
          setPhase('success');
          setMessage(t('payment.esewaConfirmed'));
          return;
        }

        if (isMockEsewa && parsedParams.paymentId) {
          const { data } = await apiClient.post<{ data: { order: Order } }>(
            ENDPOINTS.payment.esewaMockVerify,
            { orderId, paymentId: parsedParams.paymentId }
          );
          if (cancelled) return;
          setOrder(data.data.order);
          setPhase('success');
          setMessage(t('payment.esewaTestConfirmed'));
          return;
        }

        if (!pidx && !callback.tx && !parsedParams.paymentId) {
          setPhase('error');
          setMessage(t('payment.noRef'));
          return;
        }

        const { data } = await apiClient.post<{ data: { order: Order } }>(
          ENDPOINTS.payment.khaltiVerify,
          { orderId, pidx: pidx || String(callback.tx ?? '') }
        );
        if (cancelled) return;
        setOrder(data.data.order);
        setPhase('success');
        setMessage(t('payment.successOrder'));
      } catch (err) {
        if (cancelled) return;
        setPhase('error');
        setMessage(formatErr(err, t('payment.couldNotVerify')));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [orderId, billingIntentId, purpose, pidx, isMockEsewa, esewaData, provider, paramsStr]);

  const handleRetryPayment = async () => {
    if (!orderId) return;
    try {
      const channel = provider === 'ESEWA' ? 'ESEWA' : 'KHALTI';
      const { data } = await apiClient.post<{ data: { paymentUrl?: string; deepLink?: string } }>(
        ENDPOINTS.payment.checkoutInit,
        { orderId, channel }
      );
      const url = data.data.deepLink ?? data.data.paymentUrl;
      if (url) await Linking.openURL(url);
    } catch (err) {
      setMessage(formatErr(err, t('payment.couldNotVerify')));
    }
  };

  const successCta =
    billingIntentId && purpose === 'SUBSCRIPTION'
      ? { label: t('payment.viewMembership'), href: '/membership' as const }
      : { label: t('payment.viewOrder'), href: `/order/${order?.id ?? orderId}` as const };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {phase === 'loading' ? (
          <>
            <ActivityIndicator size="large" color={colors.primary[600]} />
            <GText variant="h3" align="center">
              {message}
            </GText>
          </>
        ) : null}

        {phase === 'success' ? (
          <>
            <View style={styles.iconOk}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success.main} />
            </View>
            <GText variant="h2" align="center">
              {t('payment.confirmed')}
            </GText>
            <GText variant="body" align="center" color={colors.neutral[600]}>
              {message}
            </GText>
            {!billingIntentId ? <TrustCheckoutStrip variant="order" /> : null}
            <Button
              label={successCta.label}
              fullWidth
              size="lg"
              onPress={() => {
                router.push('/(tabs)/' as any);
                setTimeout(() => {
                  router.push(successCta.href as any);
                }, 100);
              }}
            />
          </>
        ) : null}

        {phase === 'error' ? (
          <>
            <View style={styles.iconErr}>
              <Ionicons name="alert-circle" size={56} color={colors.warning.main} />
            </View>
            <GText variant="h2" align="center">
              {t('payment.notCompleted')}
            </GText>
            <GText variant="body" align="center" color={colors.neutral[600]}>
              {message}
            </GText>
            {orderId ? (
              <Button label="Try payment again" fullWidth size="lg" onPress={handleRetryPayment} />
            ) : null}
            <Pressable
              onPress={() => {
                router.push('/(tabs)/' as any);
                setTimeout(() => {
                  router.push((billingIntentId ? '/membership' : `/order/${orderId}`) as any);
                }, 100);
              }}
              style={styles.linkBtn}
            >
              <GText variant="bodySm" weight="semibold" color={colors.primary[600]}>
                {billingIntentId ? 'Back to membership' : 'Go to order'}
              </GText>
            </Pressable>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  iconOk: {
    alignSelf: 'center',
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.success.light,
    alignItems: 'center', justifyContent: 'center',
  },
  iconErr: {
    alignSelf: 'center',
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.warning.light,
    alignItems: 'center', justifyContent: 'center',
  },
  linkBtn: { alignSelf: 'center', paddingVertical: spacing.md },
});
