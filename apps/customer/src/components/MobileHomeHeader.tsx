import React from 'react';
import { View, StyleSheet, Pressable, Platform, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GText } from './GText';
import { SearchBar } from './SearchBar';
import { colors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { useLocationStore } from '../store/location.store';
import { useAuthStore } from '../store/auth.store';
import { useTranslation } from '../i18n';

export const MobileHomeHeader = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const customerLocation = useLocationStore((s) => s.location);
  const user = useAuthStore((s) => s.user);

  // Only render on mobile-sized screens
  if (width >= 768 || Platform.OS === 'web') {
    return null;
  }

  // Fallback string if location is empty or undefined
  const addressLine = customerLocation?.formattedAddress || customerLocation?.address || t('home.selectLocation');

  const deliveringTo = t('home.deliveringTo' as any);
  const deliveringToText = deliveringTo === 'home.deliveringTo' ? 'Delivering to' : deliveringTo;

  const searchPlaceholder = t('header.searchPlaceholder' as any);
  const searchPlaceholderText = searchPlaceholder === 'header.searchPlaceholder' ? 'Search "groceries and more"' : searchPlaceholder;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Row: Address and Profile */}
      <View style={styles.topRow}>
        <Pressable 
          style={styles.locationContainer} 
          onPress={() => router.push('/location' as any)}
        >
          <View style={styles.locationIconWrap}>
            <Ionicons name="location-sharp" size={18} color="#fff" />
          </View>
          <View style={styles.locationTextWrap}>
            <GText style={styles.deliveringTo} weight="bold">
              {deliveringToText}
            </GText>
            <View style={styles.addressRow}>
              <GText style={styles.addressText} numberOfLines={1}>
                {addressLine}
              </GText>
              <Ionicons name="chevron-down" size={14} color={colors.neutral[700]} />
            </View>
          </View>
        </Pressable>

        <Pressable 
          style={({ pressed }) => [
            styles.profileBtn,
            pressed && styles.profileBtnPressed
          ]}
          onPress={() => router.push('/(tabs)/profile' as any)}
        >
          <View style={styles.profileIconInner}>
            {user?.avatarUrl ? (
              <Image 
                source={{ uri: user.avatarUrl }}
                style={styles.profileAvatar}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person" size={22} color={colors.neutral[400]} />
            )}
          </View>
        </Pressable>
      </View>

      {/* Bottom Row: Search Bar */}
      <View style={styles.searchRow}>
        <SearchBar 
          editable={false} 
          onPress={() => router.push('/search' as any)}
          placeholder={searchPlaceholderText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[150],
    // A slight shadow helps it float over content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 100,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  locationIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  locationTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  deliveringTo: {
    fontSize: 12,
    color: colors.neutral[800],
    letterSpacing: 0.5,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: 14,
    color: colors.neutral[600],
    flexShrink: 1,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    // 3D effect borders
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderBottomWidth: 3,
    borderBottomColor: '#D1D5DB',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  profileBtnPressed: {
    borderBottomWidth: 1.5,
    transform: [{ translateY: 1.5 }],
    shadowOpacity: 0.08,
  },
  profileIconInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  searchRow: {
    width: '100%',
  },
});
