import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import apiClient from '../../src/services/api';
import { useSellerTenantReady } from '../../src/hooks/useSellerTenantReady';

function T({ style, children, n }: { style?: object; children: React.ReactNode; n?: number }) {
  return (
    <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

type EarningsSummary = {
  currency: string;
  lifetimeDeliveredRevenue: number;
  lifetimeDeliveredOrders: number;
  last30DaysRevenue: number;
  last30DaysOrders: number;
  openPipelineOrders: number;
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  status: string;
  createdAt: string;
  totals?: { totalAmount?: number | string } | null;
};

type SellerWallet = {
  escrowHeld: string | number;
  pendingRelease: string | number;
  availableBalance: string | number;
  withdrawnTotal?: string | number;
  currency: string;
};

export default function EarningsScreen() {
  const { isReady } = useSellerTenantReady();

  const summaryQuery = useQuery({
    queryKey: ['seller-earnings-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/earnings/summary');
      return data?.data as EarningsSummary;
    },
    enabled: isReady,
    retry: false,
  });

  const invoicesQuery = useQuery({
    queryKey: ['seller-earnings-invoices'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/earnings/invoices');
      return (data?.data ?? []) as InvoiceRow[];
    },
    enabled: isReady,
    retry: false,
  });

  const walletQuery = useQuery({
    queryKey: ['seller-payments-wallet'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/payments/wallet');
      return data?.data as SellerWallet;
    },
    enabled: isReady,
    retry: false,
  });

  const forbidden =
    (isAxiosError(summaryQuery.error) && summaryQuery.error.response?.status === 403) ||
    (isAxiosError(invoicesQuery.error) && invoicesQuery.error.response?.status === 403);

  const summary = summaryQuery.data;
  const invoices = invoicesQuery.data ?? [];
  const loading = summaryQuery.isLoading || invoicesQuery.isLoading;
  const refreshing = summaryQuery.isRefetching || invoicesQuery.isRefetching;

  const handleRefresh = () => {
    void summaryQuery.refetch();
    void invoicesQuery.refetch();
  };

  const invTotal = (inv: InvoiceRow) => {
    const t = inv.totals?.totalAmount;
    if (t == null) return null;
    const n = typeof t === 'string' ? Number(t) : t;
    return Number.isFinite(n) ? n : null;
  };

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <T style={styles.title}>Earnings</T>
        <T style={styles.sub}>Delivered order revenue and issued invoices for payouts and taxes.</T>
      </View>

      {forbidden ? (
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.neutral[400]} />
          <T style={styles.forbiddenTitle}>Owner only</T>
          <T style={styles.forbiddenSub}>Only the store owner can view earnings and invoices.</T>
        </View>
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          {walletQuery.data ? (
            <Animated.View entering={FadeInDown.delay(10)} style={styles.walletGrid}>
              <View style={styles.walletCell}>
                <T style={styles.walletLabel}>Available</T>
                <T style={styles.walletValue}>
                  {walletQuery.data.currency}{' '}
                  {Number(walletQuery.data.availableBalance).toFixed(0)}
                </T>
              </View>
              <View style={styles.walletCell}>
                <T style={styles.walletLabel}>In escrow</T>
                <T style={styles.walletValue}>
                  {walletQuery.data.currency} {Number(walletQuery.data.escrowHeld).toFixed(0)}
                </T>
              </View>
              <View style={styles.walletCell}>
                <T style={styles.walletLabel}>Pending release</T>
                <T style={styles.walletValue}>
                  {walletQuery.data.currency}{' '}
                  {Number(walletQuery.data.pendingRelease).toFixed(0)}
                </T>
              </View>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(20)} style={styles.trustCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary[700]} />
            <View style={{ flex: 1, gap: 4 }}>
              <T style={styles.trustTitle}>Transparent payouts</T>
              <T style={styles.trustBody}>
                Online customer payments are held in escrow until you mark the order delivered. For COD, confirm cash
                when completing delivery — that unlocks your earnings record.
              </T>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(40)} style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <T style={styles.balanceLabel}>Delivered revenue (lifetime)</T>
              <Ionicons name="trending-up-outline" size={20} color="rgba(255,255,255,0.75)" />
            </View>
            <T style={styles.balanceAmount}>
              {summary?.currency ?? 'NPR'}{' '}
              {(summary?.lifetimeDeliveredRevenue ?? 0).toLocaleString('en-NP', { maximumFractionDigits: 0 })}
            </T>
            <T style={styles.balanceFoot}>
              {summary?.lifetimeDeliveredOrders ?? 0} delivered orders · {summary?.openPipelineOrders ?? 0} in pipeline
            </T>
          </Animated.View>

          <View style={styles.statsRow}>
            <Animated.View entering={FadeInDown.delay(80)} style={styles.statBox}>
              <T style={styles.statVal}>
                NPR {(summary?.last30DaysRevenue ?? 0).toLocaleString('en-NP', { maximumFractionDigits: 0 })}
              </T>
              <T style={styles.statDesc}>Last 30 days</T>
              <T style={styles.statTiny}>{summary?.last30DaysOrders ?? 0} orders</T>
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(120)} style={styles.statBox}>
              <T style={styles.statVal}>{invoices.length}</T>
              <T style={styles.statDesc}>Invoices on file</T>
              <T style={styles.statTiny}>Tax / payout records</T>
            </Animated.View>
          </View>

          <T style={styles.sectionTitle}>Withdrawals</T>
          <View style={styles.placeholderCard}>
            <Ionicons name="wallet-outline" size={22} color={colors.neutral[500]} />
            <T style={styles.placeholderText}>
              Payouts run through platform settlement batches. GoPasal finance generates a settlement for your shop;
              after the transfer, you will see the reference on your invoice rows below. Direct “withdraw now” is not
              available until your shop has delivered orders and finance marks a batch paid.
            </T>
          </View>

          <T style={styles.sectionTitle}>Recent invoices</T>
          {invoices.length === 0 ? (
            <View style={styles.emptyInv}>
              <T style={styles.muted}>No invoices yet. Invoices are created when orders are settled through billing.</T>
            </View>
          ) : (
            invoices.slice(0, 25).map((inv, index) => {
              const amt = invTotal(inv);
              return (
                <Animated.View
                  key={inv.id}
                  entering={FadeInDown.delay(140 + index * 30)}
                  style={styles.trxCard}
                >
                  <View style={styles.trxIcon}>
                    <Ionicons name="document-text-outline" size={20} color={colors.primary[600]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T style={styles.trxTitle}>{inv.invoiceNumber}</T>
                    <T style={styles.trxDate}>{String(inv.createdAt).slice(0, 16).replace('T', ' ')}</T>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {amt != null ? (
                      <T style={styles.trxAmount}>NPR {amt.toLocaleString('en-NP', { maximumFractionDigits: 0 })}</T>
                    ) : (
                      <T style={styles.trxAmount}>—</T>
                    )}
                    <T style={styles.trxStatus}>{inv.status}</T>
                  </View>
                </Animated.View>
              );
            })
          )}
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
  content: {
    padding: spacing.lg, gap: spacing.lg,
    ...(Platform.OS === 'web' && { maxWidth: 1000, width: '100%', alignSelf: 'center' }),
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'], gap: spacing.sm },
  forbiddenTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: colors.neutral[800] },
  forbiddenSub: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500], textAlign: 'center' },
  balanceCard: {
    backgroundColor: colors.hero.gradientStart,
    padding: spacing['2xl'],
    borderRadius: radius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  balanceLabel: { fontFamily: 'Inter-Medium', fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  balanceAmount: { fontFamily: 'Poppins-Bold', fontSize: 32, color: '#fff', marginBottom: spacing.sm },
  balanceFoot: { fontFamily: 'Inter', fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  trustCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary[100],
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  walletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  walletCell: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  walletLabel: { fontFamily: 'Inter', fontSize: 11, color: colors.neutral[500] },
  walletValue: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[900], marginTop: 4 },
  trustTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.primary[900] },
  trustBody: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[700], lineHeight: 18 },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  statVal: { fontFamily: 'Poppins-Bold', fontSize: 20, color: colors.neutral[900] },
  statDesc: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500], marginTop: 4 },
  statTiny: { fontFamily: 'Inter', fontSize: 11, color: colors.neutral[400], marginTop: 4 },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[900], marginTop: spacing.sm },
  placeholderCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
    backgroundColor: colors.neutral[50],
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  placeholderText: { flex: 1, fontFamily: 'Inter', fontSize: 13, color: colors.neutral[600], lineHeight: 20 },
  emptyInv: { paddingVertical: spacing.md },
  muted: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500] },
  trxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  trxIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  trxTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.neutral[900] },
  trxDate: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500] },
  trxAmount: { fontFamily: 'Poppins-Bold', fontSize: 15, color: colors.neutral[900] },
  trxStatus: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: colors.neutral[400], marginTop: 2 },
});
