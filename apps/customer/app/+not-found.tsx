import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GText } from '../src/design-system/primitives/GText';
import { Button } from '../src/design-system/primitives/Button';
import { colors } from '../src/design-system/tokens/colors';
import { spacing } from '../src/design-system/tokens/spacing';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../src/i18n';

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="compass-outline" size={40} color={colors.primary[400]} />
      </View>
      <GText variant="h2" align="center" color={colors.neutral[800]}>
        {t('notFound.title')}
      </GText>
      <GText variant="body" align="center" color={colors.neutral[500]}>
        {t('notFound.message')}
      </GText>
      <Button label={t('notFound.goHome')} onPress={() => router.replace('/(tabs)')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface.background,
    gap: spacing.lg, padding: spacing['3xl'],
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.mint[100],
    alignItems: 'center', justifyContent: 'center',
  },
});
