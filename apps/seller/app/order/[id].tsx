import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/services/api';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import { useSellerWorkspace } from '../../src/hooks/useSellerWorkspace';

function T({ style, children, n }: { style?: object; children: React.ReactNode; n?: number }) {
  return (
    <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

function nextAction(status: string, fulfillmentType?: string | null) {
  const pickup = fulfillmentType === 'PICKUP';
  const merchantSelf = fulfillmentType === 'MERCHANT_DELIVERY';
  switch (status) {
    case 'PENDING_PAYMENT':
    case 'PLACED':
      return { label: 'Accept', next: 'ACCEPTED' };
    case 'ACCEPTED':
      return { label: 'Preparing', next: 'CONFIRMED' };
    case 'CONFIRMED':
      return { label: 'Packed', next: 'PACKED' };
    case 'PACKED':
      if (pickup) return { label: 'Complete pickup', next: 'DELIVERED' };
      if (merchantSelf) return { label: 'Mark delivered', next: 'DELIVERED' };
      return { label: 'Out for delivery', next: 'OUT_FOR_DELIVERY' };
    case 'SHIPPED':
      return { label: 'Out for delivery', next: 'OUT_FOR_DELIVERY' };
    case 'OUT_FOR_DELIVERY':
      return { label: 'Delivered', next: 'DELIVERED' };
    default:
      return null;
  }
}

function formatMoney(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(n)) return '0';
  return `NPR ${n.toLocaleString('en-NP', { maximumFractionDigits: 0 })}`;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { activeStoreId } = useSellerWorkspace();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['seller-order', id, activeStoreId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/seller/orders/${id}/detail`);
      return data?.data;
    },
    enabled: !!id && !!activeStoreId,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: async (payload: { status: string; codCollected?: boolean }) => {
      const body: { status: string; codCollected?: boolean } = { status: payload.status };
      if (payload.codCollected !== undefined) body.codCollected = payload.codCollected;
      await apiClient.put(`/seller/orders/${id}/status`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-order', id] });
      qc.invalidateQueries({ queryKey: ['seller-orders'] });
      qc.invalidateQueries({ queryKey: ['seller-stats'] });
      qc.invalidateQueries({ queryKey: ['seller-earnings-summary'] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Could not update order status';
      Alert.alert('Update failed', message);
    },
  });

  const handleAdvance = useCallback(
    (next: string) => {
      if (next === 'DELIVERED' && order?.paymentMethod === 'COD') {
        Alert.alert(
          'Cash on delivery',
          'Confirm payment was received before completing delivery.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Payment received', onPress: () => updateStatus({ status: next, codCollected: true }) },
          ]
        );
        return;
      }
      updateStatus({ status: next });
    },
    [order?.paymentMethod, updateStatus]
  );

  const action = useMemo(
    () => (order ? nextAction(order.status as string, order.fulfillmentType as string | null) : null),
    [order]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <View style={styles.toolbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
          </Pressable>
          <T style={styles.toolbarTitle}>Order</T>
        </View>
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary[600]} />
      </SafeAreaView>
    );
  }

  if (isError || !order) {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <View style={styles.toolbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
          </Pressable>
          <T style={styles.toolbarTitle}>Order</T>
        </View>
        <T style={{ padding: spacing.lg, fontFamily: 'Inter', color: colors.neutral[600] }}>
          This order could not be loaded. Check that you’re on the correct store branch.
        </T>
      </SafeAreaView>
    );
  }

  const addr = order.deliveryAddress as { addressLine?: string; city?: string } | null;
  const addrLine =
    order.fulfillmentType === 'PICKUP'
      ? 'Store pickup'
      : addr
        ? `${addr.addressLine || ''}, ${addr.city || ''}`
        : '—';

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <T style={styles.toolbarTitle}>#{String(order.id).slice(-8).toUpperCase()}</T>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(320)} style={styles.card}>
          <T style={styles.label}>Status</T>
          <T style={styles.valueBig}>{String(order.status)}</T>
          <T style={[styles.label, { marginTop: spacing.md }]}>Fulfillment</T>
          <T style={styles.value}>
            {order.fulfillmentType === 'PICKUP'
              ? 'Pickup'
              : order.fulfillmentType === 'PLATFORM_LOGISTICS'
                ? 'GoPasal fleet'
                : 'Merchant delivery'}
          </T>
          <T style={[styles.label, { marginTop: spacing.md }]}>Payment</T>
          <T style={styles.value}>
            {String(order.paymentMethod)}
            {order.paymentMethod === 'COD' ? ' · Pay on delivery' : ''}
          </T>
          {order.paymentMethod === 'COD' ? (
            <T style={styles.codHint}>
              {order.paymentCollectionStatus === 'COLLECTED' || order.paymentStatus === 'PAID'
                ? 'Cash collected and recorded.'
                : order.status === 'DELIVERED'
                  ? 'Delivered — confirm cash was received when completing delivery.'
                  : 'Collect cash from the customer when you mark delivered.'}
            </T>
          ) : null}
          <T style={[styles.label, { marginTop: spacing.md }]}>Total</T>
          <T style={styles.valueBig}>{formatMoney(order.totalAmount as string)}</T>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(320)} style={styles.card}>
          <T style={styles.label}>Customer</T>
          <T style={styles.valueBig}>{(order.user as { name?: string })?.name || 'Customer'}</T>
          <T style={styles.value}>{(order.user as { phone?: string })?.phone || '—'}</T>
          <T style={[styles.label, { marginTop: spacing.md }]}>Address / handoff</T>
          <T style={styles.value}>{addrLine}</T>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(320)} style={styles.card}>
          <T style={styles.label}>Items</T>
          {(order.items as any[])?.map((it: any) => (
            <View key={it.id} style={styles.itemRow}>
              <T style={styles.itemName} n={2}>
                {it.productName}
              </T>
              <T style={styles.itemQty}>×{it.quantity}</T>
            </View>
          ))}
        </Animated.View>

        {action ? (
          <Pressable style={styles.primaryBtn} onPress={() => handleAdvance(action.next)}>
            <T style={styles.primaryBtnTxt}>{action.label}</T>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  toolbarTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[900] },
  content: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...Platform.select({ web: { boxShadow: '0 2px 12px rgba(15,23,42,0.06)' } as object, default: {} }),
  },
  label: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.6 },
  value: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[800], marginTop: 4 },
  codHint: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[600], marginTop: spacing.sm, lineHeight: 18 },
  valueBig: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[900], marginTop: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.md },
  itemName: { flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 14, color: colors.neutral[800] },
  itemQty: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.neutral[500] },
  primaryBtn: {
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryBtnTxt: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#fff' },
});
