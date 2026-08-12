import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { colors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { useTranslation, type TranslationKey } from '../i18n';

export interface LegalSection {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}

interface LegalScreenProps {
  titleKey: TranslationKey;
  introKey: TranslationKey;
  sections: LegalSection[];
  contactBodyKey: TranslationKey;
  lastUpdated: string;
}

export function LegalScreen({ titleKey, introKey, sections, contactBodyKey, lastUpdated }: LegalScreenProps) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText variant="h3" color={colors.neutral[900]}>{t(titleKey)}</GText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <GText variant="body" color={colors.neutral[600]} style={styles.intro}>
            {t(introKey)}
          </GText>

          {sections.map((section) => (
            <View key={section.titleKey} style={styles.section}>
              <GText variant="h4" color={colors.neutral[900]} style={styles.sectionTitle}>
                {t(section.titleKey)}
              </GText>
              <GText variant="body" color={colors.neutral[600]} style={styles.body}>
                {t(section.bodyKey)}
              </GText>
            </View>
          ))}

          <View style={styles.section}>
            <GText variant="h4" color={colors.neutral[900]} style={styles.sectionTitle}>
              {t('legal.contactTitle')}
            </GText>
            <GText variant="body" color={colors.neutral[600]} style={styles.body}>
              {t(contactBodyKey)}
            </GText>
          </View>

          <GText variant="caption" color={colors.neutral[400]} style={styles.updated}>
            {t('legal.lastUpdated', { date: lastUpdated })}
          </GText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.neutral[150],
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center',
  },
  scroll: { paddingBottom: spacing['4xl'] },
  container: {
    width: '100%', maxWidth: 760, alignSelf: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl,
  },
  intro: { lineHeight: 23, marginBottom: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: { marginBottom: spacing.sm },
  body: { lineHeight: 23 },
  updated: { marginTop: spacing.sm },
});
