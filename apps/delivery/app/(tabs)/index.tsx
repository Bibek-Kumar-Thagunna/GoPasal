import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import apiClient from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';

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

type AssignedTask = {
  taskId: string;
  status: string;
  orderId: string;
  storeName: string;
  storeAddress: string | null;
  deliveryAddress: string | null;
  codAmount: string | null;
  codCollected: boolean | null;
  createdAt: string;
};

export default function ActiveRouteScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [locationPerms, setLocationPerms] = useState(false);

  const { data: tasks = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['rider-tasks-assigned'],
    queryFn: async () => {
      const { data } = await apiClient.get('/riders/tasks');
      return (data?.data ?? []) as AssignedTask[];
    },
    refetchInterval: 15000,
  });

  const { data: rider } = useQuery({
    queryKey: ['rider-me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/riders/me');
      return data?.data ?? null;
    },
    retry: false,
  });

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Location is required to show delivery routes.');
          return;
        }
        setLocationPerms(true);
      } catch {
        // Location unavailable on web — still allow browsing routes.
        setLocationPerms(true);
      }
    })();
  }, []);

  const isOnline = String(rider?.status ?? '').toUpperCase() === 'ONLINE';
  const activeTasks = tasks.filter((t) => t.status !== 'DELIVERED' && t.status !== 'FAILED' && t.status !== 'CANCELLED');

  // Share live location with customers while a route is in progress.
  useEffect(() => {
    if (!isOnline || activeTasks.length === 0) return;
    const share = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!loc?.coords) return;
        await apiClient.put('/riders/status', {
          status: 'ONLINE',
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
        });
      } catch {
        // Location sharing is best-effort.
      }
    };
    void share();
    const timer = setInterval(share, 15000);
    return () => clearInterval(timer);
  }, [isOnline, activeTasks.length]);

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <LinearGradient colors={['#1a3a2a', '#142c20']} style={styles.header}>
        <View>
          <T style={styles.greeting}>Rider Active Route</T>
          <T style={styles.userName}>{user?.name?.split(' ')[0] || 'Rider'} on Duty</T>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isOnline ? colors.success.main : colors.warning.main },
          ]}
        >
          <Ionicons name={isOnline ? 'bicycle' : 'bicycle-outline'} size={12} color="#fff" />
          <T style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</T>
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a3a2a" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <Pressable onPress={() => refetch()}>
              <View style={{ alignItems: 'center', padding: spacing.xs }}>
                <Ionicons name="refresh" size={16} color={colors.neutral[400]} />
              </View>
            </Pressable>
          }
        >
          <View style={styles.mapPlaceholder}>
            <View style={styles.mapOverlay}>
              <Ionicons name="map-outline" size={48} color={colors.primary[500]} />
              <T style={styles.mapText}>
                {locationPerms ? 'Live tracking map will appear here' : 'Enable location to use live tracking'}
              </T>
            </View>
          </View>

          <View style={styles.sectionRow}>
            <T style={styles.sectionTitle}>Current Deliveries</T>
            <Pressable onPress={() => router.push('/available' as any)} style={styles.browseBtn}>
              <T style={styles.browseBtnText}>Browse available</T>
            </Pressable>
          </View>

          {activeTasks.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="bicycle-outline" size={48} color={colors.neutral[300]} />
              <T style={styles.emptyText}>No active deliveries</T>
              <T style={styles.emptySub}>
                {isOnline
                  ? 'You are online. Available routes appear under "Browse available".'
                  : 'You are offline. Go to your profile and turn on duty status.'}
              </T>
            </View>
          ) : (
            activeTasks.map((task, i) => {
              const cod = task.codAmount != null && Number(task.codAmount) > 0;
              return (
                <Pressable
                  key={task.taskId}
                  onPress={() =>
                    router.push({
                      pathname: '/order/[id]',
                      params: { id: task.orderId, taskId: task.taskId },
                    } as any)
                  }
                >
                  <Animated.View
                    entering={FadeInDown.delay(i * 100).duration(400)}
                    style={styles.orderCard}
                  >
                    <View style={styles.orderHeader}>
                      <T style={styles.orderId}>#{task.orderId.slice(-8).toUpperCase()}</T>
                      <View style={styles.taskBadge}>
                        <T style={styles.taskBadgeText}>{task.status.replace(/_/g, ' ')}</T>
                      </View>
                    </View>
                    <View style={styles.orderRow}>
                      <Ionicons name="storefront-outline" size={15} color={colors.neutral[500]} />
                      <T style={styles.orderRowText} n={1}>
                        {task.storeName}
                      </T>
                    </View>
                    {task.deliveryAddress ? (
                      <View style={styles.orderRow}>
                        <Ionicons name="location-outline" size={15} color={colors.neutral[500]} />
                        <T style={styles.orderRowText} n={2}>
                          {task.deliveryAddress}
                        </T>
                      </View>
                    ) : null}
                    {cod ? (
                      <View style={styles.orderFooter}>
                        <T style={styles.amount}>{formatMoney(task.codAmount)}</T>
                        <T style={styles.codLabel}>COD to collect</T>
                      </View>
                    ) : null}
                  </Animated.View>
                </Pressable>
              );
            })
          )}

          {isError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error.main} />
              <T style={styles.errorText}>Could not load routes.</T>
              <Pressable onPress={() => refetch()}>
                <T style={styles.retryText}>Retry</T>
              </Pressable>
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
  },
  greeting: { fontFamily: 'Inter', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  userName: { fontFamily: 'Poppins-Bold', fontSize: 24, color: '#fff', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusText: { fontFamily: 'Poppins-SemiBold', fontSize: 11, color: '#fff' },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  mapPlaceholder: {
    height: 200,
    backgroundColor: colors.primary[100],
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    gap: spacing.sm,
  },
  mapText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.primary[700] },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.neutral[500],
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  browseBtn: {
    backgroundColor: '#1a3a2a',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  browseBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: '#fff' },
  orderCard: {
    backgroundColor: colors.surface.card,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[900] },
  taskBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  taskBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: colors.primary[600],
    textTransform: 'uppercase',
  },
  orderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  orderRowText: { flex: 1, fontFamily: 'Inter', fontSize: 13, color: colors.neutral[600] },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  amount: { fontFamily: 'Poppins-Bold', fontSize: 15, color: colors.neutral[900] },
  codLabel: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.warning.dark },
  empty: { alignItems: 'center', paddingTop: 40, gap: spacing.sm, paddingHorizontal: spacing.xl },
  emptyText: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[800] },
  emptySub: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  errorText: { fontFamily: 'Inter', fontSize: 13, color: colors.error.main, flex: 1 },
  retryText: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: colors.primary[600] },
});
