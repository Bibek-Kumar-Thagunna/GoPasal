import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import apiClient from '../../src/services/api';

function T({ style, children, n }: any) {
  return (
    <Animated.Text
      numberOfLines={n}
      style={[{ fontFamily: 'Poppins', color: colors.neutral[900] }, style]}
    >
      {children}
    </Animated.Text>
  );
}

function formatMoney(v: string | number | null | undefined) {
  const n = typeof v === 'string' ? parseFloat(v) : v ?? 0;
  if (Number.isNaN(n)) return 'NPR 0';
  return `NPR ${Math.round(n).toLocaleString('en-NP')}`;
}

type TaskDetail = {
  taskId: string;
  status: string;
  orderId: string;
  orderStatus: string;
  storeId: string;
  storeName: string;
  storeAddress: string | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  customerName: string | null;
  customerPhone: string | null;
  totalAmount: string;
  codAmount: string | null;
  codCollected: boolean | null;
  isGreenDelivery: boolean;
  createdAt: string;
  items: { name: string; quantity: number }[];
};

function nextTaskAction(status: string, cod: boolean): { label: string; next: string } | null {
  switch (status) {
    case 'ASSIGNED':
      return { label: 'Confirm pickup', next: 'PICKED_UP' };
    case 'PICKED_UP':
      return { label: cod ? 'Delivered · Collect cash' : 'Mark delivered', next: 'DELIVERED' };
    default:
      return null;
  }
}

export default function RouteDetailScreen() {
  const { id, taskId } = useLocalSearchParams<{ id: string; taskId: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: task, isLoading, isError, refetch } = useQuery({
    queryKey: ['rider-task', taskId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/riders/tasks/${taskId}`);
      return data?.data as TaskDetail;
    },
    enabled: !!taskId,
    refetchInterval: 15000,
  });

  const accept = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(`/riders/tasks/${taskId}/accept`);
      return data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rider-task', taskId] });
      qc.invalidateQueries({ queryKey: ['rider-tasks-available'] });
      qc.invalidateQueries({ queryKey: ['rider-tasks-assigned'] });
      qc.invalidateQueries({ queryKey: ['rider-me'] });
    },
    onError: (err: any) => {
      Alert.alert(
        'Accept failed',
        err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Could not accept this route.'
      );
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (payload: { status: string; codCollected?: boolean }) => {
      const body: { status: string; codCollected?: boolean } = { status: payload.status };
      if (payload.codCollected !== undefined) body.codCollected = payload.codCollected;
      await apiClient.put(`/riders/tasks/${taskId}/status`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rider-task', taskId] });
      qc.invalidateQueries({ queryKey: ['rider-tasks-assigned'] });
      qc.invalidateQueries({ queryKey: ['rider-tasks-available'] });
      qc.invalidateQueries({ queryKey: ['rider-me'] });
    },
    onError: (err: any) => {
      Alert.alert(
        'Update failed',
        err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Could not update the route.'
      );
    },
  });

  const handleAdvance = (next: string) => {
    const isCod =
      task?.codAmount != null && Number(task.codAmount) > 0;
    if (next === 'DELIVERED' && isCod) {
      Alert.alert(
        'Cash on delivery',
        `Confirm you received ${formatMoney(task?.codAmount)} from the customer before completing delivery.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Cash received', onPress: () => updateStatus.mutate({ status: next, codCollected: true }) },
        ]
      );
      return;
    }
    updateStatus.mutate({ status: next });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <View style={styles.toolbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
          </Pressable>
          <T style={styles.toolbarTitle}>Route</T>
        </View>
        <ActivityIndicator style={{ marginTop: 48 }} color="#1a3a2a" />
      </SafeAreaView>
    );
  }

  if (isError || !task) {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <View style={styles.toolbar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
          </Pressable>
          <T style={styles.toolbarTitle}>Route</T>
        </View>
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.neutral[300]} />
          <T style={styles.errorText}>This route could not be loaded.</T>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <T style={styles.retryBtnText}>Retry</T>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const action = nextTaskAction(task.status, task.codAmount != null && Number(task.codAmount) > 0);
  const cod = task.codAmount != null && Number(task.codAmount) > 0;
  const isPending = task.status === 'PENDING';

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <T style={styles.toolbarTitle}>#{task.orderId.slice(-8).toUpperCase()}</T>
        <View style={styles.statusPill}>
          <T style={styles.statusPillText}>{task.status.replace(/_/g, ' ')}</T>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(320)} style={styles.card}>
          <T style={styles.label}>Store</T>
          <T style={styles.valueBig}>{task.storeName}</T>
          {task.storeAddress ? (
            <T style={styles.value}>{task.storeAddress}</T>
          ) : null}
          <T style={[styles.label, { marginTop: spacing.md }]}>Dropoff</T>
          {task.deliveryAddress ? (
            <T style={styles.value}>
              {[task.deliveryAddress, task.deliveryCity].filter(Boolean).join(', ')}
            </T>
          ) : (
            <T style={styles.value}>Hand over to customer</T>
          )}
          {task.customerName ? (
            <T style={[styles.value, { marginTop: spacing.xs }]}>
              Customer: {task.customerName}
              {task.customerPhone ? ` · ${task.customerPhone}` : ''}
            </T>
          ) : null}
          {task.isGreenDelivery ? (
            <View style={styles.greenPill}>
              <Ionicons name="leaf-outline" size={12} color={colors.success.dark} />
              <T style={styles.greenPillText}>Green delivery</T>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(320)} style={styles.card}>
          <T style={styles.label}>Items</T>
          {task.items?.map((it, i) => (
            <View key={i} style={styles.itemRow}>
              <T style={styles.itemName} n={2}>
                {it.name}
              </T>
              <T style={styles.itemQty}>×{it.quantity}</T>
            </View>
          ))}
          {!task.items || task.items.length === 0 ? (
            <T style={styles.value}>No item details</T>
          ) : null}
          <View style={[styles.totalRow, { marginTop: spacing.md }]}>
            <T style={styles.label}>Total</T>
            <T style={styles.valueBig}>{formatMoney(task.totalAmount)}</T>
          </View>
          {cod ? (
            <View style={styles.codRow}>
              <Ionicons name="cash-outline" size={16} color={colors.warning.dark} />
              <T style={styles.codText}>
                Collect {formatMoney(task.codAmount)} in cash on delivery
              </T>
            </View>
          ) : null}
        </Animated.View>

        {isPending ? (
          <Pressable
            style={[styles.primaryBtn, accept.isPending && styles.btnDisabled]}
            disabled={accept.isPending}
            onPress={() => accept.mutate()}
          >
            {accept.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <T style={styles.primaryBtnText}>Accept Route</T>
            )}
          </Pressable>
        ) : null}

        {action ? (
          <Pressable
            style={[styles.primaryBtn, updateStatus.isPending && styles.btnDisabled]}
            disabled={updateStatus.isPending}
            onPress={() => handleAdvance(action.next)}
          >
            {updateStatus.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <T style={styles.primaryBtnText}>{action.label}</T>
            )}
          </Pressable>
        ) : null}

        {['ASSIGNED', 'PICKED_UP'].includes(task.status) ? (
          <Pressable
            style={styles.issueBtn}
            onPress={() =>
              Alert.alert(
                'Report issue',
                'Mark this delivery as failed (customer unreachable, wrong address, etc.). The route will be returned to the available pool.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Mark failed',
                    style: 'destructive',
                    onPress: () => updateStatus.mutate({ status: 'FAILED' }),
                  },
                ]
              )
            }
          >
            <T style={styles.issueBtnText}>Report issue</T>
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
    borderRadius: 20,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  toolbarTitle: { flex: 1, fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[900] },
  statusPill: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: colors.primary[600],
    textTransform: 'uppercase',
  },
  content: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[800], marginTop: 4 },
  valueBig: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[900], marginTop: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, gap: spacing.md },
  itemName: { flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 14, color: colors.neutral[800] },
  itemQty: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.neutral[500] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.success.light,
  },
  greenPillText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.success.dark },
  codRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.warning.light,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  codText: { flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.warning.dark },
  primaryBtn: {
    backgroundColor: '#1a3a2a',
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#fff' },
  issueBtn: {
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.error.main,
  },
  issueBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.error.main },
  errorWrap: { alignItems: 'center', paddingTop: 60, gap: spacing.md, paddingHorizontal: spacing.xl },
  errorText: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500] },
  retryBtn: {
    backgroundColor: '#1a3a2a',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  retryBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#fff' },
});
