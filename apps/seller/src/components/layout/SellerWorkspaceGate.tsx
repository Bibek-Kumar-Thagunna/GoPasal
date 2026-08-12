import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../design-system/tokens/colors';
import { useAuthStore } from '../../store/auth.store';
import { useSellerWorkspace } from '../../hooks/useSellerWorkspace';

export function SellerWorkspaceGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const { isLoading, payload } = useSellerWorkspace();
  const hasStore = payload?.hasStore === true;

  useEffect(() => {
    if (!sessionReady || isLoading) return;
    if (!hasStore) {
      router.replace('/(auth)/category-select');
    }
  }, [sessionReady, isLoading, hasStore, router]);

  if (!sessionReady || isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  if (!hasStore) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.background,
  },
});
