import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Alert, Linking, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../../src/design-system/primitives/GText';
import { Card } from '../../src/design-system/primitives/Card';
import { Button } from '../../src/design-system/primitives/Button';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import { useOrder, useCancelOrder, useSubmitReview } from '../../src/services/hooks';
import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '../../src/types';
import { formatMoney } from '../../src/utils/money';
import { ErrorState } from '../../src/components/StateViews';
import { TrustCheckoutStrip } from '../../src/components/TrustCheckoutStrip';
import { PaymentBrandIcon } from '../../src/components/PaymentBrandIcon';
import { apiClient } from '../../src/services/api-client';
import { ENDPOINTS } from '../../src/services/endpoints';
import { useTranslation, type TranslationKey } from '../../src/i18n';
import { WebPageShell } from '../../src/components/WebPageShell';

function formatOrderDateTime(date: string): string {
  try {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
}

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const { data: order, isLoading, error, refetch } = useOrder(id);
  const cancelOrder = useCancelOrder();
  const submitReview = useSubmitReview();
  const [paying, setPaying] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'KHALTI' | 'ESEWA' | null>(null);
  const [showPayOptions, setShowPayOptions] = useState(false);

  useEffect(() => {
    if (order && !paymentProvider) {
      if (order.paymentMethod === 'KHALTI' || order.paymentMethod === 'ESEWA') {
        setPaymentProvider(order.paymentMethod);
      } else {
        setPaymentProvider('KHALTI');
      }
    }
  }, [order, paymentProvider]);

  const canPayOnline = order && order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED';

  // Live rider location (polled while the order is being delivered).
  const { data: riderLoc } = useQuery({
    queryKey: ['rider-location', id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<{
        available: boolean;
        taskStatus?: string;
        lat?: number | null;
        lon?: number | null;
        lastUpdate?: string | null;
      }>>(ENDPOINTS.orders.riderLocation(id));
      return data.data;
    },
    enabled: !!id && ['ACCEPTED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY'].includes(order?.status ?? ''),
    refetchInterval: 15000,
  });

  const handleCompletePayment = async () => {
    if (!order || !paymentProvider) return;
    setPaying(true);
    try {
      const { data } = await apiClient.post<{
        data: { paymentUrl?: string; deepLink?: string; mock?: boolean; paymentId?: string };
      }>(ENDPOINTS.payment.checkoutInit, { orderId: order.id, channel: paymentProvider });
      const pay = data.data;
      const url = pay.deepLink ?? pay.paymentUrl;
      if (url) await Linking.openURL(url);
      const q = new URLSearchParams({
        orderId: order.id,
        provider: paymentProvider,
      });
      if (pay.mock && pay.paymentId) {
        q.set('mock', '1');
        q.set('paymentId', pay.paymentId);
      }
      router.push(`/payment/return?${q.toString()}` as any);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: { message?: string } })?.error?.message ?? err.message
        : t('order.paymentError');
      Alert.alert(t('order.paymentTitle'), message);
    } finally {
      setPaying(false);
    }
  };

  if (error) return <ErrorState message={t('order.notFound')} onRetry={() => refetch()} />;

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <View style={{ height: 200, backgroundColor: colors.neutral[150], borderRadius: radius.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  const canCancel = ['PLACED', 'PENDING_PAYMENT'].includes(order.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <WebPageShell>
      <View style={styles.header}>
        <Pressable 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        {order.items && order.items.length > 0 ? (
          <View style={{ flex: 1, alignItems: "center", paddingHorizontal: spacing.sm }}>
            <GText variant="h3" color={colors.neutral[900]} numberOfLines={1}>
              {order.items[0].productName}
              {order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}
            </GText>
            <GText variant="caption" color={colors.neutral[500]}>
              {formatOrderDateTime(order.createdAt)}
            </GText>
          </View>
        ) : (
          <GText variant="h3" color={colors.neutral[900]}>{t('order.orderNum', { id: order.id.substring(0, 8) })}</GText>
        )}
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card variant="tinted" style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Ionicons
                name={order.status === 'DELIVERED' ? 'checkmark-circle' : 'time'}
                size={32}
                color={order.status === 'DELIVERED' ? colors.success.main : colors.primary[500]}
              />
            </View>
            <GText variant="h3" align="center" color={colors.neutral[900]}>
              {getStatusTitle(t, order.status)}
            </GText>
            {order.estimatedDelivery && (
              <GText variant="bodySm" align="center" color={colors.neutral[500]}>
                {t('order.estimated', { time: order.estimatedDelivery })}
              </GText>
            )}
            {order.paymentStatusLabel ? (
              <GText variant="bodySm" align="center" color={colors.neutral[600]}>
                {order.paymentStatusLabel}
              </GText>
            ) : null}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <TrustCheckoutStrip variant="order" />
        </Animated.View>

        {/* Fulfillment / handoff */}
        {order.fulfillmentType || order.deliveryAddress ? (
          <Animated.View entering={FadeInDown.delay(90).duration(300)}>
            <Card variant="flat" style={styles.totalCard}>
              <View style={styles.fulfillmentHeader}>
                <Ionicons
                  name={
                    order.fulfillmentType === 'PICKUP'
                      ? 'storefront-outline'
                      : order.fulfillmentType === 'PLATFORM_LOGISTICS'
                        ? 'rocket-outline'
                        : 'location-outline'
                  }
                  size={18}
                  color={colors.primary[600]}
                />
                <GText variant="body" weight="semibold" style={{ flex: 1 }}>
                  {order.fulfillmentType === 'PICKUP'
                    ? t('order.fulfillmentPickup')
                    : order.fulfillmentType === 'PLATFORM_LOGISTICS'
                      ? t('order.fulfillmentPlatform')
                      : t('order.fulfillmentDelivery')}
                </GText>
              </View>
              {order.fulfillmentType === 'PICKUP' ? (
                <>
                  <GText variant="bodySm" color={colors.neutral[600]}>
                    {t('order.pickupHint')}
                  </GText>
                  {order.store?.address ? (
                    <GText variant="bodySm" color={colors.neutral[500]} style={{ marginTop: spacing.xs }}>
                      {t('order.pickupAddress')}: {order.store.address}
                    </GText>
                  ) : null}
                </>
              ) : order.deliveryAddress ? (
                <GText variant="bodySm" color={colors.neutral[600]}>
                  {[order.deliveryAddress.addressLine, order.deliveryAddress.city]
                    .filter(Boolean)
                    .join(', ')}
                </GText>
              ) : null}
            </Card>
          </Animated.View>
        ) : null}

        {/* Live rider tracking */}
        {riderLoc?.available && riderLoc.taskStatus === 'OUT_FOR_DELIVERY' ? (
          <Animated.View entering={FadeInDown.delay(95).duration(300)}>
            <Card variant="tinted" style={styles.totalCard}>
              <View style={styles.fulfillmentHeader}>
                <Ionicons name="bicycle" size={18} color={colors.primary[600]} />
                <GText variant="body" weight="semibold" style={{ flex: 1 }}>
                  {t('order.riderOnWay', { defaultValue: 'Your rider is on the way' })}
                </GText>
              </View>
              {riderLoc.lastUpdate ? (
                <GText variant="bodySm" color={colors.neutral[500]}>
                  {t('order.riderUpdatedAt', {
                    defaultValue: 'Location updated',
                  })}{' '}
                  · {new Date(riderLoc.lastUpdate).toLocaleTimeString()}
                </GText>
              ) : null}
            </Card>
          </Animated.View>
        ) : null}

        {/* Tracking steps */}
        {order.trackingSteps && order.trackingSteps.length > 0 && (
          <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.trackingSection}>
            {order.trackingSteps.map((step, i) => (
              <View key={i} style={styles.trackingStep}>
                <View style={styles.trackingDot}>
                  <View style={[
                    styles.dot,
                    step.completed && styles.dotCompleted,
                    step.current && styles.dotCurrent,
                  ]} />
                  {i < order.trackingSteps!.length - 1 && (
                    <View style={[styles.line, step.completed && styles.lineCompleted]} />
                  )}
                </View>
                <View style={styles.stepInfo}>
                  <GText
                    variant="body"
                    weight={step.current ? 'semibold' : 'regular'}
                    color={step.completed || step.current ? colors.neutral[900] : colors.neutral[400]}
                  >
                    {step.label}
                  </GText>
                  {step.timestamp && (
                    <GText variant="caption" color={colors.neutral[400]}>
                      {new Date(step.timestamp).toLocaleString()}
                    </GText>
                  )}
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Order items */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <GText variant="h4" style={{ marginBottom: spacing.sm }}>{t('order.items')}</GText>
          <Card variant="elevated">
            {order.items.map((item, i) => (
              <View key={item.id} style={[
                styles.orderItem,
                i < order.items.length - 1 && styles.orderItemBorder,
              ]}>
                <View style={styles.itemImage}>
                  <Ionicons name="image-outline" size={18} color={colors.neutral[300]} />
                </View>
                <View style={{ flex: 1 }}>
                  <GText variant="bodySm" weight="medium">{item.productName}</GText>
                  <GText variant="caption" color={colors.neutral[500]}>x{item.quantity}</GText>
                </View>
                <GText variant="bodySm" weight="semibold">{formatMoney(item.total)}</GText>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Total */}
        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <Card variant="flat" style={styles.totalCard}>
            <View style={styles.totalRow}>
              <GText variant="body" color={colors.neutral[600]}>{t('common.subtotal')}</GText>
              <GText variant="body">{formatMoney(order.subtotal)}</GText>
            </View>
            <View style={styles.totalRow}>
              <GText variant="body" color={colors.neutral[600]}>{t('common.delivery')}</GText>
              {order.fulfillmentType === 'PICKUP' ? (
                <GText variant="body" color={colors.neutral[500]}>
                  {t('order.fulfillmentPickup')}
                </GText>
              ) : (
                <GText variant="body" color={order.deliveryFee === 0 ? colors.success.dark : colors.neutral[900]}>
                  {order.deliveryFee === 0 ? t('common.free') : formatMoney(order.deliveryFee)}
                </GText>
              )}
            </View>
            {(order.platformFee ?? 0) > 0 && (
              <View style={styles.totalRow}>
                <GText variant="body" color={colors.neutral[600]}>{t('common.platformFee', { defaultValue: 'Platform Fee' })}</GText>
                <GText variant="body">{formatMoney(order.platformFee!)}</GText>
              </View>
            )}
            <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: colors.neutral[200], paddingTop: spacing.md }]}>
              <GText variant="h3">{t('common.total')}</GText>
              <GText variant="h3" color={colors.primary[700]}>{formatMoney(order.total)}</GText>
            </View>
          </Card>
        </Animated.View>

        {order.status === 'DELIVERED' && order.store?.id && order.items[0] && !reviewSubmitted ? (
          <Animated.View entering={FadeInDown.delay(350).duration(300)}>
            <Card variant="elevated" style={{ gap: spacing.md, marginTop: spacing.lg }}>
              <GText variant="h4">{t('order.rateYourOrder')}</GText>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setRating(n)}>
                    <Ionicons
                      name={n <= rating ? 'star' : 'star-outline'}
                      size={28}
                      color={colors.warning.main}
                    />
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={reviewComment}
                onChangeText={setReviewComment}
                placeholder={t('order.optionalComment')}
                style={{
                  borderWidth: 1,
                  borderColor: colors.neutral[200],
                  borderRadius: radius.lg,
                  padding: spacing.md,
                  fontSize: 15,
                  color: colors.neutral[900],
                }}
                placeholderTextColor={colors.neutral[400]}
              />
              <Button
                label={submitReview.isPending ? t('order.submitting') : t('order.submitReview')}
                fullWidth
                loading={submitReview.isPending}
                onPress={() => {
                  submitReview.mutate(
                    {
                      orderId: order.id,
                      productId: order.items[0].productId,
                      storeId: order.store!.id,
                      rating,
                      comment: reviewComment.trim() || undefined,
                    },
                    {
                      onSuccess: () => {
                        setReviewSubmitted(true);
                        Alert.alert(t('order.reviewThanks'), t('order.reviewThanksMsg'));
                      },
                      onError: () => Alert.alert(t('order.submitReview'), t('order.reviewError')),
                    }
                  );
                }}
              />
            </Card>
          </Animated.View>
        ) : null}

        {canPayOnline && (
          <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
            {!showPayOptions ? (
              <Button
                label={t('order.payNow', { defaultValue: 'Pay Now' })}
                fullWidth
                onPress={() => setShowPayOptions(true)}
              />
            ) : (
              <Card variant="elevated" style={{ gap: spacing.md }}>
                <GText variant="bodySm" color={colors.neutral[600]}>
                  {t('order.payOnlineMsg', { defaultValue: 'Select a payment method to proceed.' })}
                </GText>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Pressable
                    style={[styles.paymentOption, paymentProvider === 'KHALTI' && styles.paymentOptionActive]}
                    onPress={() => setPaymentProvider('KHALTI')}
                  >
                    <PaymentBrandIcon method="KHALTI" size={24} />
                    <GText variant="body" weight="semibold" color={paymentProvider === 'KHALTI' ? colors.primary[700] : colors.neutral[700]}>Khalti</GText>
                  </Pressable>
                  <Pressable
                    style={[styles.paymentOption, paymentProvider === 'ESEWA' && styles.paymentOptionActive]}
                    onPress={() => setPaymentProvider('ESEWA')}
                  >
                    <PaymentBrandIcon method="ESEWA" size={24} />
                    <GText variant="body" weight="semibold" color={paymentProvider === 'ESEWA' ? colors.primary[700] : colors.neutral[700]}>eSewa</GText>
                  </Pressable>
                </View>
                <Button
                  label={paying ? t('order.opening') : t('order.proceed', { defaultValue: 'Proceed' })}
                  fullWidth
                  loading={paying}
                  onPress={handleCompletePayment}
                />
              </Card>
            )}
          </View>
        )}

        {canCancel && (
          <Button
            label={t('order.cancelOrder')}
            variant="danger"
            fullWidth
            loading={cancelOrder.isPending}
            onPress={() => cancelOrder.mutate({ id: order.id })}
            style={{ marginTop: canPayOnline ? 0 : spacing.lg }}
          />
        )}

        <Pressable
          onPress={() => router.push('/support')}
          style={{ marginTop: spacing.md, alignItems: 'center' }}
        >
          <GText variant="bodySm" weight="semibold" color={colors.primary[600]}>
            {t('order.needHelp')}
          </GText>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
      </WebPageShell>
    </SafeAreaView>
  );
}

const KNOWN_STATUSES = new Set([
  'PENDING_PAYMENT', 'PLACED', 'ACCEPTED', 'CONFIRMED', 'PACKED', 'SHIPPED',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'PENDING', 'PREPARING', 'READY',
]);

function getStatusTitle(t: (key: TranslationKey) => string, status: string): string {
  if (KNOWN_STATUSES.has(status)) return t(`status.${status}` as TranslationKey);
  return status.replace(/_/g, ' ').toLowerCase();
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  loading: { flex: 1, padding: spacing.lg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl },
  statusCard: { alignItems: 'center', gap: spacing.sm },
  statusIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.mint[100],
    alignItems: 'center', justifyContent: 'center',
  },
  trackingSection: { gap: 0 },
  trackingStep: { flexDirection: 'row', minHeight: 48 },
  trackingDot: { width: 24, alignItems: 'center' },
  dot: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: colors.neutral[300],
    backgroundColor: 'transparent',
  },
  dotCompleted: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[500],
  },
  dotCurrent: {
    borderColor: colors.primary[500],
    backgroundColor: colors.mint[100],
  },
  line: {
    width: 2, flex: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: 4,
  },
  lineCompleted: { backgroundColor: colors.primary[500] },
  stepInfo: { flex: 1, paddingLeft: spacing.md, gap: 2, paddingBottom: spacing.md },
  orderItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md,
  },
  orderItemBorder: {
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
  },
  paymentOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.background,
  },
  paymentOptionActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  itemImage: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  totalCard: { gap: spacing.sm },
  fulfillmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
});
