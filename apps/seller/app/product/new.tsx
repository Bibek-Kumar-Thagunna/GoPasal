import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

type Category = { id: string; name: string; slug?: string };

export default function NewProductScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { hasPermission } = useSellerWorkspace();
  const canManage = hasPermission('products.manage');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [basePrice, setBasePrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('0');
  const [images, setImages] = useState<string[]>([]);
  const [isDeliverable, setIsDeliverable] = useState(true);

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/categories');
      return (data?.data ?? []) as Category[];
    },
    enabled: canManage,
  });

  const sortedCats = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories]
  );

  const { mutate: createProduct, isPending } = useMutation({
    mutationFn: async () => {
      const price = Number.parseFloat(basePrice);
      const stockN = Number.parseInt(stock, 10);
      if (!categoryId) throw new Error('Choose a category');
      if (!name.trim() || name.trim().length < 3) throw new Error('Name must be at least 3 characters');
      if (!Number.isFinite(price) || price < 0) throw new Error('Enter a valid selling price');
      if (!Number.isFinite(stockN) || stockN < 0) throw new Error('Enter a valid stock quantity');
      if (description.length > DESC_MAX) throw new Error(`Description must be under ${DESC_MAX} characters`);
      const cmp = compareAtPrice.trim() === '' ? undefined : Number.parseFloat(compareAtPrice);
      if (cmp !== undefined && (!Number.isFinite(cmp) || cmp < 0)) {
        throw new Error('Compare-at price must be a valid number');
      }
      await apiClient.post('/seller/products', {
        categoryId,
        name: name.trim(),
        description: description.trim() || undefined,
        basePrice: price,
        compareAtPrice: cmp,
        isDeliverable,
        sku: sku.trim() || undefined,
        stock: stockN,
        images: images.length ? images : undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-products'] });
      qc.invalidateQueries({ queryKey: ['seller-stats'] });
      Alert.alert('Product created', 'Your listing is live for this branch.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err: unknown) => {
      const msg = isAxiosError(err)
        ? String((err.response?.data as { error?: { message?: string }; message?: string })?.error?.message ||
            (err.response?.data as { message?: string })?.message ||
            err.message)
        : err instanceof Error
          ? err.message
          : 'Failed to create product';
      Alert.alert('Could not create product', msg);
    },
  });

  const handleSave = () => {
    createProduct();
  };

  if (!canManage) {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.neutral[800]} />
          </Pressable>
          <T style={styles.title}>New product</T>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.blocked}>
          <Ionicons name="lock-closed-outline" size={40} color={colors.neutral[400]} />
          <T style={styles.blockedTitle}>No permission</T>
          <T style={styles.blockedSub}>Your role cannot create products. Ask the store owner to update staff access.</T>
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
          <T style={styles.title}>New product</T>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(40)}>
            <ProductImageGallery images={images} onChange={setImages} maxImages={8} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80)} style={styles.card}>
            <T style={styles.sectionTitle}>Category *</T>
            {catLoading ? (
              <ActivityIndicator color={colors.primary[600]} />
            ) : sortedCats.length === 0 ? (
              <T style={styles.warn}>No categories available. Run platform seed or ask support.</T>
            ) : (
              <View style={styles.catWrap}>
                {sortedCats.map((c) => {
                  const on = categoryId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCategoryId(c.id)}
                      style={[styles.catChip, on && styles.catChipOn]}
                    >
                      <T style={[styles.catChipTxt, on && styles.catChipTxtOn]}>{c.name}</T>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120)} style={styles.card}>
            <T style={styles.sectionTitle}>Listing copy</T>
            <View style={styles.inputGroup}>
              <T style={styles.label}>Product name *</T>
              <TextInput
                style={styles.input}
                placeholder="e.g. Basmati Rice 5kg"
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.neutral[400]}
              />
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
                placeholder="Ingredients, size, warranty, what makes it a good buy…"
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, DESC_MAX))}
                multiline
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(160)} style={styles.card}>
            <T style={styles.sectionTitle}>Pricing & stock</T>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <T style={styles.label}>Selling price (NPR) *</T>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  value={basePrice}
                  onChangeText={setBasePrice}
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <T style={styles.label}>Compare-at / MRP (optional)</T>
                <TextInput
                  style={styles.input}
                  placeholder="Higher “was” price"
                  keyboardType="decimal-pad"
                  value={compareAtPrice}
                  onChangeText={setCompareAtPrice}
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <T style={styles.label}>Opening stock *</T>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  keyboardType="number-pad"
                  value={stock}
                  onChangeText={setStock}
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <T style={styles.label}>SKU (optional)</T>
                <TextInput
                  style={styles.input}
                  placeholder="Shelf / barcode ref"
                  value={sku}
                  onChangeText={setSku}
                  placeholderTextColor={colors.neutral[400]}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <T style={styles.sectionTitle}>Delivery</T>
                <T style={styles.switchSub}>Turn off if this item is pickup-only at your counter.</T>
              </View>
              <Switch
                value={isDeliverable}
                onValueChange={setIsDeliverable}
                trackColor={{ false: colors.neutral[300], true: colors.primary[500] }}
                thumbColor="#fff"
              />
            </View>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[styles.saveBtn, (isPending || !categoryId) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isPending || !categoryId || sortedCats.length === 0}
          >
            {isPending ? <ActivityIndicator color="#fff" /> : <T style={styles.saveBtnText}>Publish product</T>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[150],
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: 20,
  },
  title: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[900] },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  card: {
    backgroundColor: '#fff',
    padding: spacing.xl,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[900], marginBottom: spacing.md },
  inputGroup: { marginBottom: spacing.md },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.neutral[600] },
  count: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[400] },
  input: {
    backgroundColor: colors.surface.background,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[900],
  },
  textArea: { height: 120, textAlignVertical: 'top', paddingTop: spacing.md },
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
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  switchSub: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500], marginTop: 4 },
  footer: { padding: spacing.lg, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.neutral[150] },
  saveBtn: {
    backgroundColor: colors.hero.gradientStart,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#fff' },
  blocked: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['2xl'], gap: spacing.sm },
  blockedTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18 },
  blockedSub: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500], textAlign: 'center' },
  warn: { fontFamily: 'Inter', fontSize: 13, color: colors.warning.dark },
});
