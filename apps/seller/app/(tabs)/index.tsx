import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Switch,
  Image,
  useWindowDimensions,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import apiClient from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';
import { useSellerWorkspace } from '../../src/hooks/useSellerWorkspace';
import { useSellerTenantReady } from '../../src/hooks/useSellerTenantReady';
import { useLanguageStore } from '../../src/store/language.store';

function T({ style, children, n }: { style?: any; children: React.ReactNode; n?: number }) {
  return (
    <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

function greetingLabel() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { t } = useLanguageStore();
  const router = useRouter();
  const qc = useQueryClient();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [shopOpen, setShopOpen] = useState(true);
  const [busyMode, setBusyMode] = useState(false);

  const { isReady } = useSellerTenantReady();
  const { store, activeStoreId, refetch: refetchStore, hasPermission, accessRole } = useSellerWorkspace();
  const canOperateStore = hasPermission('store.operations');
  const canViewStats = hasPermission('analytics.view');

  useEffect(() => {
    if (store) {
      setShopOpen(!!store.isOpen);
      setBusyMode(!!store.isBusyMode);
    }
  }, [store?.isOpen, store?.isBusyMode]);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['seller-stats', activeStoreId],
    queryFn: async () => (await apiClient.get('/seller/stats')).data?.data,
    enabled: isReady && canViewStats,
  });

  const { mutate: toggleOpen } = useMutation({
    mutationFn: async (isOpen: boolean) => {
      await apiClient.put('/seller/stores/toggle/open', { isOpen });
    },
    onSuccess: () => {
      void refetchStore();
      qc.invalidateQueries({ queryKey: ['seller-stats'] });
    },
  });

  const { mutate: toggleBusy } = useMutation({
    mutationFn: async (isBusy: boolean) => {
      await apiClient.put('/seller/stores/toggle/busy', { isBusy, etaMinutes: 15 });
    },
    onSuccess: () => {
      void refetchStore();
      qc.invalidateQueries({ queryKey: ['seller-stats'] });
    },
  });

  const handleShopOpen = (val: boolean) => {
    setShopOpen(val);
    toggleOpen(val, {
      onError: () => setShopOpen(!val),
    });
  };

  const handleBusy = (val: boolean) => {
    setBusyMode(val);
    toggleBusy(val, {
      onError: () => setBusyMode(!val),
    });
  };

  const chartMax = useMemo(() => {
    const pts = stats?.weekChart || [];
    const m = Math.max(1, ...pts.map((p: { revenue: number }) => p.revenue));
    return m;
  }, [stats?.weekChart]);

  const recent = stats?.recentOrders || [];
  const lowStock = stats?.lowStock || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface.background }} edges={['top']}>
      <LinearGradient colors={[colors.header.gradientStart, colors.header.gradientEnd]} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <T style={styles.greet}>
              {greetingLabel()}, {user?.name?.split(' ')[0] || 'Seller'}
            </T>
            <T style={styles.storeTitle}>{String((store as { name?: string } | null)?.name || 'Your store')}</T>
          </View>
          <View style={[styles.openPill, !shopOpen && styles.openPillOff]}>
            <T style={styles.openPillTxt}>{shopOpen ? 'Store is open' : 'Store is closed'}</T>
          </View>
        </View>

        <Pressable style={styles.searchRow} onPress={() => router.push('/(tabs)/orders' as any)}>
          <Ionicons name="search-outline" size={18} color={colors.neutral[400]} />
          <T style={styles.searchPlaceholder}>Search orders, customers, or products…</T>
        </Pressable>

        <View style={styles.heroActions}>
          <Pressable
            style={styles.roundIcon}
            onPress={() => router.push('/(tabs)/orders' as any)}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.neutral[700]} />
          </Pressable>
          <Pressable
            style={styles.roundIcon}
            onPress={() => void Linking.openURL('mailto:support@gopasal.com?subject=Seller%20help')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.neutral[700]} />
          </Pressable>
          <Pressable style={styles.profileChip} onPress={() => router.push('/(tabs)/settings' as any)}>
            <Image
              source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'S')}&background=fff&color=1D5A44` }}
              style={styles.profileAva}
            />
            <View>
              <T style={styles.profileName}>{user?.name || 'Store owner'}</T>
              <T style={styles.profileRole}>
                {accessRole === 'OWNER' ? 'Store owner' : 'Team member'}
              </T>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.neutral[500]} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={canViewStats && isRefetching}
            onRefresh={() => {
              void refetchStore();
              if (canViewStats) void refetch();
            }}
            tintColor={colors.primary[600]}
          />
        }
      >
        <View style={styles.floatCard}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <T style={styles.toggleTitle}>{t('dash.storeStatus')}</T>
              <T style={styles.toggleDesc}>{shopOpen ? t('dash.openStatus') : t('dash.closedStatus')}</T>
            </View>
            <Switch
              value={shopOpen}
              disabled={!canOperateStore}
              onValueChange={handleShopOpen}
              trackColor={{ false: colors.neutral[300], true: colors.success.main }}
              thumbColor="#fff"
            />
          </View>
          {shopOpen ? (
            <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: colors.neutral[100], marginTop: spacing.md, paddingTop: spacing.md }]}>
              <View style={{ flex: 1 }}>
                <T style={styles.toggleTitle}>Busy mode</T>
                <T style={styles.toggleDesc}>Adds 15 min to prep ETA</T>
              </View>
              <Switch
                value={busyMode}
                disabled={!canOperateStore}
                onValueChange={handleBusy}
                trackColor={{ false: colors.neutral[300], true: colors.warning.main }}
                thumbColor="#fff"
              />
            </View>
          ) : null}
        </View>

        {!canViewStats ? (
          <View style={{ marginTop: spacing.xl, padding: spacing.lg }}>
            <T style={{ fontFamily: 'Inter', color: colors.neutral[600], textAlign: 'center' }}>
              Your role does not include full dashboard analytics. Use Orders for day-to-day work.
            </T>
          </View>
        ) : isLoading ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary[600]} />
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.banner}>
              <View style={{ flex: 1 }}>
                <T style={styles.bannerTitle}>Quick tips</T>
                <T style={styles.bannerText}>Offer fair delivery fees and highlight bestsellers to grow repeat orders.</T>
                <Pressable
                  style={styles.bannerBtn}
                  onPress={() => router.push('/(tabs)/settings' as any)}
                >
                  <T style={styles.bannerBtnTxt}>Delivery settings</T>
                </Pressable>
              </View>
              <Ionicons name="storefront-outline" size={56} color={colors.primary[400]} />
            </Animated.View>

            <View style={isWide ? styles.split : styles.splitCol}>
              <Animated.View entering={FadeInDown.delay(120).duration(400)} style={[styles.panel, isWide && { flex: 1 }]}>
                <View style={styles.panelHead}>
                  <T style={styles.panelTitle}>Recent orders</T>
                  <Pressable onPress={() => router.push('/(tabs)/orders' as any)}>
                    <T style={styles.link}>View all</T>
                  </Pressable>
                </View>
                {recent.length === 0 ? (
                  <T style={styles.muted}>No orders yet</T>
                ) : (
                  recent.map((o: any) => {
                    const st = o.status?.replace(/_/g, ' ') || '';
                    return (
                      <Pressable key={o.id} style={styles.ro} onPress={() => router.push(`/order/${o.id}` as any)}>
                        <View style={{ flex: 1 }}>
                          <T style={styles.roId}>#{String(o.id).slice(-6).toUpperCase()}</T>
                          <T style={styles.roSub} n={1}>
                            {o.user?.name || 'Customer'}
                          </T>
                        </View>
                        <T style={styles.roAmt}>NPR {Number(o.totalAmount || 0).toLocaleString()}</T>
                        <View style={styles.roPill}>
                          <T style={styles.roPillTxt}>{st}</T>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(160).duration(400)} style={[styles.panel, isWide && { flex: 1 }]}>
                <View style={styles.panelHead}>
                  <T style={styles.panelTitle}>Sales (this week)</T>
                </View>
                <View style={styles.chartRow}>
                  {(stats?.weekChart || []).map((pt: { label: string; revenue: number }, i: number) => {
                    const h = chartMax ? Math.max(8, (pt.revenue / chartMax) * 120) : 8;
                    return (
                      <View key={i} style={styles.barWrap}>
                        <View style={[styles.bar, { height: h }]} />
                        <T style={styles.barLab}>{pt.label}</T>
                      </View>
                    );
                  })}
                </View>
              </Animated.View>
            </View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.panel}>
              <View style={styles.panelHead}>
                <T style={styles.panelTitle}>Low stock</T>
                <Pressable onPress={() => router.push('/(tabs)/inventory' as any)}>
                  <T style={styles.link}>Manage inventory</T>
                </Pressable>
              </View>
              {lowStock.length === 0 ? (
                <T style={styles.muted}>No low stock items</T>
              ) : (
                lowStock.map((p: any) => (
                  <View key={p.id} style={styles.lsRow}>
                    <Image source={{ uri: p.image || 'https://placehold.co/48x48/png' }} style={styles.lsImg} />
                    <View style={{ flex: 1 }}>
                      <T style={styles.lsName} n={2}>
                        {p.name}
                      </T>
                      <T style={styles.roSub}>{p.remaining} left</T>
                    </View>
                    <View style={styles.lsBadge}>
                      <T style={styles.lsBadgeTxt}>Low</T>
                    </View>
                  </View>
                ))
              )}
            </Animated.View>

            <View style={styles.kpis}>
              {[
                { label: t('dash.revenue'), value: `NPR ${(stats?.todayRevenue ?? 0).toLocaleString()}`, icon: 'cash-outline' as const },
                { label: t('dash.orders'), value: String(stats?.todayOrders ?? 0), icon: 'bag-outline' as const },
                { label: t('dash.pending'), value: String(stats?.pendingOrders ?? 0), icon: 'time-outline' as const },
                { label: t('nav.products'), value: String(stats?.totalProducts ?? 0), icon: 'cube-outline' as const },
              ].map((k) => (
                <View key={k.label} style={styles.kpiCard}>
                  <Ionicons name={k.icon} size={22} color={colors.primary[600]} />
                  <T style={styles.kpiVal}>{k.value}</T>
                  <T style={styles.kpiLab}>{k.label}</T>
                </View>
              ))}
            </View>
          </>
        )}

        <T style={styles.footer}>Powered by GoPasal Marketplace</T>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
  greet: { fontFamily: 'Inter', fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  storeTitle: { fontFamily: 'Poppins-Bold', fontSize: 24, color: '#fff', marginTop: 4 },
  openPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  openPillOff: { backgroundColor: 'rgba(0,0,0,0.15)' },
  openPillTxt: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#fff' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 46,
    marginBottom: spacing.lg,
  },
  searchPlaceholder: { flex: 1, fontFamily: 'Inter', fontSize: 14, color: colors.neutral[400] },

  heroActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  roundIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    marginLeft: spacing.sm,
  },
  profileAva: { width: 36, height: 36, borderRadius: 18 },
  profileName: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: colors.neutral[900] },
  profileRole: { fontFamily: 'Inter', fontSize: 11, color: colors.neutral[500] },

  body: { padding: spacing['2xl'], paddingBottom: 100, gap: spacing.lg },
  floatCard: {
    marginTop: -spacing.xl,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...Platform.select({ web: { boxShadow: '0 8px 30px rgba(15,23,42,0.08)' } as any, default: { elevation: 4 } }),
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.neutral[900] },
  toggleDesc: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500], marginTop: 2 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  bannerTitle: { fontFamily: 'Poppins-Bold', fontSize: 16, color: colors.primary[800] },
  bannerText: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[600], marginTop: 4, lineHeight: 20 },
  bannerBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  bannerBtnTxt: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: '#fff' },

  split: { flexDirection: 'row', gap: spacing.lg },
  splitCol: { gap: spacing.lg },
  panel: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  panelTitle: { fontFamily: 'Poppins-Bold', fontSize: 16, color: colors.neutral[900] },
  link: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.primary[600] },
  muted: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[400] },

  ro: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  roId: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: colors.neutral[900] },
  roSub: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500], marginTop: 2 },
  roAmt: { fontFamily: 'Poppins-Bold', fontSize: 13, color: colors.primary[700], marginRight: spacing.sm },
  roPill: { backgroundColor: colors.neutral[100], paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  roPillTxt: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: colors.neutral[600], textTransform: 'capitalize' },

  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, paddingTop: spacing.md },
  barWrap: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { width: '56%', backgroundColor: colors.primary[400], borderRadius: 6, minHeight: 8 },
  barLab: { fontFamily: 'Inter', fontSize: 10, color: colors.neutral[500] },

  lsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  lsImg: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.neutral[100] },
  lsName: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: colors.neutral[900] },
  lsBadge: { backgroundColor: colors.warning.light, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  lsBadgeTxt: { fontFamily: 'Inter-Bold', fontSize: 10, color: colors.warning.dark },

  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    gap: 6,
  },
  kpiVal: { fontFamily: 'Poppins-Bold', fontSize: 20, color: colors.neutral[900] },
  kpiLab: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500] },

  footer: { textAlign: 'center', fontFamily: 'Inter', fontSize: 11, color: colors.neutral[400], marginTop: spacing.lg },
});
