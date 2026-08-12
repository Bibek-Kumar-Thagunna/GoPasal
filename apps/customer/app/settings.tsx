import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../src/design-system/primitives/GText';
import { Card } from '../src/design-system/primitives/Card';
import { colors } from '../src/design-system/tokens/colors';
import { spacing } from '../src/design-system/tokens/spacing';
import { useTranslation } from '../src/i18n';
import { usePreferencesStore } from '../src/store/preferences.store';

type SettingRow =
  | { key: 'notifications'; type: 'toggle'; icon: keyof typeof Ionicons.glyphMap; labelKey: 'settings.pushNotifications' }
  | { key: 'language'; type: 'nav'; icon: keyof typeof Ionicons.glyphMap; labelKey: 'settings.language'; route: '/language' }
  | { key: 'privacy'; type: 'nav'; icon: keyof typeof Ionicons.glyphMap; labelKey: 'settings.privacyPolicy'; route: '/privacy' }
  | { key: 'terms'; type: 'nav'; icon: keyof typeof Ionicons.glyphMap; labelKey: 'settings.terms'; route: '/terms' }
  | { key: 'about'; type: 'nav'; icon: keyof typeof Ionicons.glyphMap; labelKey: 'settings.about'; route: '/about' };

const SETTINGS: SettingRow[] = [
  { key: 'notifications', type: 'toggle', icon: 'notifications-outline', labelKey: 'settings.pushNotifications' },
  { key: 'language', type: 'nav', icon: 'language-outline', labelKey: 'settings.language', route: '/language' },
  { key: 'privacy', type: 'nav', icon: 'shield-outline', labelKey: 'settings.privacyPolicy', route: '/privacy' },
  { key: 'terms', type: 'nav', icon: 'document-text-outline', labelKey: 'settings.terms', route: '/terms' },
  { key: 'about', type: 'nav', icon: 'information-circle-outline', labelKey: 'settings.about', route: '/about' },
];

function SettingIcon({ name }: { name: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.settingIcon}>
      <Ionicons name={name} size={20} color={colors.primary[600]} />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const pushEnabled = usePreferencesStore((s) => s.pushEnabled);
  const setPushEnabled = usePreferencesStore((s) => s.setPushEnabled);

  const languageLabel = language === 'ne' ? t('language.nepaliShort') : t('language.englishShort');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/' as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText variant="h2" color={colors.neutral[900]}>{t('settings.title')}</GText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="elevated" padding="sm">
          {SETTINGS.map((item, i) => {
            const borderStyle = i < SETTINGS.length - 1 ? styles.settingBorder : undefined;

            if (item.type === 'toggle') {
              return (
                <View key={item.key} style={[styles.settingItem, borderStyle]}>
                  <SettingIcon name={item.icon} />
                  <GText variant="body" style={{ flex: 1 }}>{t(item.labelKey)}</GText>
                  <Switch
                    value={pushEnabled}
                    onValueChange={setPushEnabled}
                    trackColor={{ true: colors.primary[500], false: colors.neutral[200] }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              );
            }

            return (
              <Pressable
                key={item.key}
                style={[styles.settingItem, styles.navItem, borderStyle]}
                onPress={() => router.push(item.route)}
                accessibilityRole="button"
              >
                <SettingIcon name={item.icon} />
                <GText variant="body" style={{ flex: 1 }}>{t(item.labelKey)}</GText>
                <View style={styles.navTrailing}>
                  {item.key === 'language' && (
                    <GText variant="bodySm" color={colors.neutral[400]}>{languageLabel}</GText>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} />
                </View>
              </Pressable>
            );
          })}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.lg, ...(Platform.OS === 'web' && { maxWidth: 760, width: '100%', alignSelf: 'center' }) },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.md,
  },
  navItem: Platform.select({
    web: { cursor: 'pointer' as const },
    default: {},
  }),
  settingBorder: { borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  settingIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.mint[50], alignItems: 'center', justifyContent: 'center',
  },
  navTrailing: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
