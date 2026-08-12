import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import apiClient from '../src/services/api';

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

type AvailableTask = {
  taskId: string;
  orderId: string;
  storeName: string;
  storeAddress: string | null;
  deliveryAddress: string | null;
  totalAmount: string;
  codAmount: string | null;
  isGreenDelivery: boolean;
  createdAt: string;
};

export default function AvailableDeliveriesScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const {
    data: tasks = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['rider-tasks-available'],
    queryFn: async () => {
      const { data } = await apiClient.get('/riders/tasks/available');
      return (data?.data ?? []) as AvailableTask[];
    },
    refetchInterval: 20000,
  });

  const accept = useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await apiClient.post(`/riders/tasks/${taskId}/accept`);
      return data?.data as { id?: string; orderId?: string };
    },
    onSuccess: (_result, taskId) => {
      const task = tasks.find((t) => t.taskId === taskId);
      qc.invalidateQueries({ queryKey: ['rider-tasks-available'] });
      qc.invalidateQueries({ queryKey: ['rider-tasks-assigned'] });
      qc.invalidateQueries({ queryKey: ['rider-me'] });
      router.push({
        pathname: '/order/[id]',
        params: { id: task?.orderId ?? '', taskId },
      });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        'Could not accept this route. Try again.';
      Alert.alert('Accept failed', message);
    },
  });

  const renderItem = ({ item, index }: { item: AvailableTask; index: number }) => {
    const cod = item.codAmount != null && Number(item.codAmount) > 0;
    return (
      <Animated.View entering={FadeInDown.delay(index * 60).duration(400)} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.storeIcon}>
            <Ionicons name="storefront-outline" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <T style={styles.storeName} n={1}>
              {item.storeName}
            </T>
            {item.storeAddress ? (
              <T style={styles.muted} n={1}>
                {item.storeAddress}
              </T>
            ) : null}
          </View>
          <T style={styles.amount}>{formatMoney(item.totalAmount)}</T>
        </View>

        <View style={styles.cardBody}>
          {item.deliveryAddress ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={15} color={colors.neutral[500]} />
              <T style={styles.muted} n={2}>
                {item.deliveryAddress}
              </T>
            </View>
          ) : null}
          <View style={styles.badgeRow}>
            {cod ? (
              <View style={styles.codBadge}>
                <Ionicons name="cash-outline" size={12} color={colors.warning.dark} />
                <T style={styles.codBadgeText}>COD {formatMoney(item.codAmount)}</T>
              </View>
            ) : null}
            {item.isGreenDelivery ? (
              <View style={styles.greenBadge}>
                <Ionicons name="leaf-outline" size={12} color={colors.success.dark} />
                <T style={styles.greenBadgeText}>Green delivery</T>
              </View>
            ) : null}
          </View>
        </View>

        <Pressable
          style={[styles.acceptBtn, accept.isPending && styles.btnDisabled]}
          disabled={accept.isPending}
          onPress={() => accept.mutate(item.taskId)}
        >
          {accept.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <T style={styles.acceptBtnText}>Accept Route</T>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <T style={styles.title}>Available Deliveries</T>
          <T style={styles.subtitle}>Open routes waiting for a rider</T>
        </View>
        <Pressable onPress={() => refetch()} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.neutral[700]} />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#1a3a2a" />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.taskId}
          renderItem={renderItem}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bicycle-outline" size={48} color={colors.neutral[300]} />
              <T style={styles.emptyText}>No routes available</T>
              <T style={styles.emptySub}>
                New delivery routes will appear here. Make sure you're online in your profile.
              </T>
              <Pressable
                style={styles.dutyBtn}
                onPress={() => router.push('/(tabs)/settings' as any)}
              >
                <T style={styles.dutyBtnText}>Go online</T>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  title: { fontFamily: 'Poppins-Bold', fontSize: 20, color: colors.neutral[900] },
  subtitle: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500] },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.md },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  storeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1a3a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.neutral[900] },
  amount: { fontFamily: 'Poppins-Bold', fontSize: 15, color: colors.neutral[900] },
  cardBody: { marginTop: spacing.md, gap: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  muted: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500], flex: 1 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  codBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.warning.light,
  },
  codBadgeText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.warning.dark },
  greenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.success.light,
  },
  greenBadgeText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.success.dark },
  acceptBtn: {
    marginTop: spacing.md,
    backgroundColor: '#1a3a2a',
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  acceptBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyText: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[800] },
  emptySub: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 19,
  },
  dutyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent[500],
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: radius.pill,
  },
  dutyBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#fff' },
});
