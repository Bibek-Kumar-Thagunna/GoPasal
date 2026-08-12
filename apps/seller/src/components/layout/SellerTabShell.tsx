import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  Modal,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../design-system/tokens/colors';
import { spacing, radius } from '../../design-system/tokens/spacing';
import { useLanguageStore } from '../../store/language.store';
import { useAuthStore } from '../../store/auth.store';
import apiClient from '../../services/api';
import { useSellerWorkspace } from '../../hooks/useSellerWorkspace';
import { GoPasalLogo } from '../illustrations/GoPasalLogo';

const SIDEBAR_W = 280;
const PRIMARY_SIDEBAR = '#0B3D2E';
const SIDEBAR_ACTIVE = 'rgba(56, 189, 129, 0.22)';

type TabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
};

const ALL_ROUTES: {
  name: string;
  titleKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: 'orders' | 'products' | 'inventory';
}[] = [
  { name: 'index', titleKey: 'nav.dashboard', icon: 'grid-outline' },
  { name: 'orders', titleKey: 'nav.orders', icon: 'bag-handle-outline', badge: 'orders' },
  { name: 'products', titleKey: 'nav.products', icon: 'cube-outline', badge: 'products' },
  { name: 'inventory', titleKey: 'nav.inventory', icon: 'layers-outline', badge: 'inventory' },
  { name: 'customers', titleKey: 'nav.customers', icon: 'people-outline' },
  { name: 'analytics', titleKey: 'nav.analytics', icon: 'bar-chart-outline' },
  { name: 'earnings', titleKey: 'nav.earnings', icon: 'wallet-outline' },
  { name: 'promotions', titleKey: 'nav.promotions', icon: 'pricetag-outline' },
  { name: 'reviews', titleKey: 'nav.reviews', icon: 'star-outline' },
  { name: 'settings', titleKey: 'nav.settings', icon: 'settings-outline' },
];

function NavItem({
  label,
  icon,
  focused,
  onPress,
  badge,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  onPress: () => void;
  badge?: number;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.navRow, focused && styles.navRowActive]}>
      <Ionicons name={icon} size={22} color={focused ? '#fff' : 'rgba(255,255,255,0.65)'} />
      <Animated.Text style={[styles.navLabel, focused && styles.navLabelActive]} numberOfLines={1}>
        {label}
      </Animated.Text>
      {badge != null && badge > 0 ? (
        <View style={styles.badge}>
          <Animated.Text style={styles.badgeTxt}>{badge > 99 ? '99+' : badge}</Animated.Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function SellerTabShell({ state, descriptors, navigation }: TabBarProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { t } = useLanguageStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout, switchSellerStore } = useAuthStore();
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const { store, stores, activeStoreId, hasPermission, accessRole } = useSellerWorkspace();

  const routeVisibility = useMemo(() => {
    const can = hasPermission;
    const owner = accessRole === 'OWNER';
    return {
      index: can('analytics.view') || can('orders.view'),
      orders: can('orders.view'),
      products: can('products.view'),
      inventory: can('products.view'),
      customers: can('orders.view'),
      analytics: can('analytics.view'),
      earnings: owner,
      promotions: can('promotions.manage'),
      reviews: can('orders.view'),
      settings: true,
    } as Record<string, boolean>;
  }, [hasPermission, accessRole]);

  const sidebarRoutes = useMemo(
    () => ALL_ROUTES.filter((d) => routeVisibility[d.name]),
    [routeVisibility]
  );

  const mobileTabs = useMemo(() => {
    const base = ['index', 'orders', 'products'].filter((id) => routeVisibility[id]);
    return base.length > 0 ? base : ['index'];
  }, [routeVisibility]);

  const handleSwitchBranch = useCallback(
    async (storeId: string) => {
      if (storeId === activeStoreId) {
        setBranchOpen(false);
        return;
      }
      await switchSellerStore(storeId);
      await qc.invalidateQueries();
      setBranchOpen(false);
    },
    [activeStoreId, qc, switchSellerStore]
  );

  const { data: statsPayload } = useQuery({
    queryKey: ['seller-stats', activeStoreId],
    queryFn: async () => (await apiClient.get('/seller/stats')).data?.data,
    staleTime: 30_000,
    enabled: !!activeStoreId && hasPermission('analytics.view'),
  });

  const counts = statsPayload as
    | { pendingOrders?: number; totalProducts?: number; lowStock?: unknown[] }
    | undefined;

  const ordersBadge = counts?.pendingOrders ?? 0;
  const productsBadge = counts?.totalProducts ?? 0;
  const lowStockN = Array.isArray(counts?.lowStock) ? counts.lowStock.length : 0;

  const badgeFor = (key: string | undefined) => {
    if (key === 'orders') return ordersBadge;
    if (key === 'products') return productsBadge;
    if (key === 'inventory') return lowStockN;
    return 0;
  };

  const handleTabPress = useCallback(
    (route: any, isFocused: boolean) => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
    },
    [navigation]
  );

  const handleLogout = async () => {
    setDrawerOpen(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const renderSidebarBody = (onPick?: () => void) => (
    <>
      <View style={styles.brandRow}>
        <GoPasalLogo size={34} color="#FFFFFF" />
        <View style={styles.brandWordRow}>
          <Animated.Text style={styles.brandGo}>Go</Animated.Text>
          <Animated.Text style={styles.brandPasal}>Pasal</Animated.Text>
        </View>
      </View>

      <Pressable
        style={styles.storeCard}
        disabled={stores.length <= 1}
        onPress={() => stores.length > 1 && setBranchOpen(true)}
      >
        <Image
          source={{
            uri: (store as { logoUrl?: string })?.logoUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(String((store as { name?: string })?.name || 'S'))}&background=fff&color=0B3D2E`,
          }}
          style={styles.storeAvatar}
        />
        <View style={{ flex: 1 }}>
          <Animated.Text style={styles.storeName} numberOfLines={1}>
            {String((store as { name?: string })?.name || 'Your store')}
          </Animated.Text>
          <Animated.Text style={styles.storeLoc} numberOfLines={1}>
            {(store as { address?: string })?.address || t('seller.setAddressHint')}
            {stores.length > 1 ? ` · ${stores.length} locations` : ''}
          </Animated.Text>
        </View>
        <Ionicons
          name={stores.length > 1 ? 'chevron-down' : 'business-outline'}
          size={18}
          color="rgba(255,255,255,0.5)"
        />
      </Pressable>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.sm, gap: 4 }}>
        {sidebarRoutes.map((def) => {
          const route = state.routes.find((r: any) => r.name === def.name);
          if (!route) return null;
          const isFocused = state.index === state.routes.indexOf(route);
          const label = t(def.titleKey);
          return (
            <NavItem
              key={def.name}
              label={label}
              icon={def.icon}
              focused={isFocused}
              badge={def.badge ? badgeFor(def.badge) : undefined}
              onPress={() => {
                handleTabPress(route, isFocused);
                onPick?.();
              }}
            />
          );
        })}
      </ScrollView>

      <Pressable
        style={styles.supportCard}
        onPress={() => void Linking.openURL('mailto:support@gopasal.com?subject=Seller%20support')}
      >
        <Ionicons name="headset-outline" size={20} color={colors.primary[200]} />
        <View style={{ flex: 1 }}>
          <Animated.Text style={styles.supportTitle}>{t('seller.needHelp')}</Animated.Text>
          <Animated.Text style={styles.supportSub}>{t('seller.contactSupport')}</Animated.Text>
        </View>
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="power-outline" size={20} color="#FCA5A5" />
        <Animated.Text style={styles.logoutTxt}>{t('nav.logout')}</Animated.Text>
      </Pressable>
    </>
  );

  if (isDesktop) {
    return (
      <>
        <Modal visible={branchOpen} transparent animationType="fade" onRequestClose={() => setBranchOpen(false)}>
          <Pressable style={styles.branchOverlay} onPress={() => setBranchOpen(false)}>
            <Pressable style={styles.branchCard} onPress={(e) => e.stopPropagation()}>
              <Animated.Text style={styles.branchTitle}>Switch location</Animated.Text>
              {stores.map((s) => (
                <Pressable
                  key={String(s.id)}
                  style={[styles.branchRow, s.id === activeStoreId && styles.branchRowOn]}
                  onPress={() => handleSwitchBranch(String(s.id))}
                >
                  <Ionicons
                    name={s.id === activeStoreId ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={s.id === activeStoreId ? colors.primary[300] : 'rgba(255,255,255,0.4)'}
                  />
                  <View style={{ flex: 1 }}>
                    <Animated.Text style={styles.branchName}>{String(s.name || 'Store')}</Animated.Text>
                    {s.parentStoreId ? (
                      <Animated.Text style={styles.branchSub}>Branch</Animated.Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
        <View style={[styles.sidebar, { paddingTop: insets.top + spacing.md }]}>
          {renderSidebarBody()}
        </View>
      </>
    );
  }

  return (
    <>
      <Modal visible={branchOpen} transparent animationType="fade" onRequestClose={() => setBranchOpen(false)}>
        <Pressable style={styles.branchOverlay} onPress={() => setBranchOpen(false)}>
          <Pressable style={styles.branchCard} onPress={(e) => e.stopPropagation()}>
            <Animated.Text style={styles.branchTitle}>Switch location</Animated.Text>
            {stores.map((s) => (
              <Pressable
                key={String(s.id)}
                style={[styles.branchRow, s.id === activeStoreId && styles.branchRowOn]}
                onPress={() => handleSwitchBranch(String(s.id))}
              >
                <Ionicons
                  name={s.id === activeStoreId ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={s.id === activeStoreId ? colors.primary[300] : 'rgba(255,255,255,0.4)'}
                />
                <View style={{ flex: 1 }}>
                  <Animated.Text style={styles.branchName}>{String(s.name || 'Store')}</Animated.Text>
                </View>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={drawerOpen} animationType="fade" transparent onRequestClose={() => setDrawerOpen(false)}>
        <Pressable style={styles.drawerBackdrop} onPress={() => setDrawerOpen(false)}>
          <Animated.View
            entering={SlideInLeft.duration(220)}
            style={styles.drawerPanel}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.sidebar, { position: 'relative', width: SIDEBAR_W, flex: 1, paddingTop: insets.top + spacing.md }]}>
              {renderSidebarBody(() => setDrawerOpen(false))}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

      <View style={[styles.mobileBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable style={styles.menuFab} onPress={() => setDrawerOpen(true)}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </Pressable>
        {state.routes
          .filter((r: any) => mobileTabs.includes(r.name))
          .map((route: any) => {
            const isFocused = state.index === state.routes.indexOf(route);
            const { options } = descriptors[route.key];
            const label = options.title || route.name;
            return (
              <Pressable key={route.key} style={styles.mobileTabItem} onPress={() => handleTabPress(route, isFocused)}>
                {options.tabBarIcon &&
                  options.tabBarIcon({
                    color: isFocused ? colors.primary[500] : colors.neutral[400],
                    size: 24,
                  })}
                <Animated.Text style={[styles.mobileTabLabel, isFocused && styles.mobileTabLabelActive]}>{label}</Animated.Text>
              </Pressable>
            );
          })}
        <Pressable
          style={styles.mobileTabItem}
          onPress={() => {
            setDrawerOpen(true);
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.neutral[400]} />
          <Animated.Text style={styles.mobileTabLabel}>{t('nav.more')}</Animated.Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_W,
    backgroundColor: PRIMARY_SIDEBAR,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandWordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandGo: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 21,
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  brandPasal: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 24,
    color: '#fff',
    letterSpacing: -1.1,
    marginLeft: 1,
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  storeAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff' },
  storeName: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#fff' },
  storeLoc: { fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.lg,
  },
  navRowActive: { backgroundColor: SIDEBAR_ACTIVE },
  navLabel: { flex: 1, fontFamily: 'Inter-Medium', fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  navLabelActive: { color: '#fff', fontFamily: 'Inter-SemiBold' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeTxt: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: '#fff' },

  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  supportTitle: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#fff' },
  supportSub: { fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  logoutTxt: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#FCA5A5' },

  drawerBackdrop: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawerPanel: { width: SIDEBAR_W, maxWidth: '88%', height: '100%' },

  mobileBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[150],
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    ...Platform.select({
      web: { boxShadow: '0 -4px 24px rgba(15,23,42,0.06)' } as any,
      default: {},
    }),
  },
  menuFab: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  mobileTabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  mobileTabLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 4,
  },
  mobileTabLabelActive: { color: colors.primary[600], fontFamily: 'Inter-SemiBold' },

  branchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  branchCard: {
    backgroundColor: '#0f291f',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  branchTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
    marginBottom: spacing.sm,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  branchRowOn: { backgroundColor: 'rgba(56, 189, 129, 0.15)' },
  branchName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#fff' },
  branchSub: { fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
});
