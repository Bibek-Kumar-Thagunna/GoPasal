import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../src/design-system/primitives/GText';
import { Card } from '../src/design-system/primitives/Card';
import { Badge } from '../src/design-system/primitives/Badge';
import { Button } from '../src/design-system/primitives/Button';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import { EmptyState } from '../src/components/StateViews';
import { useOffers } from '../src/services/hooks';
import { useTranslation } from '../src/i18n';
import { WebPageShell } from '../src/components/WebPageShell';

export default function OffersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: offers, isLoading } = useOffers();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <WebPageShell>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/' as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText variant="h2" color={colors.neutral[900]}>{t('offers.title')}</GText>
        <View style={{ width: 40 }} />
      </View>

      {!isLoading && (!offers || offers.length === 0) ? (
        <EmptyState icon="pricetag-outline" title={t('offers.none')} message={t('offers.noneMsg')} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {offers?.map((offer, i) => (
            <Animated.View key={offer.id} entering={FadeInDown.delay(i * 60).duration(300)}>
              <Card variant="elevated" style={styles.offerCard}>
                <View style={styles.offerBanner}>
                  <Ionicons name="pricetag" size={28} color="rgba(255,255,255,0.6)" />
                  <GText variant="h2" color="#FFFFFF">{offer.title}</GText>
                </View>
                <View style={styles.offerContent}>
                  <GText variant="body" color={colors.neutral[600]}>{offer.description}</GText>
                  <View style={styles.offerMeta}>
                    <Badge
                      label={offer.discountType === 'PERCENTAGE'
                        ? t('offers.percentOff', { discount: offer.discount })
                        : t('offers.rsOff', { discount: offer.discount })}
                      variant="discount"
                    />
                    {offer.code && (
                      <View style={styles.codeChip}>
                        <GText variant="caption" weight="bold" color={colors.primary[700]}>
                          {offer.code}
                        </GText>
                      </View>
                    )}
                  </View>
                  <GText variant="caption" color={colors.neutral[400]}>
                    {t('offers.validUntil', { date: new Date(offer.validUntil).toLocaleDateString() })}
                  </GText>
                </View>
              </Card>
            </Animated.View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      </WebPageShell>
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
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  offerCard: { overflow: 'hidden', padding: 0 },
  offerBanner: {
    backgroundColor: colors.primary[500], padding: spacing.xl,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  offerContent: { padding: spacing.lg, gap: spacing.sm },
  offerMeta: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  codeChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.primary[300], borderStyle: 'dashed',
  },
});
