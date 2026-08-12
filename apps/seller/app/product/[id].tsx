import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { GText } from '../../src/components/GText';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import apiClient from '../../src/services/api';
import { useSellerWorkspace } from '../../src/hooks/useSellerWorkspace';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { hasPermission } = useSellerWorkspace();
  const canManage = hasPermission('products.manage');

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['seller-product', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/seller/products/${id}`);
      return data?.data as {
        id: string;
        name: string;
        description?: string | null;
        basePrice: string | number;
        compareAtPrice?: string | number | null;
        isActive?: boolean;
        isDeliverable?: boolean;
        images?: string[] | null;
        category?: { name?: string } | null;
        variants?: Array<{
          sku?: string | null;
          name?: string;
          inventory?: { quantity?: number } | null;
        }>;
      };
    },
    enabled: !!id,
  });

  const v = product?.variants?.[0];
  const inv = v?.inventory;
  const qty = Number(inv?.quantity ?? 0);
  const imgs = Array.isArray(product?.images) ? product!.images! : [];

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[800]} />
        </Pressable>
        <GText style={styles.headerTitle} weight="bold">
          Product
        </GText>
        {canManage ? (
          <Pressable onPress={() => router.push(`/product/edit?id=${id}` as any)} style={styles.editLink}>
            <GText weight="semiBold" style={{ color: colors.primary[600], fontSize: 15 }}>
              Edit
            </GText>
          </Pressable>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : isError || !product ? (
        <View style={styles.center}>
          <GText style={{ color: colors.neutral[600] }}>Product not found.</GText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ maxHeight: width * 0.72 }}>
            {imgs.length === 0 ? (
              <View style={[styles.hero, { width }]}>
                <Ionicons name="image-outline" size={56} color={colors.neutral[300]} />
              </View>
            ) : (
              imgs.map((uri) => (
                <Image key={uri} source={{ uri }} style={[styles.hero, { width }]} resizeMode="cover" />
              ))
            )}
          </ScrollView>

          <View style={styles.pad}>
            <View style={styles.row}>
              <GText style={styles.name} weight="bold">
                {product.name}
              </GText>
              <View style={[styles.pill, product.isActive ? styles.pillOn : styles.pillOff]}>
                <GText style={styles.pillTxt}>{product.isActive ? 'Active' : 'Hidden'}</GText>
              </View>
            </View>
            {product.category?.name ? (
              <GText style={styles.cat}>{product.category.name}</GText>
            ) : null}
            <View style={{ marginTop: 4 }}>
              <GText style={styles.price} weight="bold">
                NPR {Number(product.basePrice).toLocaleString()}
              </GText>
              {product.compareAtPrice != null && String(product.compareAtPrice) !== '' ? (
                <GText style={styles.compare}>
                  Compare-at NPR {Number(product.compareAtPrice).toLocaleString()}
                </GText>
              ) : null}
            </View>
            <View style={styles.metaRow}>
              <GText style={styles.meta}>Stock: {qty}</GText>
              {v?.sku ? <GText style={styles.meta}>SKU: {v.sku}</GText> : null}
              <GText style={styles.meta}>{product.isDeliverable ? 'Deliverable' : 'Pickup only'}</GText>
            </View>
            {product.description ? (
              <View style={styles.descBox}>
                <GText weight="semiBold" style={styles.descTitle}>
                  Description
                </GText>
                <GText style={styles.desc}>{product.description}</GText>
              </View>
            ) : (
              <GText style={styles.muted}>No description on this listing yet.</GText>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backBtn: { marginRight: spacing.sm, padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, color: colors.neutral[900] },
  editLink: { paddingVertical: 4, paddingHorizontal: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { paddingBottom: spacing['3xl'] },
  hero: {
    height: 280,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pad: { padding: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  name: { flex: 1, fontSize: 22, color: colors.neutral[900] },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillOn: { backgroundColor: colors.success.light },
  pillOff: { backgroundColor: colors.neutral[200] },
  pillTxt: { fontSize: 11, fontFamily: 'Inter-SemiBold', color: colors.neutral[800] },
  cat: { fontSize: 13, color: colors.neutral[500] },
  price: { fontSize: 20, color: colors.primary[700], marginTop: 4 },
  compare: { fontSize: 14, color: colors.neutral[500], fontFamily: 'Inter' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  meta: { fontSize: 13, color: colors.neutral[600], fontFamily: 'Inter' },
  descBox: { marginTop: spacing.lg, padding: spacing.lg, backgroundColor: '#fff', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.neutral[150] },
  descTitle: { fontSize: 15, marginBottom: spacing.sm, color: colors.neutral[900] },
  desc: { fontSize: 14, color: colors.neutral[700], lineHeight: 22, fontFamily: 'Inter' },
  muted: { fontSize: 14, color: colors.neutral[400], marginTop: spacing.md, fontFamily: 'Inter' },
});
