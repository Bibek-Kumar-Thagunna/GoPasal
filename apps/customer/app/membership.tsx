import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GText } from '../src/design-system/primitives/GText';
import { Button } from '../src/design-system/primitives/Button';
import { Card } from '../src/design-system/primitives/Card';
import { SubscriptionPaymentSheet } from '../src/components/SubscriptionPaymentSheet';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import { env } from '../src/constants/env';
import { formatMoney } from '../src/utils/money';
import { apiClient } from '../src/services/api-client';
import { ENDPOINTS } from '../src/services/endpoints';
import { useAuthStore } from '../src/store/auth.store';
import { usePaymentConfig } from '../src/services/hooks';
import { WebPageShell } from '../src/components/WebPageShell';
import { useTranslation } from '../src/i18n';

type Plan = {
  id: string;
  name: string;
  slug: string;
  price: string;
  durationDays: number;
  description?: string | null;
};

export default function MembershipScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: paymentConfig } = usePaymentConfig();

  const plansQ = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Plan[] }>(
        ENDPOINTS.growth.subscriptionPlans
      );
      return data.data ?? [];
    },
  });

  const activeQ = useQuery({
    queryKey: ['subscription-me'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: { plan?: Plan; endAt?: string } | null }>(
        ENDPOINTS.growth.subscriptionMe
      );
      return data.data;
    },
    enabled: isAuthenticated,
  });

  const cancelM = useMutation({
    mutationFn: async () => {
      await apiClient.post(ENDPOINTS.growth.cancelSubscription);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['subscription-me'] });
    },
  });

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paySheetOpen, setPaySheetOpen] = useState(false);

  const plans = plansQ.data ?? [];
  const goldPlans = plans.filter((p) => /gold|premium|plus/i.test(p.slug + p.name));
  const displayPlans = goldPlans.length > 0 ? goldPlans : plans;

  const paymentCapabilities = useMemo(
    () => ({
      khalti: paymentConfig?.khalti === true,
      esewa: paymentConfig?.esewa === true,
      fonepay: paymentConfig?.fonepay === true,
      aggregator: paymentConfig?.aggregator,
    }),
    [paymentConfig]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <WebPageShell>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/' as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText variant="h2" color={colors.neutral[900]}>{t('membership.title')}</GText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Gold benefits banner */}
        <LinearGradient
          colors={[colors.gold[600], colors.gold[400]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.goldBanner}
        >
          <View style={styles.goldBadge}>
            <Ionicons name="sparkles" size={16} color={colors.gold[700]} />
            <GText variant="caption" weight="bold" color={colors.gold[800]}>{t('membership.badge')}</GText>
          </View>
          <GText variant="h2" color="#FFFFFF">{t('membership.saveMore')}</GText>
          <View style={styles.benefitList}>
            {([
              { icon: 'bicycle', textKey: 'membership.benefitFreeDelivery' },
              { icon: 'pricetag', textKey: 'membership.benefitMemberPrices' },
              { icon: 'flash', textKey: 'membership.benefitPriority' },
            ] as const).map((b) => (
              <View key={b.textKey} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={b.icon} size={14} color="#FFFFFF" />
                </View>
                <GText variant="bodySm" color="rgba(255,255,255,0.95)">{t(b.textKey)}</GText>
              </View>
            ))}
          </View>
        </LinearGradient>

        {activeQ.data?.plan ? (
          <Card variant="tinted" style={styles.activeCard}>
            <GText variant="h4">{t('membership.activePrefix', { name: activeQ.data.plan.name })}</GText>
            {activeQ.data.endAt ? (
              <GText variant="bodySm" color={colors.neutral[600]}>
                {t('membership.validUntil', { date: new Date(activeQ.data.endAt).toLocaleDateString() })}
              </GText>
            ) : null}
            <Button
              label={t('membership.cancelAutoRenew')}
              variant="outline"
              fullWidth
              loading={cancelM.isPending}
              onPress={() => cancelM.mutate()}
            />
          </Card>
        ) : null}

        {!isAuthenticated ? (
          <Card variant="elevated" style={styles.card}>
            <GText variant="body">{t('membership.signInPrompt')}</GText>
            <Button label={t('membership.signIn')} fullWidth onPress={() => router.push('/(auth)/login')} />
          </Card>
        ) : plansQ.isLoading ? (
          <GText variant="body" color={colors.neutral[500]}>{t('membership.loadingPlans')}</GText>
        ) : displayPlans.length === 0 ? (
          <GText variant="body" color={colors.neutral[500]}>
            {t('membership.noPlans')}
          </GText>
        ) : (
          displayPlans.map((plan) => (
            <Pressable
              key={plan.id}
              onPress={() => setSelectedPlan(plan)}
              style={[
                styles.planCard,
                selectedPlan?.id === plan.id && styles.planSelected,
              ]}
            >
              <GText variant="h3">{plan.name}</GText>
              {plan.description ? (
                <GText variant="bodySm" color={colors.neutral[600]}>{plan.description}</GText>
              ) : (
                <GText variant="bodySm" color={colors.neutral[600]}>
                  {t('membership.freeDeliveryDays', { days: plan.durationDays })}
                </GText>
              )}
              <View style={styles.planPriceRow}>
                <GText variant="h3" color={colors.gold[700]}>
                  {formatMoney(plan.price)}
                </GText>
                <GText variant="caption" color={colors.neutral[400]}>
                  {t('membership.perDays', { days: plan.durationDays })}
                </GText>
                {selectedPlan?.id === plan.id && (
                  <View style={styles.planCheck}>
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary[500]} />
                  </View>
                )}
              </View>
            </Pressable>
          ))
        )}

        {isAuthenticated && displayPlans.length > 0 && !activeQ.data?.plan ? (
          <Button
            label={t('membership.subscribePay')}
            fullWidth
            size="lg"
            disabled={!selectedPlan}
            onPress={() => setPaySheetOpen(true)}
          />
        ) : null}
      </ScrollView>

      {selectedPlan ? (
        <SubscriptionPaymentSheet
          visible={paySheetOpen}
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          amount={Number(selectedPlan.price)}
          currencySymbol={env.currencySymbol}
          capabilities={paymentCapabilities}
          onClose={() => setPaySheetOpen(false)}
          onPaymentStarted={({ billingIntentId, provider, mock, paymentId }) => {
            const q = new URLSearchParams({
              billingIntentId,
              purpose: 'SUBSCRIPTION',
              provider,
            });
            if (mock && paymentId) {
              q.set('mock', '1');
              q.set('paymentId', paymentId);
            }
            router.replace(`/payment/return?${q.toString()}` as any);
          }}
        />
      ) : null}
      </WebPageShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['3xl'] },
  card: { gap: spacing.md },
  activeCard: { gap: spacing.md, marginBottom: spacing.md },
  planCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.surface.card,
    gap: spacing.sm,
  },
  planSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.mint[50],
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  planCheck: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },
  goldBanner: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    overflow: 'hidden',
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  benefitList: { gap: spacing.sm, marginTop: spacing.xs },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  benefitIcon: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
});
