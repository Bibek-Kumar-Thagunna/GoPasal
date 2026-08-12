import React, { useEffect } from 'react';
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
import { useAuthStore } from '../src/store/auth.store';
import { WebSelectionGuard } from '@gopasal/ui';

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const root = segments[0];
    if (!root) return;
    const inAuthGroup = root === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(dashboard)');
    }
  }, [isAuthenticated, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

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
    checkAuth();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.surface.background }}>
      <WebSelectionGuard />
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AuthGuard>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(dashboard)" />
            <Stack.Screen name="orders" />
            <Stack.Screen name="disputes" />
            <Stack.Screen name="config" />
            <Stack.Screen name="analytics" />
          </Stack>
        </AuthGuard>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
