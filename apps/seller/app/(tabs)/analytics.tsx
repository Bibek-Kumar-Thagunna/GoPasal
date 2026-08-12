import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import apiClient from '../../src/services/api';
import { useSellerWorkspace } from '../../src/hooks/useSellerWorkspace';
import { useSellerTenantReady } from '../../src/hooks/useSellerTenantReady';

function T({ style, children, n }: { style?: object; children: React.ReactNode; n?: number }) {
  return (
    <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

type StatsPayload = {
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  weekChart: { label: string; revenue: number }[];
  recentOrders: unknown[];
  lowStock: { id: string; name: string; remaining: number; threshold: number; image: string | null }[];
};

export default function AnalyticsScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { isReady } = useSellerTenantReady();
  const { activeStoreId, hasPermission } = useSellerWorkspace();
  const canView = hasPermission('analytics.view');

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['seller-stats', activeStoreId],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/stats');
      return data?.data as StatsPayload;
    },
    enabled: isReady && canView,
  });

  const chartMax = useMemo(() => {
    const pts = stats?.weekChart || [];
    return Math.max(1, ...pts.map((p) => p.revenue));
  }, [stats?.weekChart]);

  if (!canView) {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <View style={styles.header}>
          <T style={styles.title}>Analytics</T>
        </View>
        <View style={styles.blocked}>
          <Ionicons name="bar-chart-outline" size={48} color={colors.neutral[300]} />
          <T style={styles.blockedTitle}>Analytics not enabled for your role</T>
          <T style={styles.blockedSub}>Ask the store owner to grant analytics access, or use Orders for live activity.</T>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <T style={styles.title}>Analytics</T>
        <T style={styles.sub}>Revenue trend, catalogue size, and fulfilment pressure for this branch.</T>
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
        >
          <View style={styles.kpiGrid}>
            {[
              { label: 'Today revenue', value: `NPR ${(stats?.todayRevenue ?? 0).toLocaleString()}`, icon: 'cash-outline' as const },
              { label: 'Today orders', value: String(stats?.todayOrders ?? 0), icon: 'today-outline' as const },
              { label: 'All-time revenue', value: `NPR ${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: 'stats-chart-outline' as const },
              { label: 'Total orders', value: String(stats?.totalOrders ?? 0), icon: 'receipt-outline' as const },
              { label: 'Pending intake', value: String(stats?.pendingOrders ?? 0), icon: 'hourglass-outline' as const },
              { label: 'Active products', value: String(stats?.totalProducts ?? 0), icon: 'cube-outline' as const },
            ].map((k, i) => (
              <Animated.View key={k.label} entering={FadeInDown.delay(40 + i * 35)} style={styles.kpiCard}>
                <Ionicons name={k.icon} size={22} color={colors.primary[600]} />
                <T style={styles.kpiVal}>{k.value}</T>
                <T style={styles.kpiLab}>{k.label}</T>
              </Animated.View>
            ))}
          </View>

          <Animated.View entering={FadeInDown.delay(120)} style={styles.panel}>
            <T style={styles.panelTitle}>Sales (last 7 days)</T>
            <View style={[styles.chartRow, isWide && styles.chartRowWide]}>
              {(stats?.weekChart || []).map((pt, i) => {
                const h = chartMax ? Math.max(10, (pt.revenue / chartMax) * 140) : 10;
                return (
                  <View key={i} style={styles.barWrap}>
                    <View style={[styles.bar, { height: h }]} />
                    <T style={styles.barLab}>{pt.label}</T>
                    <T style={styles.barAmt} n={1}>
                      {pt.revenue > 0 ? `NPR ${Math.round(pt.revenue)}` : '—'}
                    </T>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180)} style={styles.panel}>
            <View style={styles.panelHead}>
              <T style={styles.panelTitle}>Low stock</T>
            </View>
            {(stats?.lowStock || []).length === 0 ? (
              <T style={styles.muted}>No low stock SKUs right now.</T>
            ) : (
              (stats?.lowStock || []).map((p) => (
                <View key={p.id} style={styles.lsRow}>
                  <Image
                    source={{ uri: p.image || 'https://placehold.co/48x48/png' }}
                    style={styles.lsImg}
                  />
                  <View style={{ flex: 1 }}>
                    <T style={styles.lsName} n={2}>
                      {p.name}
                    </T>
                    <T style={styles.lsSub}>
                      {p.remaining} left (threshold {p.threshold})
                    </T>
                  </View>
                  <View style={styles.lsBadge}>
                    <T style={styles.lsBadgeTxt}>Low</T>
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: { paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  sub: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500], marginTop: 4 },
  body: {
    padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.lg,
    ...(Platform.OS === 'web' && { maxWidth: 1000, width: '100%', alignSelf: 'center' }),
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'], gap: spacing.sm },
  blockedTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: colors.neutral[800], textAlign: 'center' },
  blockedSub: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500], textAlign: 'center' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpiCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    gap: 4,
  },
  kpiVal: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[900] },
  kpiLab: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500] },
  panel: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  panelTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[900], marginBottom: spacing.md },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 4, minHeight: 160 },
  chartRowWide: { paddingHorizontal: spacing.md },
  barWrap: { flex: 1, alignItems: 'center', gap: 6 },
  bar: { width: '72%', maxWidth: 36, backgroundColor: colors.primary[500], borderRadius: 6 },
  barLab: { fontFamily: 'Inter', fontSize: 10, color: colors.neutral[500] },
  barAmt: { fontFamily: 'Inter', fontSize: 9, color: colors.neutral[400] },
  muted: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500] },
  lsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  lsImg: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.neutral[100] },
  lsName: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.neutral[900] },
  lsSub: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500], marginTop: 2 },
  lsBadge: { backgroundColor: colors.warning.light, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  lsBadgeTxt: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.warning.dark },
});
