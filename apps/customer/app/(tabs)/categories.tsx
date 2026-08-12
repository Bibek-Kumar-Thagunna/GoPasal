import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../../src/design-system/primitives/GText';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing } from '../../src/design-system/tokens/spacing';
import { SearchBar } from '../../src/components/SearchBar';
import { CategoryChip } from '../../src/components/CategoryChip';
import { ProductCard } from '../../src/components/ProductCard';
import { SkeletonList, EmptyState } from '../../src/components/StateViews';
import { useStoreCategories, useProducts, useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '../../src/services/hooks';
import { useLocationStore } from '../../src/store/location.store';
import { useUIStore } from '../../src/store/ui.store';
import { useTranslation } from '../../src/i18n';
import { getProductImageUrl } from '../../src/utils/product-image';
import { WEB_PAGE_MAX_WIDTH_WIDE } from '../../src/utils/web-layout';

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ selected?: string }>();
  const [selectedCat, setSelectedCat] = useState<string | null>(params.selected || null);
  const addToCart = useAddToCart();
  const { t } = useTranslation();
  const showCartToast = useUIStore((s) => s.showCartToast);

  const customerLocation = useLocationStore((s) => s.location);
  const geoParams =
    customerLocation?.latitude != null && customerLocation?.longitude != null
      ? { lat: customerLocation.latitude, lon: customerLocation.longitude }
      : {};

  const { data: categories } = useStoreCategories();
  const { data: productsData, isLoading: productsLoading } = useProducts(
    selectedCat ? { storeCategoryId: selectedCat, ...geoParams } : { ...geoParams }
  );
  const products = productsData?.data || [];

  const { data: cart } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  const getCartItem = (product: any) => {
    const variantId = product.variants?.[0]?.id || product.defaultVariantId || product.id;
    return cart?.items?.find((i: any) => i.productId === variantId || i.variantId === variantId);
  };

  const handleAddToCart = (product: any) => {
    const vid = product.variants?.[0]?.id || (product as any).defaultVariantId || product.id;
    addToCart.mutate({ variantId: vid, quantity: 1 }, {
      onSuccess: () => showCartToast()
    });
  };

  const handleIncrement = (product: any) => {
    const item = getCartItem(product);
    if (item) {
      updateCartItem.mutate({ id: item.id, quantity: item.quantity + 1 });
    } else {
      handleAddToCart(product);
    }
  };

  const handleDecrement = (product: any) => {
    const item = getCartItem(product);
    if (item) {
      if (item.quantity > 1) {
        updateCartItem.mutate({ id: item.id, quantity: item.quantity - 1 });
      } else {
        removeCartItem.mutate(item.id);
      }
    }
  };

  const categoryChips = (
    <>
      <CategoryChip
        category={{ id: 'all', name: t('categories.all'), slug: 'all' }}
        selected={!selectedCat}
        onPress={() => setSelectedCat(null)}
      />
      {categories?.map((cat, i) => (
        <CategoryChip
          key={cat.id}
          category={cat}
          selected={selectedCat === cat.id}
          onPress={() => setSelectedCat(cat.id)}
          index={i + 1}
        />
      ))}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {Platform.OS !== 'web' && (
        <>
          <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
            </Pressable>
            <GText variant="h2" color={colors.neutral[900]}>
              {t('categories.title')}
            </GText>
            <View style={{ width: 40 }} />
          </Animated.View>

          <View style={styles.searchWrap}>
            <SearchBar editable={false} onPress={() => router.push('/search')} />
          </View>
        </>
      )}

      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Chips + products share one centered column so they align */}
        <View style={styles.contentColumn}>
          {Platform.OS === 'web' ? (
            <View style={styles.chipRow}>{categoryChips}</View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipScroll}
            >
              {categoryChips}
            </ScrollView>
          )}

          <View style={styles.productsSection}>
            {productsLoading ? (
              <SkeletonList count={6} />
            ) : products.length === 0 ? (
              <EmptyState
                icon="cube-outline"
                title={t('categories.noProducts')}
                message={t('categories.noProductsMsg')}
              />
            ) : (
              <View style={styles.grid}>
                {products.map((product: any, i: number) => {
                  const cartItem = getCartItem(product);
                  return (
                    <ProductCard
                      key={product.id}
                      name={product.name || 'Product'}
                      price={product.basePrice || 0}
                      imageUrl={getProductImageUrl(product, i)}
                      unit=""
                      cartQuantity={cartItem?.quantity || 0}
                      onAdd={() => handleAddToCart(product)}
                      onIncrement={() => handleIncrement(product)}
                      onDecrement={() => handleDecrement(product)}
                      onPress={() => router.push(`/product/${product.id}` as any)}
                      style={styles.productCardCustom}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  pageScroll: {
    flex: 1,
  },
  pageContent: {
    paddingBottom: 120,
    ...(Platform.OS === 'web'
      ? {
          alignItems: 'center',
          paddingTop: spacing.xl,
        }
      : null),
  },
  contentColumn: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? WEB_PAGE_MAX_WIDTH_WIDE : undefined,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: spacing.sm,
    rowGap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  chipScroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
    marginBottom: spacing.md,
  },
  productsSection: {
    paddingHorizontal: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
    gap: spacing.sm,
  },
  productCardCustom: {
    width: '48%',
    ...(Platform.OS === 'web' && { width: '23%' as any, minWidth: 160 }),
  },
});
