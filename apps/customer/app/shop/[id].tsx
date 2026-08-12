import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform, Image, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../../src/design-system/primitives/GText';
import { Card } from '../../src/design-system/primitives/Card';
import { WebHeader } from '../../src/components/WebHeader';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import { SectionHeader } from '../../src/components/SectionHeader';
import { ProductCard } from '../../src/components/ProductCard';
import { SkeletonList, EmptyState } from '../../src/components/StateViews';
import { useStore, useProducts, useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '../../src/services/hooks';
import { useLocationStore } from '../../src/store/location.store';
import { useUIStore } from '../../src/store/ui.store';
import { useTranslation } from '../../src/i18n';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const showCartToast = useUIStore((s) => s.showCartToast);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const customerLocation = useLocationStore((s) => s.location);
  const addToCart = useAddToCart();
  const { data: store, isLoading: storeLoading } = useStore(
    id,
    customerLocation?.latitude,
    customerLocation?.longitude
  );
  const notDeliverable =
    store?.serviceability != null && store.serviceability.deliverable === false;
  const { data: productsData, isLoading: productsLoading } = useProducts({ storeId: id, q: debouncedQuery });
  const products = productsData?.data || (Array.isArray(productsData) ? productsData : []);

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

  const storeImage = store?.coverImage || store?.logo ||
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80';

  const getProductImage = (product: any) => {
    if (product.images?.[0]) return product.images[0];
    if (product.image) return product.image;
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {Platform.OS === 'web' && <WebHeader />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header with back */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
          </Pressable>
          <GText variant="h3" color={colors.neutral[900]} numberOfLines={1} style={{ flex: 1 }}>
            {store?.name || t('shop.shop')}
          </GText>
          <View style={{ width: 40 }} />
        </View>

        {/* Cover Image */}
        {store && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Image
              source={{ uri: storeImage }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          </Animated.View>
        )}

        {/* Shop info card */}
        {store && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Card variant="elevated" style={styles.shopInfo}>
              <View style={styles.shopHeader}>
                <View style={styles.shopLogo}>
                  <Ionicons name="storefront" size={28} color="#0E8060" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.nameRow}>
                    <GText variant="h3" color={colors.neutral[900]}>{store.name}</GText>
                    {store.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                  <GText variant="bodySm" color={colors.neutral[500]}>{store.address}</GText>
                  <View style={styles.metaRow}>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#fff" />
                      <GText style={styles.ratingText} weight="bold">{store.rating?.toFixed(1) || '4.5'}</GText>
                    </View>
                    {store.deliveryTime && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={colors.neutral[500]} />
                        <GText variant="bodySm" color={colors.neutral[600]}>{store.deliveryTime}</GText>
                      </View>
                    )}
                    {store.minOrder && (
                      <View style={styles.metaItem}>
                        <GText variant="bodySm" color={colors.neutral[500]}>{t('shop.minOrder', { amount: store.minOrder })}</GText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              {store.description && (
                <GText variant="bodySm" color={colors.neutral[600]} style={{ marginTop: spacing.md, lineHeight: 20 }}>
                  {store.description}
                </GText>
              )}
            </Card>
            {notDeliverable ? (
              <View style={styles.outOfRangeBanner}>
                <Ionicons name="location-outline" size={18} color="#b45309" />
                <GText variant="bodySm" color={colors.neutral[700]} style={{ flex: 1 }}>
                  {store.serviceability?.message ?? t('shop.notDeliverable')}
                </GText>
              </View>
            ) : null}
          </Animated.View>
        )}

        {/* Search Bar for this Shop */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color={colors.neutral[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items in this store..."
              placeholderTextColor={colors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* Products from this shop */}
        <View style={{ marginTop: spacing.lg, paddingHorizontal: spacing.lg }}>
          {!searchQuery ? <SectionHeader title={t('shop.allProducts')} /> : (
            <GText variant="h4" color={colors.neutral[800]} style={{ marginBottom: spacing.md }}>
              Search Results
            </GText>
          )}
          <View style={styles.grid}>
            {productsLoading ? (
              <SkeletonList count={4} />
            ) : products.length === 0 ? (
              <EmptyState
                icon="cube-outline"
                title={t('shop.noProducts')}
                message={t('shop.noProductsMsg')}
              />
            ) : (
              products.map((product: any, i: number) => {
                const cartItem = getCartItem(product);
                return (
                  <ProductCard
                    key={product.id || i}
                    name={product.name || 'Product'}
                    price={product.basePrice || product.price || 0}
                    imageUrl={getProductImage(product)}
                    unit={product.unit || ''}
                    cartQuantity={cartItem?.quantity || 0}
                    onAdd={() => handleAddToCart(product)}
                    onIncrement={() => handleIncrement(product)}
                    onDecrement={() => handleDecrement(product)}
                    onPress={() => router.push(`/product/${product.id}` as any)}
                    style={{ width: Platform.OS === 'web' ? '23%' : '48%', minWidth: 160 }}
                  />
                );
              })
            )}
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  scrollContent: {
    ...(Platform.OS === 'web' && { maxWidth: 1200, width: '100%', alignSelf: 'center', paddingTop: 64 }),
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  coverImage: {
    width: '100%', height: 200, borderRadius: radius.xl,
    marginHorizontal: spacing.lg,
    // Hack: make it fit within padding
    ...(Platform.OS === 'web' ? {
      marginHorizontal: 0,
      borderRadius: radius.xl,
      height: 260,
    } : {}),
  } as any,
  shopInfo: {
    marginHorizontal: spacing.lg,
    marginTop: -40,
    zIndex: 10,
  },
  outOfRangeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  shopHeader: { flexDirection: 'row', gap: spacing.md },
  shopLogo: {
    width: 56, height: 56, borderRadius: radius.lg,
    backgroundColor: '#E7F5F0',
    alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#0E8060', alignItems: 'center', justifyContent: 'center',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#0E8060', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.sm,
  },
  ratingText: { fontSize: 12, color: '#fff' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg,
    marginTop: spacing.md,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: colors.neutral[900],
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
});
