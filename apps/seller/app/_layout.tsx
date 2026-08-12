import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '../src/design-system/tokens/colors';
import { NetworkBanner } from '../src/components/useNetworkStatus';
import { useAuthStore } from '../src/store/auth.store';
import { hydrateRegistrationFlow } from '../src/store/registration-flow.store';
import { WebSelectionGuard } from '@gopasal/ui';
import {
  isOnboardingComplete,
  isSellerApproved,
  isSellerSuspended,
} from '../src/utils/store-onboarding';

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
    },
  },
});

import apiClient from '../src/services/api';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, sessionReady } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!sessionReady) return;

    const checkUserFlow = async () => {
      const inAuthGroup = segments[0] === '(auth)';
      const currentScreen = segments[1] as string | undefined;

      if (!isAuthenticated && !inAuthGroup) {
        router.replace('/(auth)/login');
        return;
      }

      if (!isAuthenticated) return;

      try {
        const { data } = await apiClient.get('/seller/stores/me');
        const storeRow = data?.data?.store as Record<string, unknown> | null | undefined;

        if (!data?.data?.hasStore || !storeRow) {
          if (currentScreen !== 'category-select' && currentScreen !== 'register') {
            router.replace('/(auth)/category-select' as any);
          }
          return;
        }

        if (isSellerSuspended(storeRow as { status?: string })) {
          if (currentScreen !== 'suspended') {
            router.replace('/(auth)/suspended' as any);
          }
          return;
        }

        const step = storeRow.verificationStep as string | undefined;
        const approved = isSellerApproved(
          storeRow as { verificationStep?: string; status?: string }
        );
        const setupDone = isOnboardingComplete(storeRow.metadata);

        if (step === 'PENDING_INFO' || step === 'PENDING_DOCS') {
          if (currentScreen !== 'kyc-resubmit' && currentScreen !== 'store-verification') {
            router.replace('/(auth)/kyc-resubmit' as any);
          }
          return;
        }

        if (
          step === 'PENDING_REVIEW' ||
          step === 'UNDER_REVIEW' ||
          (!approved && step !== 'REJECTED' && step !== 'APPROVED')
        ) {
          if (!approved) {
            if (currentScreen !== 'under-review') {
              router.replace('/(auth)/under-review' as any);
            }
            return;
          }
        }

        if (step === 'REJECTED' && !approved) {
          if (currentScreen !== 'kyc-resubmit') {
            router.replace('/(auth)/kyc-resubmit' as any);
          }
          return;
        }

        if (approved) {
          if (!setupDone) {
            if (currentScreen === 'under-review') {
              router.replace('/(auth)/approved' as any);
              return;
            }
            if (currentScreen !== 'store-setup' && currentScreen !== 'approved') {
              router.replace('/(auth)/store-setup' as any);
            }
            return;
          }

          if (inAuthGroup) {
            router.replace('/(tabs)');
            return;
          }
        } else if (inAuthGroup && currentScreen !== 'under-review') {
          router.replace('/(auth)/under-review' as any);
        }
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          router.replace('/(auth)/login');
          return;
        }
        if (!inAuthGroup && status !== undefined && status >= 500) {
          return;
        }
        if (currentScreen !== 'register' && currentScreen !== 'login') {
          router.replace('/(auth)/login');
        }
      }
    };

    void checkUserFlow();
  }, [isAuthenticated, sessionReady, segments]);

  return <>{children}</>;
}

import { usePushNotifications } from '../src/services/notifications/usePushNotifications';

const SELLER_ROUTE_TITLES: Record<string, string> = {
  orders: "Orders & Fulfillment — GoPasal Seller Central",
  products: "Product Catalog & Inventory — GoPasal Seller Central",
  inventory: "Inventory Management — GoPasal Seller Central",
  earnings: "Financial Overview & Payouts — GoPasal Seller Central",
  analytics: "Store Analytics & Performance — GoPasal Seller Central",
  customers: "Customer Directory — GoPasal Seller Central",
  settings: "Store Settings — GoPasal Seller Central",
  profile: "Merchant Profile — GoPasal Seller Central",
  delivery: "Delivery & Logistics — GoPasal Seller Central",
  "shop-tier": "Merchant Tier & Subscriptions — GoPasal Seller Central",
  "store-setup": "Store Setup & KYC Verification — GoPasal Seller Central",
  "under-review": "Store Application Under Review — GoPasal Seller Central",
  login: "Merchant Sign In — GoPasal Seller Central",
  register: "Merchant Registration — GoPasal Seller Central",
};

export default function RootLayout() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const segments = useSegments();
  
  // Initialize Push Notifications
  usePushNotifications();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const activeSegment = segments[0] || '';
      const subSegment = segments[1] || '';
      const matchedKey = activeSegment === '(tabs)' || activeSegment === '(auth)' ? subSegment : activeSegment;
      const pageTitle = SELLER_ROUTE_TITLES[matchedKey] || "GoPasal Seller Central — Merchant Hub & Store Management";
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

  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-ExtraBold': Poppins_800ExtraBold,
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  useEffect(() => {
    void hydrateRegistrationFlow();
    checkAuth();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface.background }}>
      <NetworkBanner />
      <WebSelectionGuard />
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ title: 'Merchant Portal — GoPasal' }} />
            <Stack.Screen name="(tabs)" options={{ title: 'GoPasal Merchant Hub — Seller Dashboard' }} />
            <Stack.Screen name="store-setup" options={{ title: 'Store Setup & Onboarding — GoPasal' }} />
            <Stack.Screen name="order/[id]" options={{ title: 'Order Fulfillment — GoPasal Seller' }} />
            <Stack.Screen name="product/[id]" options={{ title: 'Product Overview — GoPasal Seller' }} />
            <Stack.Screen name="product/new" options={{ title: 'Add New Product — GoPasal Seller' }} />
            <Stack.Screen name="product/edit" options={{ title: 'Edit Product — GoPasal Seller' }} />
            <Stack.Screen name="delivery" options={{ title: 'Delivery Settings — GoPasal Seller' }} />
            <Stack.Screen name="shop-tier" options={{ title: 'Merchant Tier & Plan — GoPasal' }} />
          </Stack>
        </AuthGuard>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
