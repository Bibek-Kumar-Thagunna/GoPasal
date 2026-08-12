import React, { useMemo, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import { webInputFocusRing } from '@gopasal/ui';
import apiClient from '../../src/services/api';
import { useSellerWorkspace } from '../../src/hooks/useSellerWorkspace';
import { useSellerTenantReady } from '../../src/hooks/useSellerTenantReady';

type StockTab = 'ALL' | 'LOW' | 'IN' | 'OUT';

function T({ style, children, n }: { style?: any; children: React.ReactNode; n?: number }) {
  return (
    <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

function stockState(qty: number, threshold: number): { label: string; tone: 'ok' | 'low' | 'out' } {
  if (qty <= 0) return { label: 'Out of stock', tone: 'out' };
  if (qty <= threshold) return { label: 'Low stock', tone: 'low' };
  return { label: 'In stock', tone: 'ok' };
}

export default function InventoryScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const qc = useQueryClient();
  const { isReady } = useSellerTenantReady();
  const { activeStoreId } = useSellerWorkspace();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<StockTab>('ALL');

  const { data: products = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['seller-products', activeStoreId],
    queryFn: async () => (await apiClient.get('/seller/products?limit=200')).data?.data ?? [],
    enabled: isReady,
  });

  const rows = useMemo(() => {
    return products.map((p: any) => {
      const v = p.variants?.[0];
      const inv = v?.inventory;
      const qty = Number(inv?.quantity ?? 0);
      const threshold = Number(inv?.lowStockThreshold ?? 5);
      return {
        id: p.id,
        name: p.name,
        sku: v?.sku || p.slug || '—',
        qty,
        threshold,
        image: p.images?.[0],
        category: p.category?.name || 'Uncategorized',
        state: stockState(qty, threshold),
      };
    });
  }, [products]);

  const filtered = useMemo(() => {
    let r = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(q) || x.sku.toLowerCase().includes(q));
    }
    if (tab === 'LOW') r = r.filter((x) => x.state.tone === 'low');
    if (tab === 'OUT') r = r.filter((x) => x.state.tone === 'out');
    if (tab === 'IN') r = r.filter((x) => x.state.tone === 'ok');
    return r;
  }, [rows, search, tab]);

  const counts = useMemo(() => {
    return {
      all: rows.length,
      low: rows.filter((x) => x.state.tone === 'low').length,
      out: rows.filter((x) => x.state.tone === 'out').length,
      inn: rows.filter((x) => x.state.tone === 'ok').length,
    };
  }, [rows]);

  const { mutate: setQty, isPending } = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      await apiClient.patch(`/seller/products/${id}/inventory`, { quantity });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-products'] });
      qc.invalidateQueries({ queryKey: ['seller-stats'] });
    },
  });

  const renderRow = ({ item, index }: { item: (typeof rows)[0]; index: number }) => {
    const tone =
      item.state.tone === 'out'
        ? { bg: colors.error.light, fg: colors.error.dark }
        : item.state.tone === 'low'
          ? { bg: colors.warning.light, fg: colors.warning.dark }
          : { bg: colors.success.light, fg: colors.success.dark };

    if (!isDesktop) {
      return (
        <Animated.View entering={FadeInDown.delay(index * 40).duration(320)} style={styles.card}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={styles.thumb}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
              ) : (
                <Ionicons name="image-outline" size={24} color={colors.neutral[300]} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <T style={styles.pname} n={2}>
                {item.name}
              </T>
              <T style={styles.psub}>
                {item.category} · SKU {item.sku}
              </T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm }}>
                <T style={styles.qtyBig}>{item.qty}</T>
                <View style={[styles.pill, { backgroundColor: tone.bg }]}>
                  <T style={[styles.pillTxt, { color: tone.fg }]}>{item.state.label}</T>
                </View>
              </View>
              <Pressable
                style={styles.restock}
                disabled={isPending}
                onPress={() => {
                  const next = item.qty + 10;
                  setQty({ id: item.id, quantity: next });
                }}
              >
                <Ionicons name="arrow-up-circle-outline" size={18} color="#fff" />
                <T style={styles.restockTxt}>Restock +10</T>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      );
    }

    return (
      <Animated.View entering={FadeInDown.delay(index * 30).duration(280)} style={styles.tableRow}>
        <View style={{ flex: 1.4, flexDirection: 'row', gap: spacing.md }}>
          <View style={styles.thumbSm}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            ) : (
              <Ionicons name="image-outline" size={18} color={colors.neutral[300]} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <T style={styles.pname} n={1}>
              {item.name}
            </T>
            <T style={styles.psub} n={1}>
              {item.category}
            </T>
          </View>
        </View>
        <T style={[styles.cell, { width: 80, textAlign: 'center' }]}>{item.qty}</T>
        <View style={{ width: 120, alignItems: 'center' }}>
          <View style={[styles.pill, { backgroundColor: tone.bg }]}>
            <T style={[styles.pillTxt, { color: tone.fg }]}>{item.state.label}</T>
          </View>
        </View>
        <View style={{ width: 100, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
          <Pressable
            style={styles.qtyAdj}
            disabled={isPending || item.qty <= 0}
            onPress={() => setQty({ id: item.id, quantity: Math.max(0, item.qty - 1) })}
          >
            <Ionicons name="remove" size={18} color={colors.neutral[700]} />
          </Pressable>
          <Pressable style={styles.qtyAdj} disabled={isPending} onPress={() => setQty({ id: item.id, quantity: item.qty + 10 })}>
            <Ionicons name="add" size={18} color={colors.neutral[700]} />
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <View>
          <T style={styles.title}>Inventory</T>
          <T style={styles.sub}>Track, manage, and restock your product inventory</T>
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={colors.neutral[400]} />
          <TextInput
            style={[styles.searchIn, webInputFocusRing]}
            placeholder="Search products..."
            placeholderTextColor={colors.neutral[400]}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Search inventory products"
          />
        </View>
      </View>

      <View style={styles.tabs}>
        {(
          [
            ['ALL', 'All', counts.all],
            ['LOW', 'Low stock', counts.low],
            ['IN', 'In stock', counts.inn],
            ['OUT', 'Out of stock', counts.out],
          ] as const
        ).map(([k, lab, c]) => (
          <Pressable key={k} style={[styles.tab, tab === k && styles.tabOn]} onPress={() => setTab(k)}>
            <T style={[styles.tabTxt, tab === k && styles.tabTxtOn]}>
              {lab} ({c})
            </T>
          </Pressable>
        ))}
      </View>

      {isDesktop ? (
        <View style={styles.tableHead}>
          <T style={[styles.th, { flex: 1.4 }]}>Product</T>
          <T style={[styles.th, { width: 80, textAlign: 'center' }]}>Qty</T>
          <T style={[styles.th, { width: 120, textAlign: 'center' }]}>Status</T>
          <T style={[styles.th, { width: 100, textAlign: 'right' }]}>Actions</T>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary[600]} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderRow}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120, gap: isDesktop ? 0 : spacing.md }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary[600]} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="layers-outline" size={40} color={colors.neutral[300]} />
              <T style={styles.emptyTxt}>No products match this filter</T>
            </View>
          }
        />
      )}

      <View style={styles.footer}>
        <T style={styles.footerTxt}>Powered by GoPasal Marketplace</T>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: { paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg },
  title: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  sub: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500], marginTop: 4 },
  toolbar: { paddingHorizontal: spacing['2xl'], marginTop: spacing.md },
  searchWrap: {
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

  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.neutral[100] },
  tabOn: { backgroundColor: colors.primary[50], borderWidth: 1, borderColor: colors.primary[200] },
  tabTxt: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.neutral[600] },
  tabTxtOn: { color: colors.primary[800], fontFamily: 'Inter-SemiBold' },

  tableHead: { flexDirection: 'row', paddingHorizontal: spacing['2xl'], paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.neutral[150] },
  th: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.neutral[500], textTransform: 'uppercase', letterSpacing: 0.6 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing['2xl'],
    borderBottomWidth: 1,
    borderColor: colors.neutral[100],
    backgroundColor: colors.surface.card,
  },

  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.neutral[100], overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  thumbSm: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.neutral[100], overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  pname: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.neutral[900] },
  psub: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500], marginTop: 2 },
  qtyBig: { fontFamily: 'Poppins-Bold', fontSize: 22, color: colors.neutral[900] },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillTxt: { fontFamily: 'Inter-Bold', fontSize: 10, textTransform: 'uppercase' },
  restock: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  restockTxt: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#fff' },
  qtyAdj: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.neutral[800] },

  empty: { alignItems: 'center', paddingTop: 48, gap: spacing.sm },
  emptyTxt: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[400] },
  footer: { padding: spacing.md, alignItems: 'center' },
  footerTxt: { fontFamily: 'Inter', fontSize: 11, color: colors.neutral[400] },
});
