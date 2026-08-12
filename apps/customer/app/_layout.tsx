import React, { useEffect, useCallback } from 'react';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AppProviders } from '../src/providers/AppProviders';
import { useAuthStore } from '../src/store/auth.store';
import { useLanguageStore } from '../src/store/language.store';
import { usePreferencesStore } from '../src/store/preferences.store';
import { colors } from '../src/design-system/tokens/colors';
import { Platform } from 'react-native';
import { WebSelectionGuard } from '@gopasal/ui';
import { GlobalCartToast } from '../src/components/GlobalCartToast';
import { GlobalToast } from '../src/components/GlobalToast';
import { usePushNotifications } from '../src/services/notifications/usePushNotifications';
import { useRealtimeNotifications } from '../src/services/hooks';
import { NetworkBanner } from '../src/components/useNetworkStatus';

import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'java.lang.reflect.InvocationTargetException',
  'Unable to activate keep awake'
]);

SplashScreen.preventAutoHideAsync();

function RealtimeNotificationsListener() {
  useRealtimeNotifications();
  return null;
}

const CUSTOMER_ROUTE_TITLES: Record<string, string> = {
  cart: "Shopping Cart — GoPasal",
  wishlist: "My Wishlist — GoPasal",
  orders: "My Orders & Tracking — GoPasal",
  categories: "Browse Categories — GoPasal",
  profile: "My Account & Settings — GoPasal",
  search: "Search Marketplace — GoPasal",
  shop: "Storefront & Catalog — GoPasal",
  product: "Product Details — GoPasal",
  checkout: "Secure Checkout — GoPasal",
  auth: "Customer Sign In — GoPasal",
};

export default function RootLayout() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const hydrateLanguage = useLanguageStore((s) => s.hydrate);
  const hydratePreferences = usePreferencesStore((s) => s.hydrate);
  const segments = useSegments();
  
  // Initialize Push Notifications
  usePushNotifications();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const activeSegment = segments[0] || '';
      const subSegment = segments[1] || '';
      const matchedKey = activeSegment === '(tabs)' ? subSegment : activeSegment;
      const pageTitle = CUSTOMER_ROUTE_TITLES[matchedKey] || "GoPasal — Nepal’s Hyperlocal Marketplace & Instant Delivery";
      document.title = pageTitle;

      const head = document.getElementsByTagName('head')[0];
      if (head) {
        const existingIcon = document.querySelector("link[rel~='icon']");
        if (existingIcon) {
          existingIcon.setAttribute('href', '/favicon.png');
        } else {
          const newIcon = document.createElement('link');
          newIcon.rel = 'icon';
          newIcon.href = '/favicon.png';
          head.appendChild(newIcon);
        }
      }
    }
  }, [segments]);

  const [fontsLoaded, fontError] = useFonts({
    Poppins: Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-ExtraBold': Poppins_800ExtraBold,
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    checkAuth();
    void hydrateLanguage();
    void hydratePreferences();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <WebSelectionGuard />
      <AppProviders>
        <StatusBar style={Platform.OS === 'web' ? 'dark' : 'light'} />
        <NetworkBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.surface.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'GoPasal — Nepal’s Hyperlocal Marketplace' }} />
          <Stack.Screen
            name="(auth)/login"
            options={{ presentation: 'modal', animation: 'slide_from_bottom', title: 'Sign In — GoPasal' }}
          />
          <Stack.Screen name="search" options={{ animation: 'fade', title: 'Search Products & Stores — GoPasal' }} />
          <Stack.Screen name="product/[id]" options={{ title: 'Product Details — GoPasal' }} />
          <Stack.Screen name="shop/[id]" options={{ title: 'Store Details — GoPasal' }} />
          <Stack.Screen name="checkout" options={{ title: 'Secure Checkout — GoPasal' }} />
          <Stack.Screen name="order/[id]" options={{ title: 'Order Tracking — GoPasal' }} />
          <Stack.Screen name="location" options={{ presentation: 'modal', title: 'Choose Delivery Area — GoPasal' }} />
          <Stack.Screen name="offers" options={{ title: 'Deals & Offers — GoPasal' }} />
          <Stack.Screen name="wishlist" options={{ title: 'Saved Items — GoPasal' }} />
          <Stack.Screen name="addresses" options={{ title: 'My Addresses — GoPasal' }} />
          <Stack.Screen name="address-new" options={{ title: 'Add New Address — GoPasal' }} />
          <Stack.Screen name="notifications" options={{ title: 'Notifications — GoPasal' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings — GoPasal' }} />
          <Stack.Screen name="language" options={{ title: 'Change Language — GoPasal' }} />
          <Stack.Screen name="about" options={{ title: 'About Us — GoPasal Nepal' }} />
          <Stack.Screen name="privacy" options={{ title: 'Privacy Policy — GoPasal' }} />
          <Stack.Screen name="terms" options={{ title: 'Terms & Conditions — GoPasal' }} />
          <Stack.Screen name="support" options={{ title: 'Help & Support — GoPasal' }} />
        </Stack>
        <RealtimeNotificationsListener />
        <GlobalCartToast />
        <GlobalToast />
      </AppProviders>
    </GestureHandlerRootView>
  );
}
