import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import apiClient from '../../src/services/api';
import { ProductImageGallery } from '../../src/components/ui/ProductImageGallery';
import { useSellerWorkspace } from '../../src/hooks/useSellerWorkspace';

const DESC_MAX = 4000;

function T({ style, children }: { style?: object; children: React.ReactNode }) {
  return <Animated.Text style={[{ fontFamily: 'Poppins', color: colors.neutral[900] }, style]}>{children}</Animated.Text>;
}

type Category = { id: string; name: string };

type ProductPayload = {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  basePrice: string | number;
  compareAtPrice?: string | number | null;
  isDeliverable?: boolean;
  isActive?: boolean;
  images?: string[] | null;
  variants?: Array<{
    sku?: string | null;
    inventory?: { quantity?: number; lowStockThreshold?: number | null } | null;
  }>;
};

export default function ProductEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const { hasPermission } = useSellerWorkspace();
  const canManage = hasPermission('products.manage');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isDeliverable, setIsDeliverable] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const { data: categories = [] } = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/categories');
      return (data?.data ?? []) as Category[];
    },
    enabled: !!id && canManage,
  });

  const sortedCats = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const productQuery = useQuery({
    queryKey: ['seller-product', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/seller/products/${id}`);
      return data?.data as ProductPayload;
    },
    enabled: !!id && canManage,
  });

  useEffect(() => {
    const p = productQuery.data;
    if (!p) return;
    const v = p.variants?.[0];
    const inv = v?.inventory;
    const qty = Number(inv?.quantity ?? 0);
    setName(p.name || '');
    setDescription(String(p.description ?? ''));
    setCategoryId(p.categoryId || null);
    setBasePrice(String(p.basePrice ?? ''));
    setCompareAtPrice(p.compareAtPrice != null && p.compareAtPrice !== '' ? String(p.compareAtPrice) : '');
    setSku(String(v?.sku ?? ''));
    setStock(String(qty));
    setImages(Array.isArray(p.images) ? [...p.images] : []);
    setIsDeliverable(p.isDeliverable ?? true);
    setIsActive(p.isActive ?? true);
  }, [productQuery.data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const price = Number.parseFloat(basePrice);
      const stockN = Number.parseInt(stock, 10);
      if (!categoryId) throw new Error('Choose a category');
      if (!name.trim() || name.trim().length < 3) throw new Error('Name must be at least 3 characters');
      if (!Number.isFinite(price) || price < 0) throw new Error('Enter a valid selling price');
      if (!Number.isFinite(stockN) || stockN < 0) throw new Error('Enter a valid stock quantity');
      if (description.length > DESC_MAX) throw new Error(`Description must be under ${DESC_MAX} characters`);
      const cmpRaw = compareAtPrice.trim();
      const cmpParsed = cmpRaw === '' ? null : Number.parseFloat(cmpRaw);
      if (cmpParsed !== null && (!Number.isFinite(cmpParsed) || cmpParsed < 0)) {
        throw new Error('Compare-at price must be valid');
      }
      await apiClient.put(`/seller/products/${id}`, {
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId,
        basePrice: price,
        compareAtPrice: cmpParsed,
        isDeliverable,
        isActive,
        images,
        sku: sku.trim() || undefined,
      });
      await apiClient.patch(`/seller/products/${id}/inventory`, { quantity: stockN });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['seller-products'] });
      await qc.invalidateQueries({ queryKey: ['seller-stats'] });
      await qc.invalidateQueries({ queryKey: ['seller-product', id] });
      Alert.alert('Saved', 'Product updated.', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (err: unknown) => {
      const msg = isAxiosError(err)
        ? String(
            (err.response?.data as { error?: { message?: string } })?.error?.message ||
              (err.response?.data as { message?: string })?.message ||
              err.message
          )
        : err instanceof Error
          ? err.message
          : 'Update failed';
      Alert.alert('Could not save', msg);
    },
  });

  if (!canManage) {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[800]} />
          </Pressable>
          <T style={styles.headerTitle}>Edit product</T>
        </View>
        <View style={styles.blocked}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.neutral[400]} />
          <T style={styles.blockedTitle}>No permission</T>
          <T style={styles.blockedSub}>Your role cannot edit products.</T>
        </View>
      </SafeAreaView>
    );
  }

  if (productQuery.isLoading || !productQuery.data) {
    return (
      <SafeAreaView style={[styles.page, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  if (productQuery.isError) {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[800]} />
          </Pressable>
          <T style={styles.headerTitle}>Edit product</T>
        </View>
        <View style={styles.blocked}>
          <T style={styles.blockedSub}>Could not load this product.</T>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[800]} />
          </Pressable>
          <T style={styles.headerTitle}>Edit product</T>
          <Pressable onPress={() => router.push(`/product/${id}` as any)} accessibilityLabel="Preview">
            <Ionicons name="eye-outline" size={22} color={colors.primary[600]} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(40)}>
            <ProductImageGallery images={images} onChange={setImages} maxImages={8} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60)} style={styles.card}>
            <View style={styles.switchRow}>
              <T style={styles.sectionTitle}>Status</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T style={styles.mini}>{isActive ? 'Active' : 'Hidden'}</T>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ true: colors.success.main, false: colors.neutral[300] }}
                  thumbColor="#fff"
                />
              </View>
            </View>
            <T style={styles.hint}>Hidden products stay out of the storefront until you turn them back on.</T>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80)} style={styles.card}>
            <T style={styles.sectionTitle}>Category *</T>
            <View style={styles.catWrap}>
              {sortedCats.map((c) => {
                const on = categoryId === c.id;
                return (
                  <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.catChip, on && styles.catChipOn]}>
                    <T style={[styles.catChipTxt, on && styles.catChipTxtOn]}>{c.name}</T>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
            <T style={styles.sectionTitle}>Listing copy</T>
            <View style={styles.inputGroup}>
              <T style={styles.label}>Product name *</T>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <T style={styles.label}>Description</T>
                <T style={styles.count}>
                  {description.length}/{DESC_MAX}
                </T>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, DESC_MAX))}
                multiline
                placeholder="Details customers should know"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120)} style={styles.card}>
            <T style={styles.sectionTitle}>Pricing & stock</T>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <T style={styles.label}>Selling price (NPR) *</T>
                <TextInput style={styles.input} keyboardType="decimal-pad" value={basePrice} onChangeText={setBasePrice} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <T style={styles.label}>Compare-at / MRP</T>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={compareAtPrice}
                  onChangeText={setCompareAtPrice}
                  placeholder="Optional"
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <T style={styles.label}>Stock *</T>
                <TextInput style={styles.input} keyboardType="number-pad" value={stock} onChangeText={setStock} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <T style={styles.label}>SKU</T>
                <TextInput style={styles.input} value={sku} onChangeText={setSku} placeholder="Optional" />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(140)} style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <T style={styles.sectionTitle}>Deliverable</T>
                <T style={styles.hint}>Off = pickup only at your store.</T>
              </View>
              <Switch
                value={isDeliverable}
                onValueChange={setIsDeliverable}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor="#fff"
              />
            </View>
          </Animated.View>

          <Pressable
            style={[styles.saveBtn, saveMut.isPending && { opacity: 0.7 }]}
            onPress={() => saveMut.mutate()}
            disabled={saveMut.isPending}
          >
            {saveMut.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <T style={styles.saveText}>Save changes</T>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    gap: spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[900] },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[900] },
  hint: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500], marginTop: 6 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mini: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.neutral[600] },
  inputGroup: { marginBottom: spacing.lg },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.neutral[600] },
  count: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[400] },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: '#FAFAFA',
    fontFamily: 'Inter',
    fontSize: 15,
    color: colors.neutral[900],
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.md },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  catChipOn: { backgroundColor: colors.primary[50], borderColor: colors.primary[300] },
  catChipTxt: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.neutral[700] },
  catChipTxtOn: { color: colors.primary[800], fontFamily: 'Inter-SemiBold' },
  saveBtn: {
    backgroundColor: colors.primary[600],
    padding: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#fff' },
  blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'], gap: spacing.sm },
  blockedTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18 },
  blockedSub: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500], textAlign: 'center' },
});
