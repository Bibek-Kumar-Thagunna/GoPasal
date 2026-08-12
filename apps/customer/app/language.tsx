import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../src/design-system/primitives/GText';
import { Card } from '../src/design-system/primitives/Card';
import { colors } from '../src/design-system/tokens/colors';
import { spacing } from '../src/design-system/tokens/spacing';
import { useTranslation } from '../src/i18n';
import type { Language } from '../src/store/language.store';

const OPTIONS: { code: Language; labelKey: 'language.english' | 'language.nepali' }[] = [
  { code: 'en', labelKey: 'language.english' },
  { code: 'ne', labelKey: 'language.nepali' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText variant="h2" color={colors.neutral[900]}>{t('language.title')}</GText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card variant="elevated" padding="sm">
          {OPTIONS.map((opt, i) => {
            const active = language === opt.code;
            return (
              <Pressable
                key={opt.code}
                style={[styles.row, i < OPTIONS.length - 1 && styles.rowBorder]}
                onPress={() => {
                  setLanguage(opt.code);
                  router.back();
                }}
              >
                <GText variant="body" style={{ flex: 1 }} color={active ? colors.primary[700] : colors.neutral[900]}>
                  {t(opt.labelKey)}
                </GText>
                {active && (
                  <Ionicons name="checkmark" size={22} color={colors.primary[600]} />
                )}
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
  content: {
    paddingHorizontal: spacing.lg,
    ...(Platform.OS === 'web' && { maxWidth: 760, width: '100%', alignSelf: 'center' }),
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.lg, paddingHorizontal: spacing.md,
    ...Platform.select({ web: { cursor: 'pointer' as const }, default: {} }),
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
});
