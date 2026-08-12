import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Platform, useWindowDimensions, Pressable, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HeroBanner } from '../../src/components/HeroBanner';
import { MobileHomeHeader } from '../../src/components/MobileHomeHeader';
import { MobilePromoCarousel } from '../../src/components/MobilePromoCarousel';
import { FlashSaleTicker } from '../../src/components/FlashSaleTicker';
import { CategoryCard } from '../../src/components/CategoryCard';
import { ShopCard } from '../../src/components/ShopCard';
import { ProductCard } from '../../src/components/ProductCard';
import { SectionHeader } from '../../src/components/SectionHeader';
import { SkeletonList, CategorySkeletonList, ErrorState } from '../../src/components/StateViews';
import { GText } from '../../src/components/GText';
import { GoPasalBrandLogo } from '../../src/components/brand/GoPasalBrandLogo';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import { useCategories, useStoreCategories, useStores, useProducts, useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '../../src/services/hooks';
import { useScrollStore } from '../../src/store/scroll.store';
import { useLocationStore } from '../../src/store/location.store';
import { useUIStore } from '../../src/store/ui.store';
import { useTranslation } from '../../src/i18n';

const SHOP_IMAGES = [
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80',
];

const PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isWebWide = Platform.OS === 'web' && width >= 1024;
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;
  const isMobile = width < 768 && Platform.OS !== 'web';
  const categoryCols = width >= 1024 ? 8 : width >= 768 ? 6 : width >= 480 ? 5 : 4;
  const categoryBadgeSize = width >= 768 ? 72 : isMobile ? 54 : 64;
  const shopCols = isDesktop ? 4 : isTablet ? 3 : 2;
  const productCols = isDesktop ? 5 : isTablet ? 4 : 3;
  const router = useRouter();
  const addToCart = useAddToCart();
  const { t } = useTranslation();

  const customerLocation = useLocationStore((s) => s.location);
  const { data: apiCategories, isLoading: catLoading, error: catError, refetch: refetchCat } = useStoreCategories();
  const { data: apiStores, isLoading: storesLoading, error: storesError, refetch: refetchStores } = useStores(
    customerLocation?.latitude,
    customerLocation?.longitude
  );
  const { data: apiProducts, isLoading: productsLoading, error: productsError, refetch: refetchProducts } = useProducts({
    limit: 8,
    lat: customerLocation?.latitude,
    lon: customerLocation?.longitude,
  });
  const setScrollY = useScrollStore((s) => s.setScrollY);

  const hasCustomerCoords =
    customerLocation?.latitude != null && customerLocation?.longitude != null;

  const categories = apiCategories ?? [];
  const stores = apiStores ?? [];
  const products = (() => {
    const raw = apiProducts?.data || apiProducts;
    return Array.isArray(raw) ? raw : [];
  })();

  const getStoreImage = (store: any, idx: number) => {
    if (store.logoUrl || store.logo) return store.logoUrl || store.logo;
    if (store.coverImage) return store.coverImage;
    return SHOP_IMAGES[idx % SHOP_IMAGES.length];
  };

  const getProductImage = (product: any, idx: number) => {
    if (product.images?.[0]) return product.images[0];
    if (product.image) return product.image;
    return PRODUCT_IMAGES[idx % PRODUCT_IMAGES.length];
  };

  const showCartToast = useUIStore((s) => s.showCartToast);

  const handleAddToCart = (product: any) => {
    const variantId = product.variants?.[0]?.id || product.defaultVariantId || product.id;
    addToCart.mutate({ variantId, quantity: 1 }, {
      onSuccess: () => {
        showCartToast();
      }
    });
  };

  const { data: cart } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  const getCartItem = (product: any) => {
    const variantId = product.variants?.[0]?.id || product.defaultVariantId || product.id;
    return cart?.items?.find((i: any) => i.productId === variantId || i.variantId === variantId);
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

  // No seller delivers to the customer's chosen area yet.
  const noServiceInArea =
    hasCustomerCoords && !storesLoading && !storesError && stores.length === 0;

  const isApiError = !!catError || !!storesError || !!productsError;

  const handleRetryApi = () => {
    refetchCat();
    refetchStores();
    refetchProducts();
  };

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCat(), refetchStores(), refetchProducts()]);
    setRefreshing(false);
  }, [refetchCat, refetchStores, refetchProducts]);

  // Desktop uses responsive grid; mobile uses horizontal scroll
  const useGridLayout = Platform.OS === 'web' && width >= 768;

  return (
    <View style={styles.page}>
      <MobileHomeHeader />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isMobile && { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
        }
      >
        <HeroBanner />
        <MobilePromoCarousel />

        <View style={styles.contentWrapper}>
          <FlashSaleTicker onPress={() => router.push('/search?collection=deals' as any)} />

          {isApiError ? (
            <View style={{ marginTop: spacing['3xl'], marginBottom: spacing['3xl'] }}>
              <ErrorState 
                message="Could not connect to the server." 
                onRetry={handleRetryApi} 
              />
            </View>
          ) : (
            <>
              {/* Categories Section */}
              <View style={styles.section}>
            <SectionHeader title={t('home.shopByCategory')} />
            {catLoading ? (
              <View style={{ marginTop: spacing.md }}>
                <CategorySkeletonList count={categoryCols * 2} columns={categoryCols} />
              </View>
            ) : (
              <View style={[styles.categoryGrid, isMobile && { rowGap: spacing.md }]}>
                {categories.map((c: any, i: number) => (
                  <View key={c.id || i} style={[styles.categoryWrap, { width: `${100 / categoryCols}%` }]}>
                    <CategoryCard
                      title={c.name || c.title || 'Category'}
                      slug={c.slug || c.id}
                      index={i}
                      size={categoryBadgeSize}
                      onPress={() => router.push(`/search?category=${c.slug || c.id}&tab=shops` as any)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>

          {noServiceInArea ? (
            <ComingSoonBanner onChangeLocation={() => router.push('/location' as any)} />
          ) : (
            <>
              {/* Popular Shops */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <GText style={styles.sectionTitle} weight="bold">
                    {hasCustomerCoords ? t('home.popularNearYou') : "Trending Shops"}
                  </GText>
                  <Pressable onPress={() => router.push('/search?tab=shops&collection=popular' as any)}>
                    <GText style={styles.seeAllText} weight="bold">{t('common.seeAll')}</GText>
                  </Pressable>
                </View>
                {storesLoading ? (
                  <SkeletonList count={4} />
                ) : useGridLayout ? (
                  <View style={styles.responsiveGrid}>
                    {stores.slice(0, 8).map((s: any, i: number) => (
                      <View key={s.id || i} style={{ width: `${100 / shopCols}%`, paddingHorizontal: spacing.sm, marginBottom: spacing.lg }}>
                        <ShopCard
                          name={s.name || 'Store'}
                          imageUrl={getStoreImage(s, i)}
                          rating={s.rating || 4.3 + (i * 0.1)}
                          deliveryTime={s.deliveryTime || '25 min'}
                          isTopRated={(s.rating || 0) >= 4.5}
                          variant="vertical"
                          onPress={() => router.push(`/shop/${s.id}` as any)}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                    {stores.slice(0, 8).map((s: any, i: number) => (
                      <ShopCard
                        key={s.id || i}
                        name={s.name || 'Store'}
                        imageUrl={getStoreImage(s, i)}
                        rating={s.rating || 4.3 + (i * 0.1)}
                        deliveryTime={s.deliveryTime || '25 min'}
                        isTopRated={(s.rating || 0) >= 4.5}
                        onPress={() => router.push(`/shop/${s.id}` as any)}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Recommended Products */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <GText style={styles.sectionTitle} weight="bold">
                    {hasCustomerCoords ? t('home.recommendedForYou') : "Featured Products"}
                  </GText>
                  <Pressable onPress={() => router.push('/search?tab=products&collection=recommended' as any)}>
                    <GText style={styles.seeAllText} weight="bold">{t('common.seeAll')}</GText>
                  </Pressable>
                </View>
                {productsLoading ? (
                  <SkeletonList count={4} />
                ) : useGridLayout ? (
                  <View style={styles.responsiveGrid}>
                    {(Array.isArray(products) ? products : []).slice(0, 10).map((p: any, i: number) => {
                      const cartItem = getCartItem(p);
                      return (
                        <View key={p.id || i} style={{ width: `${100 / productCols}%`, paddingHorizontal: spacing.sm, marginBottom: spacing.lg }}>
                          <ProductCard
                            name={p.name || 'Product'}
                            price={p.basePrice || p.price || 0}
                            imageUrl={getProductImage(p, i)}
                            unit={p.unit || ''}
                            cartQuantity={cartItem?.quantity || 0}
                            onAdd={() => handleAddToCart(p)}
                            onIncrement={() => handleIncrement(p)}
                            onDecrement={() => handleDecrement(p)}
                            onPress={() => router.push(`/product/${p.id}` as any)}
                            style={{ width: '100%' }}
                          />
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                    {(Array.isArray(products) ? products : []).slice(0, 8).map((p: any, i: number) => {
                      const cartItem = getCartItem(p);
                      return (
                        <ProductCard
                          key={p.id || i}
                          name={p.name || 'Product'}
                          price={p.basePrice || p.price || 0}
                          imageUrl={getProductImage(p, i)}
                          unit={p.unit || ''}
                          cartQuantity={cartItem?.quantity || 0}
                          onAdd={() => handleAddToCart(p)}
                          onIncrement={() => handleIncrement(p)}
                          onDecrement={() => handleDecrement(p)}
                          onPress={() => router.push(`/product/${p.id}` as any)}
                        />
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </>
          )}
            </>
          )}
        </View>

        {/* Web Footer */}
        {Platform.OS === 'web' && <WebFooterInline />}
      </ScrollView>
    </View>
  );
}

// Shown when no seller currently delivers to the customer's chosen area.
function ComingSoonBanner({ onChangeLocation }: { onChangeLocation: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.comingSoon}>
      <View style={styles.comingSoonIcon}>
        <Ionicons name="rocket-outline" size={34} color={colors.primary[600]} />
      </View>
      <GText style={styles.comingSoonTitle} weight="bold">{t('home.comingSoonTitle')}</GText>
      <GText style={styles.comingSoonText}>
        {t('home.comingSoonText')}
      </GText>
      <Pressable style={styles.comingSoonBtn} onPress={onChangeLocation}>
        <Ionicons name="location-outline" size={16} color="#fff" />
        <GText style={styles.comingSoonBtnText} weight="bold">{t('home.changeLocation')}</GText>
      </Pressable>
    </View>
  );
}

// Inline footer component
function WebFooterInline() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  return (
    <View style={footerStyles.container}>
      <View style={[footerStyles.inner, isMobile && footerStyles.innerMobile]}>
        <View style={[footerStyles.columns, isMobile && footerStyles.columnsMobile]}>
          {/* Brand Column */}
          <View style={[footerStyles.col, isMobile && footerStyles.colMobile]}>
            <View style={footerStyles.brandRow}>
              <GoPasalBrandLogo size={44} style={{ marginRight: 10 }} />
              <GText style={footerStyles.brandName} weight="bold">GoPasal</GText>
            </View>
            <GText style={footerStyles.brandDesc}>
              {t('footer.brandDesc')}
            </GText>
          </View>

          {/* Quick Links */}
          <View style={[footerStyles.col, isMobile && footerStyles.colMobile]}>
            <GText style={footerStyles.colTitle} weight="bold">{t('footer.quickLinks')}</GText>
            {([
              { labelKey: 'footer.home', route: '/' },
              { labelKey: 'footer.categories', route: '/(tabs)/categories' },
              { labelKey: 'footer.myOrders', route: '/(tabs)/orders' },
              { labelKey: 'footer.myProfile', route: '/(tabs)/profile' },
            ] as const).map((link) => (
              <Pressable key={link.labelKey} onPress={() => router.push(link.route as any)}>
                <GText style={footerStyles.linkText}>{t(link.labelKey)}</GText>
              </Pressable>
            ))}
          </View>

          {/* Support */}
          <View style={[footerStyles.col, isMobile && footerStyles.colMobile]}>
            <GText style={footerStyles.colTitle} weight="bold">{t('footer.customerService')}</GText>
            {([
              { labelKey: 'footer.helpSupport', route: '/support' },
              { labelKey: 'footer.myOrders', route: '/(tabs)/orders' },
              { labelKey: 'footer.offers', route: '/offers' },
              { labelKey: 'footer.notifications', route: '/notifications' },
              { labelKey: 'footer.settings', route: '/settings' },
            ] as const).map((item) => (
              <Pressable key={item.labelKey} onPress={() => router.push(item.route as any)}>
                <GText style={footerStyles.linkText}>{t(item.labelKey)}</GText>
              </Pressable>
            ))}
          </View>

          {/* Categories */}
          <View style={[footerStyles.col, isMobile && footerStyles.colMobile]}>
            <GText style={footerStyles.colTitle} weight="bold">{t('footer.explore')}</GText>
            {([
              { labelKey: 'footer.browseCategories', route: '/(tabs)/categories' },
              { labelKey: 'footer.search', route: '/search' },
              { labelKey: 'footer.wishlist', route: '/wishlist' },
              { labelKey: 'footer.gold', route: '/membership' },
              { labelKey: 'footer.addresses', route: '/addresses' },
            ] as const).map((cat) => (
              <Pressable key={cat.labelKey} onPress={() => router.push(cat.route as any)}>
                <GText style={footerStyles.linkText}>{t(cat.labelKey)}</GText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bottom Bar */}
        <View style={[footerStyles.bottomBar, isMobile && footerStyles.bottomBarMobile]}>
          <View style={{ flex: 1 }}>
            <GText style={footerStyles.copyright}>
              © 2026 GoPasal. Co-Founded by Bibek Kumar Thagunna & Suyogya Sedhai.
            </GText>
            <GText style={[footerStyles.copyright, { marginTop: 4, color: colors.primary[600] }]}>
              Engineered & Architected by Velayon Dynamics
            </GText>
          </View>
          <View style={footerStyles.socialRow}>
            {(['logo-facebook', 'logo-instagram', 'logo-twitter', 'logo-linkedin'] as const).map((icon) => (
              <View key={icon} style={footerStyles.socialIcon}>
                <Ionicons name={icon} size={15} color={colors.neutral[500]} />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  scrollContent: { paddingBottom: 0 },
  contentWrapper: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  section: { marginBottom: spacing['2xl'] },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    color: colors.neutral[800],
    letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary[600],
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
    rowGap: spacing.lg,
  },
  categoryWrap: {
    paddingHorizontal: spacing.sm,
  },
  hScroll: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  responsiveGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.sm,
  },
  comingSoon: {
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    marginBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  comingSoonIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  comingSoonTitle: {
    fontSize: 20,
    color: colors.neutral[900],
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 440,
  },
  comingSoonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  comingSoonBtnText: {
    fontSize: 14,
    color: '#fff',
  },
});

const footerStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral[50],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    marginTop: spacing['3xl'],
  },
  inner: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 48,
    paddingBottom: 24,
  },
  innerMobile: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  columns: {
    flexDirection: 'row',
    gap: 48,
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  columnsMobile: {
    gap: 32,
    flexDirection: 'column',
    marginBottom: 32,
  },
  col: {
    minWidth: 180,
    flex: 1,
    gap: spacing.sm,
  },
  colMobile: {
    flex: 0,
    marginBottom: 32,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 16,
    color: '#fff',
  },
  brandName: {
    fontSize: 22,
    color: colors.neutral[900],
    letterSpacing: -0.5,
  },
  brandDesc: {
    fontSize: 13,
    color: colors.neutral[500],
    lineHeight: 20,
  },
  colTitle: {
    fontSize: 14,
    color: colors.neutral[900],
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  linkText: {
    fontSize: 13,
    color: colors.neutral[500],
    lineHeight: 22,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingTop: spacing.lg,
  },
  bottomBarMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  copyright: {
    fontSize: 12,
    color: colors.neutral[400],
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
