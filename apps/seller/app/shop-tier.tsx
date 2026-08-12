import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
  Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import apiClient from '../src/services/api';

type Plan = {
  id: string;
  name: string;
  slug: string;
  monthlyPrice: string;
  description?: string | null;
};

type PaymentConfig = {
  khalti?: boolean;
  esewa?: boolean;
  fonepay?: boolean;
  aggregator?: string;
};

export default function ShopTierScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pendingIntentId, setPendingIntentId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const configQ = useQuery({
    queryKey: ['payment-config'],
    queryFn: async () => {
      const { data } = await apiClient.get('/payment/config');
      return data?.data as PaymentConfig;
    },
  });

  const plansQ = useQuery({
    queryKey: ['seller-marketing-plans'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/marketing/plans');
      return (data?.data ?? []) as Plan[];
    },
  });

  const activeQ = useQuery({
    queryKey: ['seller-marketing-sub'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/marketing/subscription');
      return data?.data as { plan?: Plan; subscription?: { endAt?: string } } | null;
    },
  });

  const channel = useMemo(() => {
    if (configQ.data?.khalti) return 'KHALTI';
    if (configQ.data?.esewa) return 'ESEWA';
    return 'KHALTI';
  }, [configQ.data]);

  const handleSubscribe = async () => {
    if (!selected) return;
    setPaying(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await apiClient.post('/billing/store-tier/checkout/init', {
        planId: selected.id,
        channel,
      });
      const pay = data?.data as {
        billingIntentId: string;
        paymentUrl?: string;
        deepLink?: string;
      };
      setPendingIntentId(pay.billingIntentId);
      const url = pay.deepLink ?? pay.paymentUrl;
      if (url) await Linking.openURL(url);
      setSuccess('Complete payment in Khalti/eSewa, then tap “Confirm payment” below.');
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data as { error?: { message?: string } })?.error?.message ??
            'Could not start payment'
          : 'Could not start payment'
      );
    } finally {
      setPaying(false);
    }
  };

  const handleVerify = async () => {
    if (!pendingIntentId) return;
    setVerifying(true);
    setError('');
    try {
      await apiClient.post('/billing/store-tier/checkout/verify', {
        billingIntentId: pendingIntentId,
        callback: {},
      });
      setSuccess('Shop tier activated!');
      setPendingIntentId(null);
      void activeQ.refetch();
    } catch (err) {
      setError(
        isAxiosError(err)
          ? (err.response?.data as { error?: { message?: string } })?.error?.message ??
            'Payment not verified yet'
          : 'Payment not verified yet'
      );
    } finally {
      setVerifying(false);
    }
  };

  const active = activeQ.data?.plan;

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <Text style={styles.title}>Shop tier</Text>
        <View style={{ width: 40 }} />
      </View>

      {plansQ.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary[600]} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {active ? (
            <View style={styles.activeBox}>
              <Text style={styles.activeTitle}>Active: {active.name}</Text>
              {activeQ.data?.subscription?.endAt ? (
                <Text style={styles.muted}>
                  Until {new Date(activeQ.data.subscription.endAt).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
          ) : null}

          {(plansQ.data ?? []).map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => setSelected(plan)}
              style={[styles.planCard, selected?.id === plan.id && styles.planSelected]}
            >
              <Text style={styles.planName}>{plan.name}</Text>
              {plan.description ? <Text style={styles.muted}>{plan.description}</Text> : null}
              <Text style={styles.price}>Rs {plan.monthlyPrice}/mo</Text>
            </Pressable>
          ))}

          {!active && (plansQ.data?.length ?? 0) > 0 ? (
            <>
              <Pressable
                style={[styles.cta, paying && { opacity: 0.7 }]}
                disabled={!selected || paying}
                onPress={() => void handleSubscribe()}
              >
                <Text style={styles.ctaText}>
                  {paying ? 'Starting payment…' : 'Subscribe & pay'}
                </Text>
              </Pressable>
              {pendingIntentId ? (
                <Pressable
                  style={[styles.ctaOutline, verifying && { opacity: 0.7 }]}
                  disabled={verifying}
                  onPress={() => void handleVerify()}
                >
                  <Text style={styles.ctaOutlineText}>
                    {verifying ? 'Verifying…' : 'Confirm payment'}
                  </Text>
                </Pressable>
              ) : null}
            </>
          ) : null}

          {success ? <Text style={styles.ok}>{success}</Text> : null}
          {error ? <Text style={styles.err}>{error}</Text> : null}
          {configQ.data?.aggregator === 'SKYPAY' ? (
            <Text style={styles.muted}>Payments via SkyPay</Text>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  activeBox: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.mint[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  activeTitle: { fontWeight: '700', fontSize: 16 },
  planCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface.card,
  },
  planSelected: { borderColor: colors.primary[500], backgroundColor: colors.mint[50] },
  planName: { fontSize: 18, fontWeight: '700' },
  price: { color: colors.primary[700], fontWeight: '700', marginTop: 8 },
  muted: { color: colors.neutral[600], marginTop: 4 },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '700' },
  ctaOutline: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary[500],
  },
  ctaOutlineText: { color: colors.primary[700], fontWeight: '700' },
  ok: { color: colors.success.main },
  err: { color: colors.error.main },
});
