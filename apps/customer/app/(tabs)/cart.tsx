import React, { useState, useCallback } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, useWindowDimensions, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../../src/design-system/primitives/GText';
import { Button } from '../../src/design-system/primitives/Button';
import { Card } from '../../src/design-system/primitives/Card';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import { Platform } from 'react-native';
import { EmptyState, ErrorState } from '../../src/components/StateViews';
import { useCart, useUpdateCartItem, useRemoveCartItem, useClearCart } from '../../src/services/hooks';
import { formatMoney } from '../../src/utils/money';
import {
  getCartItemPrice,
  getCartItemProductName,
  getCartStoreName,
  isSingleStoreCart,
} from '../../src/utils/cart';
import { useTranslation } from '../../src/i18n';
import { DeliveryFeeLine } from '../../src/components/DeliveryFeeLine';
import { getCartTotalForDisplay } from '../../src/utils/delivery-fee';

export default function CartScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: cart, isLoading, error, refetch } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 850;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (error) {
    return <ErrorState message={t('cart.failedLoad')} onRetry={() => refetch()} />;
  }

  if (!isLoading && (!cart || cart.items.length === 0)) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <EmptyState
          icon="bag-outline"
          title={t('cart.empty')}
          message={t('cart.emptyMsg')}
          actionLabel={t('common.browseShops')}
          onAction={() => router.push('/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  const getItemImage = (item: any) => {
    if (item.product?.images?.[0]) return item.product.images[0];
    if (item.variant?.product?.images?.[0]) return item.variant.product.images[0];
    if (item.product?.image) return item.product.image;
    return null;
  };

  const canCheckout = cart ? isSingleStoreCart(cart) && cart.items.length > 0 : false;
  const storeName = cart ? getCartStoreName(cart) : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {Platform.OS === 'web' && (
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
            </Pressable>
          )}
          <GText variant="h2" color={colors.neutral[900]}>{t('cart.title')}</GText>
          {cart && cart.items.length > 0 && (
            <Pressable onPress={() => clearCart.mutate()} style={styles.clearBtn}>
              <GText style={styles.clearText} weight="medium">{t('cart.clearAll')}</GText>
            </Pressable>
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />
          }
        >
          {/* Main Container / Flex Row on Desktop */}
          <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
            {/* Left Column: Banners & Cart Items */}
            <View style={[styles.leftCol, isDesktop && styles.leftColDesktop]}>
              {storeName ? (
                <View style={styles.shopBanner}>
                  <Ionicons name="storefront-outline" size={18} color={colors.primary[600]} />
                  <GText variant="bodySm" color={colors.neutral[700]} style={{ flex: 1 }}>
                    {t('cart.orderingFrom', { store: storeName })}
                  </GText>
                </View>
              ) : null}

              {!canCheckout && cart && cart.items.length > 0 ? (
                <View style={styles.warningBanner}>
                  <Ionicons name="alert-circle" size={18} color={colors.error.main} />
                  <GText variant="bodySm" color={colors.error.main} style={{ flex: 1 }}>
                    {t('cart.multiShopWarning')}
                  </GText>
                </View>
              ) : null}

              {/* Cart items */}
              {cart?.items.map((item, i) => {
                const imageUrl = getItemImage(item);
                return (
                  <Animated.View key={item.id} entering={FadeInDown.delay(i * 60).duration(300)}>
                    <Card variant="elevated" style={styles.cartItem}>
                      {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.itemImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                          <Ionicons name="cube-outline" size={24} color={colors.neutral[300]} />
                        </View>
                      )}
                      <View style={styles.itemInfo}>
                        <GText variant="body" weight="medium" numberOfLines={2}>
                          {getCartItemProductName(item)}
                        </GText>
                        <GText variant="h4" color={colors.primary[600]}>
                          {formatMoney(getCartItemPrice(item))}
                        </GText>
                      </View>
                      <View style={styles.itemActions}>
                        <View style={styles.quantityControl}>
                          <Pressable
                            style={styles.qtyBtn}
                            onPress={() => {
                              if (item.quantity <= 1) removeItem.mutate(item.id);
                              else updateItem.mutate({ id: item.id, quantity: item.quantity - 1 });
                            }}
                          >
                            <Ionicons
                              name={item.quantity <= 1 ? 'trash-outline' : 'remove'}
                              size={16}
                              color={item.quantity <= 1 ? colors.error.main : colors.neutral[700]}
                            />
                          </Pressable>
                          <GText variant="body" weight="bold">{item.quantity}</GText>
                          <Pressable
                            style={[styles.qtyBtn, styles.qtyBtnAdd]}
                            onPress={() => updateItem.mutate({ id: item.id, quantity: item.quantity + 1 })}
                          >
                            <Ionicons name="add" size={16} color={colors.primary[600]} />
                          </Pressable>
                        </View>
                      </View>
                    </Card>
                  </Animated.View>
                );
              })}
            </View>

            {/* Right Column: Order Summary & Inline Desktop Checkout */}
            {cart && (
              <View style={[styles.rightCol, isDesktop && styles.rightColDesktop]}>
                <Animated.View entering={FadeInDown.delay(200).duration(300)}>
                  <Card variant="tinted" style={styles.summary}>
                    <GText variant="h4" color={colors.neutral[900]}>{t('cart.orderSummary')}</GText>
                    <View style={styles.summaryRow}>
                      <GText variant="body" color={colors.neutral[600]}>{t('common.subtotal')}</GText>
                      <GText variant="body" weight="medium">{formatMoney(cart.subtotal)}</GText>
                    </View>
                    <DeliveryFeeLine cart={cart} />
                    <View style={styles.summaryRow}>
                      <GText variant="body" color={colors.neutral[600]}>Platform Fee</GText>
                      <GText variant="body" weight="medium">{formatMoney(cart.platformFee ?? 10)}</GText>
                    </View>
                    {cart.discount > 0 && (
                      <View style={styles.summaryRow}>
                        <GText variant="body" color={colors.success.dark}>{t('common.discount')}</GText>
                        <GText variant="body" weight="medium" color={colors.success.dark}>
                          −{formatMoney(cart.discount)}
                        </GText>
                      </View>
                    )}
                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <GText variant="h3" color={colors.neutral[900]}>{t('common.total')}</GText>
                      <GText variant="h3" color={colors.primary[600]}>
                        {formatMoney(cart.total)}
                      </GText>
                    </View>

                    {isDesktop && (
                      <View style={{ marginTop: spacing.md }}>
                        {!canCheckout ? (
                          <GText variant="caption" color={colors.neutral[500]} align="center" style={styles.checkoutHint}>
                            {t('cart.singleShopOnly')}
                          </GText>
                        ) : null}
                        <Button
                          label={t('cart.proceedToCheckout', { amount: formatMoney(getCartTotalForDisplay(cart)) })}
                          fullWidth
                          size="lg"
                          disabled={!canCheckout}
                          onPress={() => router.push('/checkout' as any)}
                        />
                      </View>
                    )}
                  </Card>
                </Animated.View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Mobile Checkout button */}
        {cart && cart.items.length > 0 && !isDesktop && (
          <View style={[styles.checkoutBar, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? spacing.lg : spacing['3xl']) }]}>
            {!canCheckout ? (
              <GText variant="caption" color={colors.neutral[500]} align="center" style={styles.checkoutHint}>
                {t('cart.singleShopOnly')}
              </GText>
            ) : null}
            <Button
              label={t('cart.proceedToCheckout', { amount: formatMoney(getCartTotalForDisplay(cart)) })}
              fullWidth
              size="lg"
              disabled={!canCheckout}
              onPress={() => router.push('/checkout' as any)}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  container: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' && { maxWidth: 1100, alignSelf: 'center' }),
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  scroll: { flex: 1 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.error.main,
  },
  clearText: { fontSize: 13, color: colors.error.main },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.lg,
  },
  contentDesktop: {
    paddingTop: spacing.md,
  },
  mainLayout: {
    gap: spacing.md,
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xl,
  },
  leftCol: {
    flex: 1,
    gap: spacing.md,
  },
  leftColDesktop: {
    flex: 1,
  },
  rightCol: {
    width: '100%',
  },
  rightColDesktop: {
    width: 380,
  },
  shopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary[50],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error.light,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  checkoutHint: {
    marginBottom: spacing.sm,
  },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md,
  },
  itemImage: {
    width: 72, height: 72, borderRadius: radius.md,
  },
  itemImagePlaceholder: {
    backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1, gap: 4 },
  itemActions: { alignItems: 'flex-end' },
  quantityControl: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.neutral[50], borderRadius: radius.pill,
    paddingHorizontal: spacing.xs, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.neutral[200],
  },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnAdd: { backgroundColor: '#E7F5F0' },
  summary: { gap: spacing.md, marginTop: 0 },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalRow: {
    borderTopWidth: 1, borderTopColor: colors.neutral[200],
    paddingTop: spacing.md, marginTop: spacing.sm,
  },
  checkoutBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'web' ? spacing.lg : spacing['3xl'],
    paddingTop: spacing.lg,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[150],
  },
});
