import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Platform, useWindowDimensions, Image } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import { useCart, useNotifications } from '../services/hooks';
import { useAuthStore } from '../store/auth.store';
import { useLocationStore } from '../store/location.store';
import { GText } from './GText';
import { GoPasalBrandLogo } from './brand/GoPasalBrandLogo';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { useTranslation } from '../i18n';

export const WebHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: cart } = useCart();
  const { isAuthenticated } = useAuthStore();
  const { data: notifications } = useNotifications();
  const { addressLabel } = useLocationStore();
  const params = useLocalSearchParams<{ q?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.q || '');

  React.useEffect(() => {
    if (params.q !== undefined) {
      setSearchQuery(params.q);
    }
  }, [params.q]);
  const { width } = useWindowDimensions();
  const { t } = useTranslation();

  const unreadCount = notifications?.filter(n => !n.isRead)?.length || 0;

  if (Platform.OS !== 'web') return null;

  // Responsive breakpoints — collapse pieces as the viewport narrows.
  const showLocation = width >= 960;
  const showInlineSearch = width >= 720;
  const showActionLabels = width >= 600;

  const cartCount = cart?.items?.length || 0;

  // Header is always solid now that the hero uses a light background.
  const isTransparent = false;
  const opacity = 1;

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}` as any);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchQuery(text);
    if (pathname === '/search') {
      router.setParams({ q: text });
    }
  };

  const handleFocus = () => {
    if (pathname !== '/search') {
      router.push('/search' as any);
    }
  };

  // Dynamic colors based on transparent vs opaque state
  const textColor = isTransparent ? '#ffffff' : colors.neutral[900];
  const subtextColor = isTransparent ? 'rgba(255,255,255,0.75)' : colors.neutral[500];
  const iconColor = isTransparent ? '#ffffff' : colors.neutral[700];
  const searchBg = isTransparent ? 'rgba(255,255,255,0.2)' : colors.neutral[100];
  const searchBorder = isTransparent ? 'rgba(255,255,255,0.3)' : colors.neutral[200];
  const searchPlaceholder = isTransparent ? 'rgba(255,255,255,0.6)' : colors.neutral[400];
  const searchTextColor = isTransparent ? '#ffffff' : colors.neutral[900];

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: isTransparent
            ? 'transparent'
            : 'rgba(255, 255, 255, 0.85)',
          borderBottomColor: isTransparent
            ? 'transparent'
            : colors.neutral[150],
          // Shadow only when opaque
          boxShadow: isTransparent ? 'none' : '0 2px 12px rgba(0,0,0,0.05)',
        },
      ]}
    >
      <View style={styles.container}>
        {/* Logo */}
        <Pressable style={styles.brandBox} onPress={() => router.push('/')}>
          <GoPasalBrandLogo size={44} style={{ marginRight: 10 }} />
          <GText style={[styles.brandText, { color: textColor }]} weight="bold">GoPasal</GText>
        </Pressable>

        {/* Location Selector — Blinkit-style */}
        {showLocation && (
          <Pressable style={styles.locationBox} onPress={() => router.push('/location' as any)}>
            <View style={styles.locationTextCol}>
              <GText style={[styles.deliveryTime, { color: subtextColor }]} weight="medium">
                {t('header.deliverTo')}
              </GText>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color={textColor} />
                <GText style={[styles.addressText, { color: textColor }]} weight="semiBold" numberOfLines={1}>
                  {addressLabel || t('header.setLocation')}
                </GText>
                <Ionicons name="chevron-down" size={14} color={subtextColor} />
              </View>
            </View>
          </Pressable>
        )}

        {/* Search Bar */}
        {showInlineSearch ? (
          <View style={styles.searchContainer}>
            <View style={[styles.searchBox, { backgroundColor: searchBg, borderColor: searchBorder }]}>
              <Ionicons name="search" size={18} color={searchPlaceholder} />
              <TextInput
                style={[styles.searchInput, { color: searchTextColor }]}
                placeholder={t('header.searchPlaceholder')}
                placeholderTextColor={searchPlaceholder}
                value={searchQuery}
                onChangeText={handleTextChange}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                onFocus={handleFocus}
                autoFocus={pathname === '/search'}
              />
            </View>
          </View>
        ) : (
          <View style={styles.spacer} />
        )}

        {/* Right Actions */}
        <View style={styles.actionRow}>
          {/* Compact search icon when the inline bar is hidden */}
          {!showInlineSearch && (
            <Pressable style={styles.iconBtn} onPress={() => router.push('/search' as any)}>
              <Ionicons name="search" size={20} color={iconColor} />
            </Pressable>
          )}

          {/* Login / Profile */}
          <Pressable
            style={[styles.loginBtn, !showActionLabels && styles.iconBtn]}
            onPress={() =>
              isAuthenticated
                ? router.push('/(tabs)/profile' as any)
                : router.push('/(auth)/login' as any)
            }
          >
            <Feather name="user" size={18} color={iconColor} />
            {showActionLabels && (
              <GText style={[styles.loginText, { color: iconColor }]} weight="medium">
                {isAuthenticated ? t('common.profile') : t('common.login')}
              </GText>
            )}
          </Pressable>

          {/* Cart */}
          <Pressable
            style={[
              styles.cartBtn,
              !showActionLabels && styles.cartBtnCompact,
              isTransparent && styles.cartBtnOnHero,
            ]}
            onPress={() => router.push('/(tabs)/cart' as any)}
          >
            <Feather name="shopping-cart" size={18} color={isTransparent ? colors.primary[600] : '#fff'} />
            {showActionLabels && (
              <GText style={[styles.cartText, isTransparent && { color: colors.primary[700] }]} weight="bold">
                {cartCount > 0 ? t('header.itemsCount', { count: cartCount }) : t('header.myCart')}
              </GText>
            )}
            {!showActionLabels && cartCount > 0 && (
              <View style={styles.cartCountDot}>
                <GText style={styles.cartCountText} weight="bold">{cartCount}</GText>
              </View>
            )}
          </Pressable>

          {/* Notifications */}
          <Pressable
            style={[styles.iconBtn, { position: 'relative' }]}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={20} color={iconColor} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <GText style={styles.notificationBadgeText} weight="bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </GText>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[150],
    zIndex: 100,
    // @ts-ignore — web-only positioning & glassmorphism
    position: 'absolute' as any,
    top: 0,
    left: 0,
    right: 0,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    // Smooth transition
    transitionProperty: 'background-color, border-bottom-color, box-shadow',
    transitionDuration: '0.25s',
  } as any,
  container: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 64,
    gap: spacing.lg,
  },

  // Logo
  brandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    // Smooth transition
    transitionProperty: 'background-color',
    transitionDuration: '0.25s',
  } as any,
  logoLetter: {
    fontSize: 18,
    color: '#ffffff',
  },
  brandText: {
    fontSize: 23,
    letterSpacing: -0.6,
    // Smooth transition
    transitionProperty: 'color',
    transitionDuration: '0.25s',
  } as any,

  // Location
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    maxWidth: 220,
  },
  locationTextCol: {
    gap: 1,
  },
  deliveryTime: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addressText: {
    fontSize: 13,
    maxWidth: 180,
  },

  // Search
  searchContainer: {
    flex: 1,
    minWidth: 0,
    maxWidth: 500,
  },
  spacer: {
    flex: 1,
    minWidth: 0,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 42,
    gap: spacing.sm,
    borderWidth: 1,
    // Smooth transition
    transitionProperty: 'background-color, border-color',
    transitionDuration: '0.25s',
  } as any,
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter',
    outlineStyle: 'none',
  } as any,

  // Actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  loginText: {
    fontSize: 14,
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    height: 40,
  },
  cartText: {
    fontSize: 14,
    color: '#ffffff',
  },
  cartBtnOnHero: {
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
  },
  cartBtnCompact: {
    width: 40,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  cartCountDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.accent[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: {
    fontSize: 10,
    color: '#ffffff',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.accent[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  notificationBadgeText: {
    fontSize: 9,
    color: '#ffffff',
  },
});
