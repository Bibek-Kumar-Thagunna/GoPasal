import React, { useEffect } from 'react';
import { StyleSheet, Pressable, Platform, View } from 'react-native';
import Animated, { FadeInRight, FadeOutRight, Layout, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { GText } from '../design-system/primitives/GText';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { useUIStore } from '../store/ui.store';
import { useCart } from '../services/hooks';
import { shadows } from '../design-system/tokens/shadows';

export function GlobalCartToast() {
  const { cartToastVisible, hideCartToast } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const { data: cart } = useCart();

  const totalItems = cart?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  useEffect(() => {
    if (cartToastVisible) {
      const timer = setTimeout(() => {
        hideCartToast();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [cartToastVisible, hideCartToast]);

  // Define paths where the cart FAB should be hidden
  const hiddenPaths = [
    '/cart', 
    '/checkout', 
    '/profile', 
    '/settings', 
    '/addresses', 
    '/notifications', 
    '/orders', 
    '/login',
    '/language',
    '/support',
    '/about',
    '/privacy',
    '/terms',
    '/location'
  ];
  const isHiddenPath = hiddenPaths.includes(pathname) || pathname.startsWith('/order/');

  // Don't show the FAB if we are on a hidden page, or if there are no items and no toast
  if (isHiddenPath || (totalItems === 0 && !cartToastVisible)) {
    return null;
  }

  return (
    <Animated.View
      entering={ZoomIn.duration(200).springify()}
      exiting={ZoomOut.duration(150)}
      layout={Layout.springify().damping(18).stiffness(200)}
      style={styles.container}
    >
      <Pressable 
        style={({ pressed }) => [
          styles.fab,
          pressed && styles.fabPressed
        ]}
        onPress={() => {
          hideCartToast();
          router.push('/cart' as any);
        }}
      >
        <View style={styles.contentRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="cart" size={24} color="#ffffff" />
            {totalItems > 0 && (
              <Animated.View entering={ZoomIn.duration(150)} exiting={ZoomOut.duration(100)} style={styles.badge}>
                <GText style={styles.badgeText} weight="bold">{totalItems}</GText>
              </Animated.View>
            )}
          </View>
          
          {cartToastVisible && (
            <Animated.View 
              entering={FadeInRight.duration(150).springify().damping(18).stiffness(200)} 
              exiting={FadeOutRight.duration(150)}
              style={styles.toastTextContainer}
            >
              <GText variant="bodySm" weight="bold" color="#ffffff">
                Added to cart!
              </GText>
            </Animated.View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 90 : 110, // Reasonable space above bottom bar
    right: spacing.lg,
    zIndex: 9999,
  },
  fab: {
    backgroundColor: colors.primary[600],
    borderRadius: radius.pill,
    padding: spacing.sm,
    paddingRight: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: shadows.md.web?.boxShadow, transition: 'transform 0.1s ease' } as any,
      default: shadows.md
    }),
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    padding: 6,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: colors.error.main,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.primary[600],
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    lineHeight: 12,
  },
  toastTextContainer: {
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  },
});
