import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet, TextInput, Platform, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { GText } from '../src/components/GText';
import { WebHeader } from '../src/components/WebHeader';
import { ProductCard } from '../src/components/ProductCard';
import { ShopCard } from '../src/components/ShopCard';
import { EmptyState, SkeletonList } from '../src/components/StateViews';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import { useProducts, useStores, useCategories, useStoreCategories, useAddToCart, useCart, useUpdateCartItem, useRemoveCartItem } from '../src/services/hooks';
import { useLocationStore } from '../src/store/location.store';
import { useUIStore } from '../src/store/ui.store';
import { useTranslation } from '../src/i18n';
import { resolveCategoryIconUrl } from '../src/constants/category-icons';

const PASTEL_COLORS = [
  '#E8F5E9', // Light Green
  '#E3F2FD', // Light Blue
  '#FFF3E0', // Light Orange
  '#F3E5F5', // Light Purple
  '#FFEBEE', // Light Red
  '#E0F7FA', // Light Cyan
];

const getPastelColor = (index: number) => {
  return PASTEL_COLORS[index % PASTEL_COLORS.length];
};

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating';

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ q?: string; category?: string; tab?: string; collection?: string }>();
  const [query, setQuery] = useState(params.q || '');
  const [activeTab, setActiveTab] = useState<'products' | 'shops'>(params.tab === 'shops' ? 'shops' : 'products');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  
  // Sync query when header search updates the URL
  React.useEffect(() => {
    if (params.q !== undefined) {
      setQuery(params.q);
    }
  }, [params.q]);
  
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;
  const isMobile = width < 768;
  
  const titleSize = isMobile ? 20 : 28;
  const subtitleSize = isMobile ? 13 : 16;
  const iconWrapSize = isMobile ? 48 : 64;
  const iconSize = isMobile ? 24 : 32;

  // Calculate dynamic grid column widths
  const categoryCols = isDesktop ? 6 : isTablet ? 4 : 2;
  const categoryItemWidth = `${100 / categoryCols - 2}%`;
  
  const shopCols = isDesktop ? 3 : isTablet ? 2 : 1;
  const shopItemWidth = shopCols === 1 ? '100%' : `${100 / shopCols - 2}%`;

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

  const customerLocation = useLocationStore((s) => s.location);
  const hasCustomerCoords = customerLocation?.latitude != null && customerLocation?.longitude != null;
  const geoParams =
    hasCustomerCoords
      ? { lat: customerLocation.latitude, lon: customerLocation.longitude }
      : {};

  const { data: categories } = useCategories();
  const { data: storeCategories } = useStoreCategories();

  const activeStoreCategory = useMemo(() => {
    if (!params.category || !storeCategories?.length) return null;
    return storeCategories.find(
      (c) => c.id === params.category || c.slug === params.category
    ) ?? null;
  }, [params.category, storeCategories]);

  const searchParams = useMemo(() => {
    if (query.length >= 2) {
      return {
        q: query,
        ...(params.category
          ? activeStoreCategory
            ? { storeCategoryId: activeStoreCategory.id }
            : { categoryId: params.category }
          : {}),
        ...geoParams,
      };
    }
    if (params.category) {
      return activeStoreCategory
        ? { storeCategoryId: activeStoreCategory.id, ...geoParams }
        : { categoryId: params.category, ...geoParams };
    }
    if (params.collection === 'recommended') {
      return { ...geoParams };
    }
    return undefined;
  }, [query, params.category, activeStoreCategory, geoParams, params.collection]);

  const { data: productsData, isLoading: productsLoading } = useProducts(searchParams);
  const { data: stores, isLoading: storesLoading } = useStores(
    customerLocation?.latitude,
    customerLocation?.longitude
  );

  // Extract products array from paginated response
  const rawProducts = useMemo(() => {
    if (!productsData) return [];
    if (Array.isArray(productsData)) return productsData;
    if (productsData.data && Array.isArray(productsData.data)) return productsData.data;
    return [];
  }, [productsData]);

  // Apply client-side sorting and filtering
  const products = useMemo(() => {
    let result = [...rawProducts];
    
    if (ratingFilter) {
      result = result.filter((p: any) => (p.rating || 0) >= ratingFilter);
    }

    switch (sortBy) {
      case 'price_asc':
        result.sort((a: any, b: any) => (a.basePrice || a.price || 0) - (b.basePrice || b.price || 0));
        break;
      case 'price_desc':
        result.sort((a: any, b: any) => (b.basePrice || b.price || 0) - (a.basePrice || a.price || 0));
        break;
      case 'rating':
        result.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
        break;
    }
    return result;
  }, [rawProducts, sortBy, ratingFilter]);

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    let result = stores;
    if (activeStoreCategory) {
      result = result.filter(
        (s: any) =>
          s.storeCategoryId === activeStoreCategory.id ||
          s.shopType?.toLowerCase() === activeStoreCategory.slug.toLowerCase()
      );
    }
    if (params.collection === 'popular') {
      result = [...result].sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    }
    if (query.length < 2) return result;
    return result.filter((s: any) => s.name?.toLowerCase().includes(query.toLowerCase()));
  }, [stores, query, activeStoreCategory, params.collection]);

  const hasSearchParams = query.length >= 2 || !!params.category || !!params.collection;

  const getProductImage = (product: any) => {
    if (product.images?.[0]) return product.images[0];
    if (product.image) return product.image;
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
  };

  const getStoreImage = (store: any) => {
    if (store.logoUrl || store.logo) return store.logoUrl || store.logo;
    if (store.coverImage) return store.coverImage;
    return 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=400&q=80';
  };

  const SORT_OPTIONS: { key: SortOption; label: string }[] = [
    { key: 'relevance', label: t('search.relevance') },
    { key: 'price_asc', label: t('search.priceLowHigh') },
    { key: 'price_desc', label: t('search.priceHighLow') },
    { key: 'rating', label: t('search.topRated') },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {Platform.OS === 'web' && <WebHeader />}

      {/* Mobile Search Header */}
      {Platform.OS !== 'web' && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.searchHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.neutral[700]} />
          </Pressable>
          <View style={styles.searchInputBox}>
            <Ionicons name="search-outline" size={20} color={colors.neutral[400]} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('header.searchPlaceholder')}
              placeholderTextColor={colors.neutral[400]}
              autoFocus
              style={styles.input}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.neutral[400]} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}

      {/* Web search bar for this page - Only show on mobile web where header search is hidden */}
      {Platform.OS === 'web' && isMobile && (
        <View style={styles.webSearchRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.neutral[700]} />
          </Pressable>
          <View style={styles.webSearchBox}>
            <Ionicons name="search-outline" size={20} color={colors.neutral[400]} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('search.placeholderWeb')}
              placeholderTextColor={colors.neutral[400]}
              style={styles.webSearchInput}
              returnKeyType="search"
              autoFocus={!query}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.neutral[400]} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Spacing for Desktop Web to account for hidden search bar */}
      {Platform.OS === 'web' && !isMobile && (
        <View style={{ height: 96 }} />
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.segmentedControl}>
          {(['products', 'shops'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.segmentedTab, activeTab === tab && styles.segmentedTabActive]}
            >
              <GText
                style={[styles.segmentedTabText, activeTab === tab && styles.segmentedTabTextActive]}
                weight={activeTab === tab ? 'semiBold' : 'medium'}
              >
                {tab === 'products' ? t('search.products') : t('search.shops')}
              </GText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Filter/Sort Bar */}
      {hasSearchParams && activeTab === 'products' && (
        <View style={styles.contentWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
              key={opt.key}
              style={[styles.filterChip, sortBy === opt.key && styles.filterChipActive]}
              onPress={() => setSortBy(opt.key)}
            >
              <GText
                style={[styles.filterChipText, sortBy === opt.key && styles.filterChipTextActive]}
                weight={sortBy === opt.key ? 'bold' : 'medium'}
              >
                {opt.label}
              </GText>
            </Pressable>
          ))}
          
          <View style={styles.filterDivider} />
          
          {[4, 3].map((r) => (
            <Pressable
              key={r}
              style={[styles.filterChip, ratingFilter === r && styles.filterChipActive]}
              onPress={() => setRatingFilter(ratingFilter === r ? null : r)}
            >
              <Ionicons name="star" size={12} color={ratingFilter === r ? '#fff' : '#F5A623'} />
              <GText
                style={[styles.filterChipText, ratingFilter === r && styles.filterChipTextActive]}
                weight="medium"
              >
                {t('search.starsPlus', { count: r })}
              </GText>
            </Pressable>
          ))}
          </ScrollView>
        </View>
      )}

      {/* Category Chips (when no search, products tab) */}
      {!hasSearchParams && activeTab === 'products' && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.categoriesContainer}>
          <GText style={styles.browseTitleText} weight="bold">{t('search.browseCategories')}</GText>
          <View style={styles.categoryGrid}>
            {(storeCategories || categories || []).map((cat: any, i: number) => {
              const iconSource = cat.icon?.startsWith('http') ? cat.icon : resolveCategoryIconUrl(cat.slug, cat.name);
              return (
                  <Pressable
                  key={cat.id}
                  style={[styles.categoryGridItem, { backgroundColor: getPastelColor(i), width: categoryItemWidth as any }]}
                  onPress={() => router.push(`/search?category=${cat.slug || cat.id}` as any)}
                >
                  <Image source={typeof iconSource === 'string' ? { uri: iconSource } : iconSource} style={styles.categoryGridIcon} contentFit="contain" />
                  <View style={styles.categoryGridTextWrap}>
                    <GText style={styles.categoryGridText} weight="semiBold">{cat.name}</GText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {params.collection === 'popular' && activeTab === 'shops' && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.collectionHeader}>
              <View style={[styles.collectionIconWrap, { width: iconWrapSize, height: iconWrapSize, borderRadius: iconWrapSize / 2 }]}>
                <Ionicons name="star" size={iconSize} color={colors.primary[600]} />
              </View>
              <View style={styles.collectionHeaderText}>
                <GText style={{ fontSize: titleSize, color: colors.neutral[900] }} weight="bold">
                  {hasCustomerCoords ? t('home.popularNearYou') : "Trending Shops"}
                </GText>
                <GText style={{ fontSize: subtitleSize, color: colors.neutral[500], marginTop: 2 }}>
                  {hasCustomerCoords ? "Highly rated shops delivering to your location." : "Highly rated shops on GoPasal."}
                </GText>
              </View>
            </Animated.View>
          )}

          {params.collection === 'recommended' && activeTab === 'products' && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.collectionHeader}>
              <View style={[styles.collectionIconWrap, { width: iconWrapSize, height: iconWrapSize, borderRadius: iconWrapSize / 2 }]}>
                <Ionicons name="sparkles" size={iconSize} color={colors.primary[600]} />
              </View>
              <View style={styles.collectionHeaderText}>
                <GText style={{ fontSize: titleSize, color: colors.neutral[900] }} weight="bold">
                  {hasCustomerCoords ? t('home.recommendedForYou') : "Featured Products"}
                </GText>
                <GText style={{ fontSize: subtitleSize, color: colors.neutral[500], marginTop: 2 }}>
                  {hasCustomerCoords ? "Top products based on your preferences and location." : "Top products from across our platform."}
                </GText>
              </View>
            </Animated.View>
          )}

          {/* Products results */}
          {hasSearchParams && activeTab === 'products' && (
            <View>
            {productsLoading ? (
              <SkeletonList count={4} />
            ) : products.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title={t('search.noResults')}
                message={t('search.noResultsMsg', { query })}
              />
            ) : (
              <View style={styles.grid}>
                {products.map((product: any, i: number) => {
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
                      style={styles.productCardCustom}
                    />
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Shops results — all shops that deliver to this location, or filtered by query */}
        {activeTab === 'shops' && (
          <View style={styles.shopsGrid}>
            {storesLoading ? (
              <SkeletonList count={3} />
            ) : filteredStores.length === 0 ? (
              <EmptyState
                icon="storefront-outline"
                title={t('search.noShops')}
                message={query.length >= 2 ? t('search.tryDifferent') : t('search.noShopsDeliver')}
              />
            ) : (
              filteredStores.map((store: any, i: number) => (
                <View key={store.id || i} style={{ width: shopItemWidth as any }}>
                  <ShopCard
                    name={store.name || 'Store'}
                    imageUrl={getStoreImage(store)}
                    rating={store.rating || 4.5}
                    deliveryTime={store.deliveryTime || '20m'}
                    isTopRated={(store.rating || 0) >= 4.5}
                    variant="vertical"
                    onPress={() => router.push(`/shop/${store.id}` as any)}
                  />
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },

  // Mobile search header
  searchHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  searchInputBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.neutral[100], borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, height: 48,
  },
  input: {
    flex: 1, fontSize: 15, color: colors.neutral[900], paddingVertical: 0,
    fontFamily: 'Inter',
  },

  // Web search row
  webSearchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    marginTop: 64,
    maxWidth: 1200, width: '100%', alignSelf: 'center',
  },
  webSearchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.neutral[100], borderRadius: radius.pill,
    paddingHorizontal: spacing.lg, height: 48,
    borderWidth: 1, borderColor: colors.neutral[200],
  },
  webSearchInput: {
    flex: 1, fontSize: 15, color: colors.neutral[900], paddingVertical: 0,
    fontFamily: 'Inter', outlineStyle: 'none', outlineWidth: 0,
  } as any,
  searchTitle: {
    fontSize: 20, color: colors.neutral[900],
  },

  // Tabs (Segmented Control)
  tabsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: 1200, width: '100%', alignSelf: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.pill,
    padding: 4,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  segmentedTabActive: {
    backgroundColor: '#0E8060',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentedTabText: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  segmentedTabTextActive: {
    color: '#ffffff',
  },

  // Filter bar
  filterBar: { maxHeight: 50 },
  filterBarContent: {
    paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.neutral[200],
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#0E8060', borderColor: '#0E8060',
  },
  filterChipText: { fontSize: 12, color: colors.neutral[700] },
  filterChipTextActive: { color: '#ffffff' },
  filterDivider: {
    width: 1, height: 20, backgroundColor: colors.neutral[200], marginHorizontal: 4,
  },

  // Category browsing (Empty State)
  categoriesContainer: {
    maxWidth: 1200, width: '100%', alignSelf: 'center',
  },
  browseTitleText: {
    fontSize: 20, color: colors.neutral[900],
    paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  categoryGridItem: {
    // width: '47%', // removed hardcoded width
    height: 110,
    borderRadius: radius.md,
    padding: spacing.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryGridTextWrap: {
    width: '100%',
    alignItems: 'center',
  },
  categoryGridText: {
    fontSize: 13,
    color: colors.neutral[900],
    textAlign: 'center',
  },
  categoryGridIcon: {
    width: 60,
    height: 60,
    marginTop: 4,
  },

  // Content
  contentWrapper: {
    maxWidth: 1200, width: '100%', alignSelf: 'center',
  },
  content: {
    paddingTop: spacing.md,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  shopsGrid: {
    gap: spacing.md, paddingHorizontal: spacing.lg,
    flexDirection: 'row', flexWrap: 'wrap',
  },
  productCardCustom: {
    width: Platform.OS === 'web' ? 200 : '48%', // Matches Category layout
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.03)' } as any,
      default: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03, shadowRadius: 20, elevation: 2,
      }
    }),
  },
  collectionIconWrap: {
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  collectionHeaderText: {
    flex: 1, gap: 4,
  },
});
