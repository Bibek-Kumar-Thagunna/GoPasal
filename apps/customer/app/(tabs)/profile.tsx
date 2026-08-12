import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../../src/design-system/primitives/GText';
import { Card } from '../../src/design-system/primitives/Card';
import { Avatar } from '../../src/design-system/primitives/Badge';
import { Button } from '../../src/design-system/primitives/Button';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import { Platform } from 'react-native';
import { useCurrentUser, useLogout, useUpdateProfile } from '../../src/services/hooks';
import { useAuthStore } from '../../src/store/auth.store';
import { useTranslation, type TranslationKey } from '../../src/i18n';
import Constants from 'expo-constants';

const MENU_ITEMS: { key: string; labelKey: TranslationKey; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { key: 'orders', labelKey: 'profile.myOrders', icon: 'receipt-outline', route: '/(tabs)/orders' },
  { key: 'addresses', labelKey: 'profile.savedAddresses', icon: 'location-outline', route: '/addresses' },
  { key: 'wishlist', labelKey: 'profile.wishlist', icon: 'heart-outline', route: '/wishlist' },
  { key: 'membership', labelKey: 'profile.gold', icon: 'star-outline', route: '/membership' },
  { key: 'notifications', labelKey: 'profile.notifications', icon: 'notifications-outline', route: '/notifications' },
  { key: 'offers', labelKey: 'profile.offers', icon: 'pricetag-outline', route: '/offers' },
  { key: 'settings', labelKey: 'profile.settings', icon: 'settings-outline', route: '/settings' },
  { key: 'support', labelKey: 'profile.helpSupport', icon: 'help-circle-outline', route: '/support' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: fetchedUser } = useCurrentUser();
  const user = fetchedUser ?? authUser;
  const logout = useLogout();
  const updateProfile = useUpdateProfile();

  const displayName =
    user?.name?.trim() ||
    (isAuthenticated && user?.phone ? user.phone : t('profile.guestUser'));
  const displaySubtitle = isAuthenticated
    ? user?.name?.trim()
      ? user.phone
      : t('profile.tapToAddName')
    : t('profile.signInToContinue');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const appVersion = Constants.expoConfig?.version ?? '2.0.0';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card variant="elevated" style={styles.profileCard}>
            <Avatar name={displayName} size={56} />
            <View style={styles.profileInfo}>
              <GText variant="h3" color={colors.neutral[900]}>
                {displayName}
              </GText>
              <GText variant="bodySm" color={colors.neutral[500]}>
                {displaySubtitle}
              </GText>
            </View>
            {isAuthenticated && user && (
              <Pressable
                style={styles.editBtn}
                onPress={() => {
                  setEditName(user.name ?? '');
                  setEditOpen(true);
                }}
              >
                <Ionicons name="create-outline" size={20} color={colors.primary[600]} />
              </Pressable>
            )}
          </Card>
        </Animated.View>

        {!isAuthenticated && (
          <Animated.View entering={FadeInDown.delay(60).duration(300)}>
            <Button
              label={t('profile.signIn')}
              fullWidth
              size="lg"
              onPress={() => router.push('/(auth)/login')}
            />
          </Animated.View>
        )}

        {/* Menu items */}
        <Animated.View entering={FadeInDown.delay(120).duration(300)}>
          <Card variant="elevated" padding="sm" style={styles.menuCard}>
            {MENU_ITEMS.map((item, i) => (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.route as any)}
                style={[
                  styles.menuItem,
                  i < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                ]}
              >
                <View style={[styles.menuIcon, item.key === 'membership' && styles.menuIconGold]}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.key === 'membership' ? colors.gold[600] : colors.primary[600]}
                  />
                </View>
                <GText variant="body" color={colors.neutral[800]} style={{ flex: 1 }}>
                  {t(item.labelKey)}
                </GText>
                <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
              </Pressable>
            ))}
          </Card>
        </Animated.View>

        {/* Logout */}
        {isAuthenticated && (
          <Animated.View entering={FadeInDown.delay(180).duration(300)}>
            <Button
              label={t('profile.signOut')}
              variant="outline"
              fullWidth
              onPress={() => {
                logout.mutate();
                router.replace('/(tabs)');
              }}
              icon={<Ionicons name="log-out-outline" size={18} color={colors.primary[600]} />}
            />
          </Animated.View>
        )}

        {/* App info */}
        <View style={styles.appInfo}>
          <GText variant="caption" color={colors.neutral[400]} align="center">
            {t('profile.appInfo', { version: appVersion })}
          </GText>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={editOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <GText variant="h3">{t('profile.editProfile')}</GText>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('profile.yourName')}
              placeholderTextColor={colors.neutral[400]}
            />
            <View style={styles.modalActions}>
              <Button label={t('common.cancel')} variant="outline" onPress={() => setEditOpen(false)} />
              <Button
                label={t('common.save')}
                loading={updateProfile.isPending}
                onPress={() => {
                  if (editName.trim().length < 2) return;
                  updateProfile.mutate(
                    { name: editName.trim() },
                    { onSuccess: () => setEditOpen(false) }
                  );
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  content: {
    paddingHorizontal: spacing.lg, gap: spacing.xl,
    paddingTop: Platform.OS === 'web' ? spacing.xl : spacing.lg,
    ...(Platform.OS === 'web' && { maxWidth: 800, width: '100%', alignSelf: 'center' }),
  },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
  },
  profileInfo: { flex: 1, gap: 2 },
  editBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.mint[100],
    alignItems: 'center', justifyContent: 'center',
  },
  menuCard: { gap: 0 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
  },
  menuIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.mint[50],
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconGold: {
    backgroundColor: colors.gold[50],
  },
  appInfo: { paddingVertical: spacing.xl },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    width: '100%',
    maxWidth: 400,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.neutral[900],
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
});
