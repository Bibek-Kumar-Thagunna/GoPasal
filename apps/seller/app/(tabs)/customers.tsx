import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
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

type CustomerRow = {
  userId: string | null;
  orderCount: number;
  spent: number;
  lastOrderAt: string | null;
  user: { id: string; name: string | null; phone: string | null; email: string | null } | null;
};

function formatMoney(n: number) {
  return `NPR ${n.toLocaleString('en-NP', { maximumFractionDigits: 0 })}`;
}

export default function CustomersScreen() {
  const { isReady } = useSellerTenantReady();
  const { activeStoreId } = useSellerWorkspace();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['seller-customers', activeStoreId],
    queryFn: async () => {
      const { data: body } = await apiClient.get('/seller/customers');
      return (body?.data ?? []) as CustomerRow[];
    },
    enabled: isReady,
  });

  const rows = data ?? [];

  const handleCall = useCallback((phone: string | null | undefined) => {
    if (!phone) return;
    const cleaned = phone.replace(/\s/g, '');
    void Linking.openURL(`tel:${cleaned}`);
  }, []);

  const renderItem = ({ item, index }: { item: CustomerRow; index: number }) => {
    const name = item.user?.name || item.user?.phone || 'Guest checkout';
    const sub = item.user?.email || item.user?.phone || item.userId || '—';
    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 12) * 40)} style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={colors.primary[600]} />
        </View>
        <View style={{ flex: 1 }}>
          <T style={styles.name}>{name}</T>
          <T style={styles.sub} n={1}>
            {sub}
          </T>
          <View style={styles.metaRow}>
            <T style={styles.meta}>{item.orderCount} orders</T>
            <T style={styles.meta}>·</T>
            <T style={styles.metaStrong}>{formatMoney(item.spent)}</T>
          </View>
          {item.lastOrderAt ? (
            <T style={styles.date}>Last order: {String(item.lastOrderAt).slice(0, 10)}</T>
          ) : null}
        </View>
        {item.user?.phone ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => handleCall(item.user?.phone)}
            style={styles.callBtn}
          >
            <Ionicons name="call-outline" size={20} color={colors.primary[600]} />
          </Pressable>
        ) : null}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <T style={styles.title}>Customers</T>
        <T style={styles.hint}>People who ordered from this store (from order history).</T>
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <T style={styles.err}>Could not load customers.</T>
          <Pressable onPress={() => void refetch()} style={styles.retry}>
            <T style={styles.retryTxt}>Retry</T>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, i) => item.userId || `anon-${i}`}
          renderItem={renderItem}
          contentContainerStyle={rows.length === 0 ? styles.emptyList : styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.neutral[300]} />
              <T style={styles.emptyTitle}>No customers yet</T>
              <T style={styles.emptySub}>When orders come in, repeat buyers will show up here.</T>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: { paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  hint: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500], marginTop: 4 },
  list: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.sm },
  emptyList: { flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[900] },
  sub: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500], marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  meta: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500] },
  metaStrong: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: colors.neutral[800] },
  date: { fontFamily: 'Inter', fontSize: 11, color: colors.neutral[400], marginTop: 4 },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  err: { fontFamily: 'Inter', color: colors.error.main, marginBottom: spacing.sm },
  retry: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.primary[600] },
  retryTxt: { fontFamily: 'Poppins-SemiBold', color: '#fff', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'], gap: spacing.sm },
  emptyTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18, color: colors.neutral[700] },
  emptySub: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500], textAlign: 'center' },
});
