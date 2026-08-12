import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../src/design-system/primitives/GText';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import { ProductCard } from '../src/components/ProductCard';
import { EmptyState } from '../src/components/StateViews';
import { useWishlist, useToggleWishlist, useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '../src/services/hooks';
import { useTranslation } from '../src/i18n';
import { WebPageShell } from '../src/components/WebPageShell';

import { useUIStore } from '../src/store/ui.store';

export default function WishlistScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: wishlist, isLoading } = useWishlist();
  const toggleWishlist = useToggleWishlist();

  const addToCart = useAddToCart();
  const { data: cart } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const showCartToast = useUIStore((s) => s.showCartToast);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <WebPageShell>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/' as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText variant="h2" color={colors.neutral[900]}>{t('wishlist.title')}</GText>
        <View style={{ width: 40 }} />
      </View>

      {!isLoading && (!wishlist || wishlist.length === 0) ? (
        <EmptyState
          icon="heart-outline"
          title={t('wishlist.empty')}
          message={t('wishlist.emptyMsg')}
          actionLabel={t('common.browseProducts')}
          onAction={() => router.push('/(tabs)')}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {wishlist?.map((item: any, i: number) => {
            const cartItem = getCartItem(item.product);
            return (
              <View key={item.id} style={styles.wishRow}>
                <ProductCard
                  name={item.product?.name || 'Product'}
                  price={Number(item.product?.basePrice ?? item.product?.price ?? 0)}
                  imageUrl={item.product?.images?.[0] || 'https://img.icons8.com/color/256/shopping-bag.png'}
                  unit=""
                  cartQuantity={cartItem?.quantity || 0}
                  onAdd={() => handleAddToCart(item.product)}
                  onIncrement={() => handleIncrement(item.product)}
                  onDecrement={() => handleDecrement(item.product)}
                  onPress={() => router.push(`/product/${item.productId}` as any)}
                  onRemoveAction={() => toggleWishlist.mutate(item.productId)}
                  removeIcon="heart-dislike-outline"
                />
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      </WebPageShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  wishRow: {
    width: '48%',
    ...(Platform.OS === 'web' && { width: '23%' as any, minWidth: 160 }),
    alignItems: 'center',
  },
});
