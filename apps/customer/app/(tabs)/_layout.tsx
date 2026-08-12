import React from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { View, Platform } from 'react-native';
import { BottomDock } from '../../src/components/FloatingTabBar';
import { WebHeader } from '../../src/components/WebHeader';
import { useCart } from '../../src/services/hooks';
import { colors } from '../../src/design-system/tokens/colors';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: cart } = useCart();

  const cartCount = cart?.items?.length ?? 0;

  const getActiveTab = () => {
    if (pathname === '/' || pathname === '/index') return 'index';
    const tab = pathname.replace('/', '');
    return tab || 'index';
  };

  // The web header is fixed (absolute) and 64px tall. The home page renders a
  // full-bleed hero behind it, but every other tab must start below it.
  const isHomePage = pathname === '/' || pathname === '/index' || pathname === '/(tabs)';
  const webTopInset = Platform.OS === 'web' && !isHomePage ? 64 : 0;

  return (
    <View style={{ flex: 1, flexDirection: 'column', backgroundColor: colors.surface.background }}>
      {/* Content fills the entire area — header overlays on top */}
      <View style={{ flex: 1, paddingTop: webTopInset }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        >
          <Tabs.Screen name="index" options={{ title: 'GoPasal — Nepal’s Hyperlocal Marketplace' }} />
          <Tabs.Screen name="categories" options={{ title: 'All Categories — GoPasal' }} />
          <Tabs.Screen name="cart" options={{ title: 'Shopping Cart — GoPasal' }} />
          <Tabs.Screen name="orders" options={{ title: 'My Orders — GoPasal' }} />
          <Tabs.Screen name="profile" options={{ title: 'My Account — GoPasal' }} />
        </Tabs>
      </View>

      {/* Web header — positioned absolute, overlays the content */}
      {Platform.OS === 'web' && <WebHeader />}

      {/* Mobile bottom dock — hidden on web (web uses top header) */}
      {Platform.OS !== 'web' && (
        <BottomDock
          activeTab={getActiveTab()}
          cartCount={cartCount}
          onTabPress={(key) => {
            if (key === 'index') router.push('/(tabs)');
            else router.push(`/(tabs)/${key}` as any);
          }}
        />
      )}
    </View>
  );
}
