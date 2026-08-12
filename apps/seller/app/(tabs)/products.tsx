import React, { useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  ScrollView,
  useWindowDimensions,
  Platform,
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

function T({ style, children, n }: any) {
  return <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Poppins', color: colors.neutral[900] }, style]}>{children}</Animated.Text>;
}

function ProductItem({
  product,
  onEdit,
  onDelete,
  onOpen,
  index,
  canManage,
}: {
  product: any;
  onEdit: (p: any) => void;
  onDelete: (id: string) => void;
  onOpen: (p: any) => void;
  index: number;
  canManage: boolean;
}) {
  const image = product.images?.[0] || null;
  const qty = Number(product.variants?.[0]?.inventory?.quantity ?? 0);
  const inStock = qty > 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(350)} style={styles.productItem}>
      <Pressable onPress={() => onOpen(product)} style={styles.productImg} accessibilityRole="button">
        {image ? (
          <Image source={{ uri: image }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        ) : (
          <Ionicons name="image-outline" size={28} color={colors.neutral[300]} />
        )}
      </Pressable>
      <Pressable onPress={() => onOpen(product)} style={{ flex: 1, gap: 3 }} accessibilityRole="button">
        <T style={styles.productName} n={2}>
          {product.name}
        </T>
        <T style={styles.productPrice}>NPR {product.basePrice}</T>
        <View style={styles.stockBadge}>
          <View style={[styles.stockDot, { backgroundColor: inStock ? colors.success.main : colors.error.main }]} />
          <T style={styles.stockText}>{inStock ? `In stock · ${qty}` : 'Out of stock'}</T>
        </View>
      </Pressable>
      {canManage ? (
        <View style={styles.productActions}>
          <Pressable style={styles.actionIcon} onPress={() => onEdit(product)}>
            <Ionicons name="pencil-outline" size={18} color={colors.primary[500]} />
          </Pressable>
          <Pressable style={styles.actionIcon} onPress={() => onDelete(product.id)}>
            <Ionicons name="trash-outline" size={18} color={colors.error.main} />
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function ProductsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState<string>('ALL');
  const router = useRouter();
  const qc = useQueryClient();
  const { isReady } = useSellerTenantReady();
  const { activeStoreId, hasPermission } = useSellerWorkspace();
  const canManage = hasPermission('products.manage');

  const { data = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['seller-products', activeStoreId],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/products?limit=100');
      return data?.data ?? [];
    },
    enabled: isReady,
    retry: 1,
  });

  const { mutate: deleteProduct } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/seller/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-products'] }),
  });

  const handleDelete = (id: string) => {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(id) },
    ]);
  };

  const categories = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of data) {
      const n = p.category?.name || 'Uncategorized';
      m.set(n, (m.get(n) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (cat !== 'ALL') list = list.filter((p: any) => (p.category?.name || 'Uncategorized') === cat);
    if (search.trim()) list = list.filter((p: any) => p.name?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [data, cat, search]);

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <View>
          <T style={styles.title}>Products</T>
          <T style={styles.subtitle}>Manage and organize your product listings</T>
        </View>
        {canManage ? (
          <Pressable style={styles.addBtn} onPress={() => router.push('/product/new' as any)}>
            <Ionicons name="add" size={22} color="#fff" />
            <T style={styles.addBtnText}>Add New</T>
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        <Pressable style={[styles.catChip, cat === 'ALL' && styles.catChipOn]} onPress={() => setCat('ALL')}>
          <T style={[styles.catChipTxt, cat === 'ALL' && styles.catChipTxtOn]}>All ({data.length})</T>
        </Pressable>
        {categories.map(([name, c]) => (
          <Pressable key={name} style={[styles.catChip, cat === name && styles.catChipOn]} onPress={() => setCat(name)}>
            <T style={[styles.catChipTxt, cat === name && styles.catChipTxtOn]} numberOfLines={1}>
              {name} ({c})
            </T>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={17} color={colors.neutral[400]} />
        <TextInput
          style={[styles.searchInput, webInputFocusRing]}
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.neutral[400]}
          accessibilityLabel="Search products"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={17} color={colors.neutral[400]} />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.hero.gradientStart} />
      ) : (
        <FlatList
          data={filtered}
          numColumns={isDesktop ? 2 : 1}
          key={isDesktop ? 'grid' : 'list'}
          columnWrapperStyle={isDesktop ? { gap: spacing.md } : undefined}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={isDesktop ? { flex: 1 } : undefined}>
              <ProductItem
                product={item}
                index={index}
                canManage={canManage}
                onOpen={(p: any) => router.push(`/product/${p.id}` as any)}
                onEdit={(p: any) => router.push(`/product/edit?id=${p.id}` as any)}
                onDelete={handleDelete}
              />
            </View>
          )}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.hero.gradientStart} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color={colors.neutral[300]} />
              <T style={styles.emptyText}>{search ? 'No products match' : 'No products yet'}</T>
              {!search && canManage ? (
                <Pressable style={styles.addFirstBtn} onPress={() => router.push('/product/new' as any)}>
                  <T style={styles.addFirstText}>Add your first product</T>
                </Pressable>
              ) : null}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  subtitle: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500], marginTop: 4 },
  catRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  catChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    maxWidth: 200,
  },
  catChipOn: { backgroundColor: colors.primary[50], borderWidth: 1, borderColor: colors.primary[200] },
  catChipTxt: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.neutral[600] },
  catChipTxtOn: { color: colors.primary[800], fontFamily: 'Inter-SemiBold' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primary[500], paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill },
  addBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: '#fff' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.surface.card, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 46, borderWidth: 1, borderColor: colors.neutral[150] },
  searchInput: { flex: 1, fontFamily: 'Inter', fontSize: 14, color: colors.neutral[900] },
  productItem: {
    flexDirection: 'row', backgroundColor: colors.surface.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transitionProperty: 'transform, box-shadow',
        transitionDuration: '200ms',
        transitionTimingFunction: 'ease-out',
      } as any,
    }),
  },
  productImg: { width: 70, height: 70, borderRadius: radius.md, backgroundColor: colors.surface.tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  productName: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.neutral[900] },
  productPrice: { fontFamily: 'Poppins-Bold', fontSize: 14, color: colors.primary[500] },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stockDot: { width: 7, height: 7, borderRadius: 4 },
  stockText: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500] },
  productActions: { gap: spacing.sm },
  actionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[400] },
  addFirstBtn: { backgroundColor: colors.primary[500], paddingHorizontal: spacing['2xl'], paddingVertical: spacing.md, borderRadius: radius.pill },
  addFirstText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#fff' },
});
