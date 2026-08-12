import { useEffect, useCallback, useSyncExternalStore } from 'react';
import { View, StyleSheet, Platform, Animated as RNAnimated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';

function getOnlineStatus(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function subscribeToOnline(cb: () => void): () => void {
  if (Platform.OS === 'web') {
    window.addEventListener('online', cb);
    window.addEventListener('offline', cb);
    return () => {
      window.removeEventListener('online', cb);
      window.removeEventListener('offline', cb);
    };
  }
  return () => {};
}

export function useNetworkStatus() {
  const isOnline = useSyncExternalStore(
    subscribeToOnline,
    getOnlineStatus,
    () => true
  );

  return { isOnline };
}

export function NetworkBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
      <RNAnimated.Text style={styles.bannerText}>
        No internet connection
      </RNAnimated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error.main,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  bannerText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#fff',
  },
});
