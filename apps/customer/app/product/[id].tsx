import React, { useMemo, useState, useRef } from 'react';
import { View, ScrollView, Pressable, StyleSheet, useWindowDimensions, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../../src/design-system/primitives/GText';
import { Button } from '../../src/design-system/primitives/Button';
import { Badge } from '../../src/design-system/primitives/Badge';
import { Card } from '../../src/design-system/primitives/Card';
import { WebHeader } from '../../src/components/WebHeader';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import {
  useProduct,
  useAddToCart,
  useReviews,
  useToggleWishlist,
  useWishlist,
} from '../../src/services/hooks';
import { formatMoney, getProductPrice, getProductComparePrice } from '../../src/utils/money';
import { ErrorState, ProductSkeleton } from '../../src/components/StateViews';
import { useTranslation } from '../../src/i18n';
import { useUIStore } from '../../src/store/ui.store';
import { useAuthStore } from '../../src/store/auth.store';
import { useConfirmDialogStore } from '../../src/store/confirm-dialog.store';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isWebWide = Platform.OS === 'web' && width >= 768;
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error, refetch } = useProduct(id);
  const { data: reviews } = useReviews(id);
  const { data: wishlist } = useWishlist();
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const showCartToast = useUIStore((s) => s.showCartToast);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showConfirm = useConfirmDialogStore((s) => s.show);

  const isWishlisted = useMemo(
    () => wishlist?.some((w) => w.productId === id) ?? false,
    [wishlist, id]
  );

  const [wishlistAction, setWishlistAction] = useState<'added' | 'removed' | null>(null);
  const wishlistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (error) return <ErrorState message={t('product.failedLoad')} onRetry={() => refetch()} />;

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.safe}>
        {Platform.OS === 'web' && <WebHeader />}
        <ProductSkeleton />
      </SafeAreaView>
    );
  }

  const unitPrice = getProductPrice(product);
  const comparePrice = getProductComparePrice(product);
  const hasDiscount = comparePrice != null && comparePrice > unitPrice;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice! - unitPrice) / comparePrice!) * 100)
    : 0;

  const productImage =
    product.images?.[0] ||
    product.image ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

  const variantId = product.variants?.[0]?.id || (product as { defaultVariantId?: string }).defaultVariantId || product.id;
  const inStock = product.inStock !== false && product.variants?.[0]?.inStock !== false;
  const storeName = product.storeName || product.store?.name;
  const storeId = product.storeId || product.store?.id;

  const handleAddToCart = () => {
    addToCart.mutate({ variantId, quantity }, {
      onSuccess: () => {
        setQuantity(1);
        showCartToast();
      }
    });
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      showConfirm({
        title: t('wishlist.loginRequiredTitle'),
        message: t('wishlist.loginRequiredMsg'),
        confirmLabel: t('profile.signIn'),
        cancelLabel: t('common.cancel'),
        onConfirm: () => {
          router.push('/(auth)/login' as any);
        },
      });
      return;
    }

    const isNowWishlisted = !isWishlisted; // optimistic
    setWishlistAction(isNowWishlisted ? 'added' : 'removed');
    toggleWishlist.mutate(product.id);
    
    if (wishlistTimeoutRef.current) clearTimeout(wishlistTimeoutRef.current);
    wishlistTimeoutRef.current = setTimeout(() => {
      setWishlistAction(null);
    }, 2500);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {Platform.OS === 'web' && <WebHeader />}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainContent, isWebWide && styles.mainContentWeb]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
            </Pressable>
            <View style={{ position: 'relative', zIndex: 20 }}>
              <Pressable
                style={[styles.iconBtn, isWishlisted && styles.wishBtnActive]}
                onPress={handleWishlist}
                disabled={toggleWishlist.isPending}
              >
                <Ionicons
                  name={isWishlisted ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isWishlisted ? colors.error.main : colors.neutral[800]}
                />
              </Pressable>
              
              {wishlistAction && (
                <Animated.View 
                  entering={FadeInDown.duration(200)}
                  exiting={FadeOut.duration(200)}
                  style={{
                    position: 'absolute',
                    top: 50,
                    right: 0,
                    backgroundColor: '#000000',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    minWidth: 150,
                  }}
                >
                  <Ionicons 
                    name={wishlistAction === 'added' ? 'checkmark-circle' : 'close-circle'} 
                    size={16} 
                    color="#ffffff" 
                  />
                  <GText variant="bodySm" color="#ffffff" weight="semibold">
                    {wishlistAction === 'added' ? 'Added to wishlist' : 'Removed from wishlist'}
                  </GText>
                </Animated.View>
              )}
            </View>
          </View>

          <View style={[isWebWide && styles.webGrid]}>
            <Animated.View
              entering={FadeIn.duration(400)}
              style={[styles.imageContainer, isWebWide && styles.imageContainerWeb]}
            >
              <Image source={{ uri: productImage }} style={styles.productImage} resizeMode="cover" />
              {hasDiscount ? (
                <View style={styles.discountBadge}>
                  <Badge label={t('offers.percentOff', { discount: discountPercent })} variant="discount" />
                </View>
              ) : null}
            </Animated.View>

            <View style={[styles.detailsCol, isWebWide && styles.detailsColWeb]}>
              <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.infoSection}>
                {product.category?.name ? (
                  <GText variant="caption" color={colors.primary[600]} weight="semibold">
                    {product.category.name.toUpperCase()}
                  </GText>
                ) : null}

                <GText variant="h1" color={colors.neutral[900]} style={styles.productName}>
                  {product.name}
                </GText>

                <View style={styles.ratingRow}>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#fff" />
                    <GText style={styles.ratingBadgeText} weight="bold">
                      {product.rating || '—'}
                    </GText>
                  </View>
                  <GText variant="bodySm" color={colors.neutral[500]}>
                    {t('product.reviews', { count: product.reviewCount || 0 })}
                  </GText>
                  <View style={[styles.stockBadge, !inStock && styles.stockBadgeOut]}>
                    <GText style={[styles.stockText, !inStock && styles.stockTextOut]} weight="medium">
                      {inStock ? t('product.inStock') : t('product.outOfStock')}
                    </GText>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <GText variant="displayMd" color={colors.neutral[900]}>
                    {formatMoney(unitPrice)}
                  </GText>
                  {hasDiscount ? (
                    <GText
                      variant="bodyLg"
                      color={colors.neutral[400]}
                      style={{ textDecorationLine: 'line-through' }}
                    >
                      {formatMoney(comparePrice)}
                    </GText>
                  ) : null}
                </View>
                {product.unit ? (
                  <GText variant="bodySm" color={colors.neutral[500]}>
                    {t('product.perUnit', { unit: product.unit })}
                  </GText>
                ) : null}
              </Animated.View>

              {storeName ? (
                <Animated.View entering={FadeInDown.delay(120).duration(400)}>
                  <Pressable
                    style={styles.storeCard}
                    onPress={() => storeId && router.push(`/shop/${storeId}` as any)}
                  >
                    <View style={styles.storeIcon}>
                      <Ionicons name="storefront" size={18} color={colors.primary[600]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <GText variant="caption" color={colors.neutral[500]}>
                        {t('product.soldBy')}
                      </GText>
                      <GText variant="body" weight="semibold" color={colors.neutral[900]}>
                        {storeName}
                      </GText>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
                  </Pressable>
                </Animated.View>
              ) : null}

              <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.quantitySection}>
                <GText variant="body" weight="semibold" color={colors.neutral[700]}>
                  {t('product.quantity')}
                </GText>
                <View style={styles.quantityControl}>
                  <Pressable
                    style={[styles.qtyBtn, quantity <= 1 && { opacity: 0.5, borderColor: colors.neutral[150] }]}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Ionicons name="remove" size={18} color={quantity <= 1 ? colors.neutral[400] : colors.neutral[700]} />
                  </Pressable>
                  <GText variant="body" weight="bold" style={styles.qtyValue}>
                    {quantity}
                  </GText>
                  <Pressable style={[styles.qtyBtn, styles.qtyBtnAdd]} onPress={() => setQuantity(quantity + 1)}>
                    <Ionicons name="add" size={18} color={colors.primary[600]} />
                  </Pressable>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.trustRow}>
                <View style={styles.trustItem}>
                  <Ionicons name="bicycle-outline" size={18} color={colors.primary[600]} />
                  <GText variant="caption" color={colors.neutral[600]}>
                    {t('product.localDelivery')}
                  </GText>
                </View>
                <View style={styles.trustItem}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary[600]} />
                  <GText variant="caption" color={colors.neutral[600]}>
                    {t('product.securePayment')}
                  </GText>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
                <GText variant="h4" color={colors.neutral[900]}>
                  {t('product.description')}
                </GText>
                <GText variant="body" color={colors.neutral[600]} style={styles.description}>
                  {product.description || t('product.noDescription')}
                </GText>
              </Animated.View>
            </View>
          </View>

          {reviews && reviews.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
              <GText variant="h4" color={colors.neutral[900]}>
                {t('product.reviewsTitle', { count: reviews.length })}
              </GText>
              {reviews.slice(0, 3).map((review) => (
                <Card key={review.id} variant="outlined" padding="md" style={{ marginTop: spacing.sm }}>
                  <View style={styles.reviewHeader}>
                    <GText variant="bodySm" weight="semibold">
                      {review.userName}
                    </GText>
                    <View style={styles.stars}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < review.rating ? 'star' : 'star-outline'}
                          size={12}
                          color={i < review.rating ? colors.star.filled : colors.neutral[300]}
                        />
                      ))}
                    </View>
                  </View>
                  <GText variant="bodySm" color={colors.neutral[600]}>
                    {review.comment}
                  </GText>
                </Card>
              ))}
            </Animated.View>
          ) : null}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <GText variant="bodySm" color={colors.neutral[500]}>
            {t('common.total')}
          </GText>
          <GText variant="h3" color={colors.neutral[900]}>
            {formatMoney(unitPrice * quantity)}
          </GText>
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={addToCart.isPending ? t('product.adding') : t('product.addToCart', { count: quantity })}
            fullWidth
            size="lg"
            loading={addToCart.isPending}
            disabled={!inStock}
            onPress={handleAddToCart}
            icon={<Ionicons name="bag-add" size={20} color="#FFFFFF" />}
          />
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  scrollContent: { paddingBottom: 0 },
  mainContent: {
    paddingTop: Platform.OS === 'web' ? 64 + spacing.md : 0,
  },
  mainContentWeb: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingContainer: { flex: 1, padding: spacing.lg },
  loadingSkeleton: {
    height: 300,
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[150],
  },
  header: {
    zIndex: 10,
    elevation: 10,
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  wishBtnActive: {
    backgroundColor: colors.error.light,
    borderColor: colors.error.light,
  },
  webGrid: {
    flexDirection: 'row',
    gap: spacing['3xl'],
  },
  imageContainer: {
    height: 340,
    backgroundColor: colors.neutral[100],
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  imageContainerWeb: {
    height: 480,
    flex: 1,
    marginHorizontal: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: { position: 'absolute', top: spacing.lg, left: spacing.lg },
  detailsCol: {},
  detailsColWeb: { flex: 1 },
  infoSection: {
    padding: spacing.xl,
    gap: spacing.sm,
  },
  productName: {
    lineHeight: 34,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  ratingBadgeText: { fontSize: 12, color: '#fff' },
  stockBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  stockBadgeOut: {
    backgroundColor: colors.error.light,
  },
  stockText: { fontSize: 11, color: colors.success.dark },
  stockTextOut: { color: colors.error.main },
  stars: { flexDirection: 'row', gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, marginTop: spacing.xs },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.card,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  qtyValue: { minWidth: 24, textAlign: 'center' },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  qtyBtnAdd: { borderColor: colors.primary[400], backgroundColor: colors.primary[50] },
  trustRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  section: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  description: { lineHeight: 24 },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
    paddingTop: spacing.lg,
    backgroundColor: colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[150],
    ...(Platform.OS === 'web'
      ? { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingBottom: spacing.lg }
      : {}),
  },
  bottomPrice: {
    gap: 2,
    minWidth: 100,
  },
});
