import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  useWindowDimensions,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { webInputFocusRing } from '@gopasal/ui';
import apiClient from '../../src/services/api';
import { useSellerWorkspace } from '../../src/hooks/useSellerWorkspace';
import { useSellerTenantReady } from '../../src/hooks/useSellerTenantReady';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';

type OrderGroup = 'ALL' | 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

const TABS: { key: OrderGroup; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'PREPARING', label: 'Preparing' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  PENDING_PAYMENT: { bg: '#FEF3C7', fg: '#92400E', label: 'Pending payment' },
  PLACED: { bg: '#FEF3C7', fg: '#92400E', label: 'Pending' },
  ACCEPTED: { bg: '#DCFCE7', fg: '#166534', label: 'Accepted' },
  CONFIRMED: { bg: '#DBEAFE', fg: '#1E40AF', label: 'Preparing' },
  PACKED: { bg: '#EDE9FE', fg: '#5B21B6', label: 'Packed' },
  SHIPPED: { bg: '#ECFCCB', fg: '#3F6212', label: 'Shipped' },
  OUT_FOR_DELIVERY: { bg: '#ECFCCB', fg: '#3F6212', label: 'Out for delivery' },
  DELIVERED: { bg: '#BBF7D0', fg: '#14532D', label: 'Delivered' },
  CANCELLED: { bg: '#FEE2E2', fg: '#991B1B', label: 'Cancelled' },
  RETURN_INITIATED: { bg: '#F1F5F9', fg: '#475569', label: 'Return' },
  RETURNED: { bg: '#F1F5F9', fg: '#475569', label: 'Returned' },
};

function fulfillmentBadge(fulfillmentType?: string | null): { bg: string; fg: string; label: string } | null {
  if (fulfillmentType === 'PICKUP') {
    return { bg: '#E0F2FE', fg: '#0369A1', label: 'Pickup' };
  }
  if (fulfillmentType === 'MERCHANT_DELIVERY') {
    return { bg: '#F3E8FF', fg: '#6B21A8', label: 'We deliver' };
  }
  if (fulfillmentType === 'PLATFORM_LOGISTICS') {
    return { bg: '#CCFBF1', fg: '#0F766E', label: 'GoPasal fleet' };
  }
  return null;
}

function nextAction(status: string, fulfillmentType?: string | null): { label: string; next: string } | null {
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

function T({ style, children, n }: { style?: any; children: React.ReactNode; n?: number }) {
  return (
    <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

function formatMoney(v: string | number) {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(n)) return '0';
  return `NPR ${n.toLocaleString('en-NP', { maximumFractionDigits: 0 })}`;
}

function OrderRowDesktop({ order, index, onAdvance, onCancel, onOpen }: any) {
  const st = STATUS_STYLE[order.status] || STATUS_STYLE.PLACED;
  const user = order.user;
  const addr = order.deliveryAddress;
  const fBadge = fulfillmentBadge(order.fulfillmentType);
  const addrLine =
    order.fulfillmentType === 'PICKUP'
      ? 'Store pickup'
      : addr
        ? `${addr.addressLine}, ${addr.city}`
        : '—';
  const first = order.items?.[0];
  const action = nextAction(order.status, order.fulfillmentType);
  const more = (order.items?.length || 0) - 1;

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(320)} style={styles.tableRow}>
      <View style={{ width: 120 }}>
        <T style={styles.oid}>#{String(order.id).slice(-6).toUpperCase()}</T>
        <T style={styles.otime}>{new Date(order.createdAt).toLocaleString('en-NP', { dateStyle: 'short', timeStyle: 'short' })}</T>
        {fBadge ? (
          <View style={[styles.fulfillPill, { backgroundColor: fBadge.bg }]}>
            <T style={[styles.fulfillPillTxt, { color: fBadge.fg }]}>{fBadge.label}</T>
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1.2, paddingRight: spacing.sm }}>
        <T style={styles.custName}>{user?.name || 'Customer'}</T>
        <T style={styles.custSub} n={2}>
          {user?.phone || '—'} · {addrLine}
        </T>
      </View>
      <View style={{ flex: 1.4 }}>
        {first ? (
          <>
            <T style={styles.itemTitle} n={1}>
              {first.productName}
            </T>
            <T style={styles.custSub}>
              Qty {first.quantity}
              {more > 0 ? ` · +${more} more` : ''}
            </T>
          </>
        ) : (
          <T style={styles.custSub}>—</T>
        )}
      </View>
      <View style={{ width: 110, alignItems: 'flex-end' }}>
        <T style={styles.amt}>{formatMoney(order.totalAmount)}</T>
        <View style={[styles.pill, { backgroundColor: st.bg }]}>
          <T style={[styles.pillTxt, { color: st.fg }]}>{st.label}</T>
        </View>
      </View>
      <View style={styles.actions}>
        {action ? (
          <Pressable style={styles.btnPrimary} onPress={() => onAdvance(order.id, action.next, order)}>
            <T style={styles.btnPrimaryTxt}>{action.label}</T>
          </Pressable>
        ) : null}
        {(order.status === 'PLACED' || order.status === 'PENDING_PAYMENT') && (
          <Pressable style={styles.btnGhost} onPress={() => onCancel(order.id)}>
            <T style={styles.btnGhostTxt}>Cancel</T>
          </Pressable>
        )}
        <Pressable style={styles.iconOnly} onPress={() => onOpen(order.id)}>
          <Ionicons name="eye-outline" size={18} color={colors.primary[600]} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function OrderCardMobile({ order, index, onAdvance, onCancel, onOpen }: any) {
  const st = STATUS_STYLE[order.status] || STATUS_STYLE.PLACED;
  const user = order.user;
  const addr = order.deliveryAddress;
  const fBadge = fulfillmentBadge(order.fulfillmentType);
  const addrLine =
    order.fulfillmentType === 'PICKUP'
      ? 'Store pickup'
      : addr
        ? `${addr.addressLine}, ${addr.city}`
        : '';
  const first = order.items?.[0];
  const action = nextAction(order.status, order.fulfillmentType);
  const more = (order.items?.length || 0) - 1;

  return (
    <Animated.View entering={FadeInDown.delay(index * 45).duration(350)} style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <T style={styles.oid}>#{String(order.id).slice(-6).toUpperCase()}</T>
          <T style={styles.otime}>{new Date(order.createdAt).toLocaleString('en-NP', { dateStyle: 'medium', timeStyle: 'short' })}</T>
          {fBadge ? (
            <View style={[styles.fulfillPill, { backgroundColor: fBadge.bg, alignSelf: 'flex-start', marginTop: 6 }]}>
              <T style={[styles.fulfillPillTxt, { color: fBadge.fg }]}>{fBadge.label}</T>
            </View>
          ) : null}
        </View>
        <View style={[styles.pill, { backgroundColor: st.bg }]}>
          <T style={[styles.pillTxt, { color: st.fg }]}>{st.label}</T>
        </View>
      </View>
      <View style={styles.cardBlock}>
        <T style={styles.blockLabel}>Customer</T>
        <T style={styles.custName}>{user?.name || 'Customer'}</T>
        <T style={styles.custSub} n={3}>
          {user?.phone || ''} {addrLine ? ` · ${addrLine}` : ''}
        </T>
      </View>
      <View style={styles.cardBlock}>
        <T style={styles.blockLabel}>Items</T>
        {first ? (
          <T style={styles.itemTitle}>
            {first.productName} · Qty {first.quantity}
            {more > 0 ? ` · +${more} more` : ''}
          </T>
        ) : (
          <T style={styles.custSub}>—</T>
        )}
      </View>
      <View style={styles.cardRowAmt}>
        <T style={styles.amtBig}>{formatMoney(order.totalAmount)}</T>
      </View>
      <View style={styles.cardActions}>
        {action ? (
          <Pressable style={[styles.btnPrimary, { flex: 1 }]} onPress={() => onAdvance(order.id, action.next, order)}>
            <T style={styles.btnPrimaryTxt}>{action.label}</T>
          </Pressable>
        ) : null}
        {(order.status === 'PLACED' || order.status === 'PENDING_PAYMENT') && (
          <Pressable style={styles.btnGhost} onPress={() => onCancel(order.id)}>
            <T style={styles.btnGhostTxt}>Cancel</T>
          </Pressable>
        )}
        <Pressable style={styles.iconOnly} onPress={() => onOpen(order.id)}>
          <Ionicons name="eye-outline" size={20} color={colors.primary[600]} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function OrdersScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const router = useRouter();
  const qc = useQueryClient();
  const { isReady } = useSellerTenantReady();
  const { activeStoreId } = useSellerWorkspace();
  const [group, setGroup] = useState<OrderGroup>('ALL');
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['seller-orders', group, activeStoreId],
    queryFn: async () => {
      const res = await apiClient.get('/seller/orders', { params: { group, limit: 80, page: 1 } });
      return res.data?.data as {
        orders: any[];
        meta: { counts: Record<string, number>; total: number };
      };
    },
    enabled: isReady,
  });

  const orders = data?.orders ?? [];
  const counts = data?.meta?.counts;

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        String(o.id).toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.items?.some((it: any) => it.productName?.toLowerCase().includes(q))
    );
  }, [orders, search]);

  const handleExportCsv = async () => {
    if (!filtered.length) {
      Alert.alert('Export', 'No orders in the current view to export.');
      return;
    }
    const header = 'id,status,total,customer,phone,createdAt';
    const rows = filtered.map((o: any) => {
      const cols = [
        o.id,
        o.status,
        o.totalAmount,
        (o.user?.name ?? '').replace(/,/g, ' '),
        o.user?.phone ?? '',
        o.createdAt ?? '',
      ];
      return cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [header, ...rows].join('\n');
    try {
      await Share.share({ message: csv, title: 'orders-export.csv' });
    } catch {
      Alert.alert('Export failed', 'Could not share CSV.');
    }
  };

  const { mutate: updateStatus } = useMutation({
    mutationFn: async (payload: { orderId: string; status: string; codCollected?: boolean }) => {
      const body: { status: string; codCollected?: boolean } = { status: payload.status };
      if (payload.codCollected !== undefined) body.codCollected = payload.codCollected;
      await apiClient.put(`/seller/orders/${payload.orderId}/status`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-orders'] });
      qc.invalidateQueries({ queryKey: ['seller-stats'] });
      qc.invalidateQueries({ queryKey: ['seller-earnings-summary'] });
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Could not update order';
      Alert.alert('Update failed', message);
    },
  });

  const handleAdvance = useCallback(
    (orderId: string, next: string, order?: { paymentMethod?: string }) => {
      if (next === 'DELIVERED' && order?.paymentMethod === 'COD') {
        Alert.alert(
          'Cash on delivery',
          'Confirm the customer paid cash (or completed an online payment you recorded). This unlocks payout accounting.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Payment received',
              style: 'default',
              onPress: () => updateStatus({ orderId, status: next, codCollected: true }),
            },
          ]
        );
        return;
      }
      updateStatus({ orderId, status: next });
    },
    [updateStatus]
  );

  const handleCancel = useCallback(
    (orderId: string) => {
      Alert.alert('Cancel order', 'Cancel this order and return stock?', [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, cancel', style: 'destructive', onPress: () => updateStatus({ orderId, status: 'CANCELLED' }) },
      ]);
    },
    [updateStatus]
  );

  const tabCount = (k: OrderGroup) => {
    if (!counts) return 0;
    if (k === 'ALL') return counts.all ?? 0;
    const map: Record<OrderGroup, keyof typeof counts | undefined> = {
      ALL: 'all',
      PENDING: 'pending',
      ACCEPTED: 'accepted',
      PREPARING: 'preparing',
      PACKED: 'packed',
      OUT_FOR_DELIVERY: 'outForDelivery',
      DELIVERED: 'delivered',
      CANCELLED: 'cancelled',
    };
    const key = map[k];
    return key ? (counts as any)[key] ?? 0 : 0;
  };

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.topHeader}>
        <View style={{ flex: 1, maxWidth: isDesktop ? 420 : undefined }}>
          <T style={styles.pageTitle}>Orders</T>
          <T style={styles.pageSub}>Manage and track all your incoming orders</T>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.notifBtn}
            onPress={() => {
              const pending = tabCount('PENDING');
              setGroup('PENDING');
              Alert.alert(
                'Order alerts',
                pending > 0
                  ? `${pending} order${pending === 1 ? '' : 's'} need your attention.`
                  : 'No pending orders right now.'
              );
            }}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.neutral[700]} />
            {(tabCount('PENDING') > 0) && <View style={styles.dot} />}
          </Pressable>
          <Image
            source={{ uri: 'https://ui-avatars.com/api/?name=Seller&background=EBF5F0&color=1D5A44' }}
            style={styles.headerAvatar}
          />
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.neutral[400]} accessibilityElementsHidden />
          <TextInput
            style={[styles.searchIn, webInputFocusRing]}
            placeholder="Search orders, customers..."
            placeholderTextColor={colors.neutral[400]}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Search orders and customers"
          />
        </View>
        <Pressable style={styles.exportBtn} onPress={() => void handleExportCsv()}>
          <Ionicons name="download-outline" size={18} color="#fff" />
          <T style={styles.exportTxt}>Export</T>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
        {TABS.map((tab) => (
          <Pressable key={tab.key} onPress={() => setGroup(tab.key)} style={[styles.tabChip, group === tab.key && styles.tabChipOn]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Animated.Text style={[styles.tabChipTxt, group === tab.key && styles.tabChipTxtOn]}>
                {tab.label}
              </Animated.Text>
              <Animated.Text style={[styles.tabBadge, group === tab.key && styles.tabBadgeOn]}>
                ({tabCount(tab.key)})
              </Animated.Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={colors.primary[600]} />
      ) : isDesktop ? (
        <ScrollView
          contentContainerStyle={styles.tableWrap}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary[600]} />}
        >
          <View style={styles.tableHead}>
            <T style={[styles.th, { width: 120 }]}>Order</T>
            <T style={[styles.th, { flex: 1.2 }]}>Customer</T>
            <T style={[styles.th, { flex: 1.4 }]}>Items</T>
            <T style={[styles.th, { width: 110, textAlign: 'right' }]}>Amount</T>
            <T style={[styles.th, { width: 200, textAlign: 'right' }]}>Actions</T>
          </View>
          {filtered.map((o, i) => (
            <OrderRowDesktop
              key={o.id}
              order={o}
              index={i}
              onAdvance={handleAdvance}
              onCancel={handleCancel}
              onOpen={(id: string) => router.push(`/order/${id}` as any)}
            />
          ))}
          {!filtered.length ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color={colors.neutral[300]} />
              <T style={styles.emptyTxt}>No orders in this view</T>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100, gap: spacing.md }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary[600]} />}
        >
          {filtered.map((o, i) => (
            <OrderCardMobile
              key={o.id}
              order={o}
              index={i}
              onAdvance={handleAdvance}
              onCancel={handleCancel}
              onOpen={(id: string) => router.push(`/order/${id}` as any)}
            />
          ))}
          {!filtered.length ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color={colors.neutral[300]} />
              <T style={styles.emptyTxt}>No orders in this view</T>
            </View>
          ) : null}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <T style={styles.footerTxt}>
          Powered by GoPasal Marketplace · {data?.meta?.total ?? 0} orders loaded
        </T>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  pageTitle: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  pageSub: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500], marginTop: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface.card, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error.main,
  },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: colors.neutral[150] },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.md,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchIn: { flex: 1, fontFamily: 'Inter', fontSize: 14, color: colors.neutral[900], ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}) },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    height: 46,
    borderRadius: radius.lg,
  },
  exportTxt: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#fff' },

  tabsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  tabChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
  },
  tabChipOn: { backgroundColor: colors.primary[50], borderWidth: 1, borderColor: colors.primary[200] },
  tabChipTxt: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.neutral[600] },
  tabChipTxtOn: { color: colors.primary[800] },
  tabBadge: { fontFamily: 'Inter-SemiBold', color: colors.neutral[500] },
  tabBadgeOn: { color: colors.primary[600] },

  tableWrap: { paddingHorizontal: spacing['2xl'], paddingBottom: 120 },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[150],
    marginBottom: spacing.xs,
  },
  th: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.6 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.surface.card,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    ...Platform.select({ web: { boxShadow: '0 1px 3px rgba(15,23,42,0.06)' } as any, default: {} }),
  },
  oid: { fontFamily: 'Poppins-Bold', fontSize: 14, color: colors.neutral[900] },
  otime: { fontFamily: 'Inter', fontSize: 11, color: colors.neutral[400], marginTop: 2 },
  custName: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.neutral[900] },
  custSub: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500], marginTop: 2 },
  itemTitle: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.neutral[800] },
  amt: { fontFamily: 'Poppins-Bold', fontSize: 14, color: colors.neutral[900] },
  amtBig: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.primary[700] },
  pill: { alignSelf: 'flex-end', marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillTxt: { fontFamily: 'Inter-SemiBold', fontSize: 11 },
  fulfillPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  fulfillPillTxt: { fontFamily: 'Inter-SemiBold', fontSize: 10 },
  actions: { width: 200, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  btnPrimary: { backgroundColor: colors.primary[600], paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md },
  btnPrimaryTxt: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: '#fff' },
  btnGhost: { borderWidth: 1, borderColor: colors.neutral[200], paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.md },
  btnGhostTxt: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: colors.neutral[600] },
  iconOnly: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.neutral[50], alignItems: 'center', justifyContent: 'center' },

  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...Platform.select({ web: { boxShadow: '0 4px 20px rgba(15,23,42,0.06)' } as any, default: {} }),
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  cardBlock: { marginBottom: spacing.md },
  blockLabel: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.neutral[400], textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  cardRowAmt: { marginBottom: spacing.md },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },

  empty: { alignItems: 'center', paddingVertical: 48, gap: spacing.sm },
  emptyTxt: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.neutral[400] },

  footer: { padding: spacing.md, alignItems: 'center' },
  footerTxt: { fontFamily: 'Inter', fontSize: 11, color: colors.neutral[400] },
});
