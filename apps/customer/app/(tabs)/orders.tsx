import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../../src/components/GText';
import { EmptyState, OrderSkeletonList } from '../../src/components/StateViews';
import { useOrders } from '../../src/services/hooks';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import { formatMoney } from '../../src/utils/money';
import { useTranslation, type TranslationKey } from '../../src/i18n';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING_PAYMENT: { bg: colors.warning.light, text: colors.warning.dark },
  PLACED: { bg: colors.warning.light, text: colors.warning.dark },
  ACCEPTED: { bg: colors.info.light, text: colors.info.dark },
  CONFIRMED: { bg: colors.info.light, text: colors.info.dark },
  PACKED: { bg: colors.info.light, text: colors.info.dark },
  OUT_FOR_DELIVERY: { bg: colors.info.light, text: colors.info.dark },
  DELIVERED: { bg: colors.success.light, text: colors.success.dark },
  CANCELLED: { bg: colors.error.light, text: colors.error.dark },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
  const { data: orders, isLoading, refetch } = useOrders();

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const activeOrders = (orders || []).filter(
    (o: { status: string }) => !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.status)
  );
  const pastOrders = (orders || []).filter(
    (o: any) => ['DELIVERED', 'CANCELLED'].includes(o.status)
  );
  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return d; }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.content}>
        <GText style={styles.pageTitle} weight="bold">{t('orders.title')}</GText>

        <View style={styles.tabs}>
          {(['active', 'past'] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <GText
                weight={activeTab === tab ? 'semiBold' : 'medium'}
                style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
              >
                {tab === 'active'
                  ? t('orders.active', { count: activeOrders.length })
                  : t('orders.past', { count: pastOrders.length })}
              </GText>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.list}>
            <OrderSkeletonList count={4} />
          </View>
        ) : displayOrders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title={activeTab === 'active' ? t('orders.noActive') : t('orders.noPast')}
            message={activeTab === 'active' ? t('orders.noActiveMsg') : t('orders.noPastMsg')}
            actionLabel={t('common.browseShops')}
            onAction={() => router.push('/(tabs)')}
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
            }
          >
            {displayOrders.map((order: any, i: number) => {
              const statusColor = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING;
              return (
                <Animated.View key={order.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                  <Pressable
                    style={styles.card}
                    onPress={() => router.push(`/order/${order.id}` as any)}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1, paddingRight: spacing.sm }}>
                        <GText weight="semiBold" style={{ fontSize: 15 }} numberOfLines={1}>
                          {order.items && order.items.length > 0 
                            ? `${order.items[0].productName}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}`
                            : t('orders.orderNum', { id: order.id?.slice(-6).toUpperCase() })}
                        </GText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                        <GText style={[styles.statusText, { color: statusColor.text }]} weight="semiBold">
                          {translateStatus(t, order.status)}
                        </GText>
                      </View>
                    </View>
                    <View style={styles.cardMeta}>
                      <GText style={styles.cardDate}>{formatDate(order.createdAt)}</GText>
                      <GText style={styles.cardAmount} weight="bold">
                        {formatMoney(order.total ?? order.totalAmount)}
                      </GText>
                    </View>
                    <View style={styles.cardFooter}>
                      <GText style={styles.viewLink} weight="semiBold">{t('orders.viewDetails')}</GText>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary[500]} />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const KNOWN_STATUSES = new Set([
  'PENDING_PAYMENT', 'PLACED', 'ACCEPTED', 'CONFIRMED', 'PACKED', 'SHIPPED',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'PENDING', 'PREPARING', 'READY',
]);

function translateStatus(t: (key: TranslationKey) => string, status: string): string {
  if (KNOWN_STATUSES.has(status)) return t(`status.${status}` as TranslationKey);
  return status;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  content: { flex: 1, padding: spacing.lg, maxWidth: 800, alignSelf: 'center', width: '100%' },
  pageTitle: { fontSize: 28, color: colors.neutral[900], marginBottom: spacing.lg },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tabBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.pill, backgroundColor: colors.neutral[100],
  },
  tabBtnActive: { backgroundColor: colors.primary[500] },
  tabText: { fontSize: 14, color: colors.neutral[500] },
  tabTextActive: { color: '#fff' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  list: { gap: spacing.md },
  card: {
    backgroundColor: '#fff', padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.neutral[150],
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionProperty: 'transform, box-shadow',
        transitionDuration: '200ms',
        transitionTimingFunction: 'ease-out',
      } as any,
    }),
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill,
  },
  statusText: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardMeta: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardDate: { fontSize: 12, color: colors.neutral[400] },
  cardAmount: { fontSize: 16, color: colors.primary[700] },
  itemsText: { fontSize: 13, color: colors.neutral[500], marginTop: spacing.xs },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.neutral[100],
  },
  viewLink: { fontSize: 13, color: colors.primary[500] },
});
