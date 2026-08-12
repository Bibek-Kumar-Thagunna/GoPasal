import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform, Linking, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../src/design-system/primitives/GText';
import { GoPasalBrandLogo } from '../src/components/brand/GoPasalBrandLogo';
import { Card } from '../src/design-system/primitives/Card';
import { Button } from '../src/design-system/primitives/Button';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import { useTranslation } from '../src/i18n';

const SUPPORT_EMAIL = 'support@gopasal.com';

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const version = Constants.expoConfig?.version ?? '2.0.0';

  const howSteps: ('about.how1' | 'about.how2' | 'about.how3' | 'about.how4')[] = [
    'about.how1',
    'about.how2',
    'about.how3',
    'about.how4',
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/' as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText variant="h3" color={colors.neutral[900]}>{t('about.title')}</GText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Brand hero */}
          <View style={styles.hero}>
            <GoPasalBrandLogo size={80} style={{ marginBottom: spacing.xs }} />
            <GText variant="h1" color={colors.neutral[900]} align="center">GoPasal</GText>
            <GText variant="body" color={colors.neutral[500]} align="center">{t('about.tagline')}</GText>
            <View style={styles.versionPill}>
              <GText variant="caption" weight="semibold" color={colors.primary[700]}>
                {t('about.version', { version })}
              </GText>
            </View>
          </View>

          {/* Mission */}
          <Card variant="elevated" style={styles.card}>
            <GText variant="h4" color={colors.neutral[900]}>{t('about.missionTitle')}</GText>
            <GText variant="body" color={colors.neutral[600]} style={styles.body}>
              {t('about.missionBody')}
            </GText>
          </Card>

          {/* What makes us different */}
          <Card variant="elevated" style={styles.card}>
            <GText variant="h4" color={colors.neutral[900]}>{t('about.differentTitle')}</GText>
            <GText variant="body" color={colors.neutral[600]} style={styles.body}>
              {t('about.differentBody')}
            </GText>
          </Card>

          {/* How it works */}
          <Card variant="elevated" style={styles.card}>
            <GText variant="h4" color={colors.neutral[900]}>{t('about.howTitle')}</GText>
            <View style={styles.steps}>
              {howSteps.map((key, i) => (
                <View key={key} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <GText variant="bodySm" weight="bold" color="#fff">{i + 1}</GText>
                  </View>
                  <GText variant="body" color={colors.neutral[600]} style={{ flex: 1 }}>
                    {t(key)}
                  </GText>
                </View>
              ))}
            </View>
          </Card>

          {/* Leadership & Founders */}
          <Card variant="elevated" style={styles.card}>
            <GText variant="h4" color={colors.neutral[900]}>Leadership & Founders</GText>
            <GText variant="body" color={colors.neutral[600]} style={styles.body}>
              GoPasal was founded with a mission to empower local businesses across Nepal through cutting-edge hyperlocal technology.
            </GText>
            <View style={{ gap: spacing.md, marginTop: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.neutral[50], borderRadius: radius.lg }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={22} color={colors.primary[700]} />
                </View>
                <View style={{ flex: 1 }}>
                  <GText variant="body" weight="bold" color={colors.neutral[900]}>Bibek Kumar Thagunna</GText>
                  <GText variant="caption" color={colors.neutral[500]}>Co-Founder & Executive Director</GText>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.neutral[50], borderRadius: radius.lg }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={22} color={colors.primary[700]} />
                </View>
                <View style={{ flex: 1 }}>
                  <GText variant="body" weight="bold" color={colors.neutral[900]}>Suyogya Sedhai</GText>
                  <GText variant="caption" color={colors.neutral[500]}>Co-Founder & Operations Director</GText>
                </View>
              </View>
            </View>
          </Card>

          {/* Technology & Engineering Partner */}
          <Card variant="elevated" style={[styles.card, { borderColor: colors.primary[200], borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Ionicons name="hardware-chip-outline" size={22} color={colors.primary[600]} />
              <GText variant="h4" color={colors.neutral[900]}>Engineering & Architecture</GText>
            </View>
            <GText variant="body" color={colors.neutral[600]} style={styles.body}>
              All technical systems, cloud infrastructure, real-time microservices, and end-to-end software architecture for the GoPasal ecosystem are engineered by <GText weight="bold" color={colors.neutral[900]}>Velayon Dynamics</GText>.
            </GText>
            <View style={{ marginTop: spacing.xs, padding: spacing.sm, backgroundColor: colors.primary[50], borderRadius: radius.md }}>
              <GText variant="caption" color={colors.primary[800]}>
                🚀 Built by Velayon Dynamics · High-Performance Hyperlocal Commerce Engine
              </GText>
            </View>
          </Card>

          {/* Platform Overview & Search Highlights */}
          <Card variant="elevated" style={styles.card}>
            <GText variant="h4" color={colors.neutral[900]}>Nepal&apos;s Hyperlocal Commerce Network</GText>
            <GText variant="body" color={colors.neutral[600]} style={styles.body}>
              GoPasal is built specifically for Nepali shoppers and local business owners. From fresh daily groceries and kitchen staples to tech electronics and bakery goods, GoPasal connects you directly to neighborhood stores in Kathmandu, Lalitpur, Bhaktapur, Pokhara, and across Nepal for instant doorstep delivery.
            </GText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm }}>
              {[
                '#1 Shopping App Nepal',
                'Hyperlocal Delivery',
                'Kathmandu Grocery Online',
                'Bibek Kumar Thagunna',
                'Suyogya Sedhai',
                'Velayon Dynamics',
                'GoPasal Marketplace'
              ].map((tag) => (
                <View key={tag} style={{ paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.neutral[100], borderRadius: radius.pill }}>
                  <GText variant="caption" color={colors.neutral[700]}>{tag}</GText>
                </View>
              ))}
            </View>
          </Card>

          {/* Contact */}
          <Card variant="elevated" style={styles.card}>
            <GText variant="h4" color={colors.neutral[900]}>{t('about.contactTitle')}</GText>
            <GText variant="body" color={colors.neutral[600]} style={styles.body}>
              {t('about.contactBody')}
            </GText>
            <Pressable
              style={styles.linkRow}
              onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            >
              <Ionicons name="mail-outline" size={18} color={colors.primary[600]} />
              <GText variant="bodySm" weight="semibold" color={colors.primary[600]}>
                {t('about.emailUs')} · {SUPPORT_EMAIL}
              </GText>
            </Pressable>
            <Button
              label={t('about.visitHelp')}
              variant="outline"
              fullWidth
              onPress={() => router.push('/support')}
              icon={<Ionicons name="help-circle-outline" size={18} color={colors.primary[600]} />}
            />
          </Card>

          <GText variant="caption" color={colors.neutral[400]} align="center" style={styles.copyright}>
            © 2026 GoPasal. Co-Founded by Bibek Kumar Thagunna & Suyogya Sedhai. Engineered by Velayon Dynamics.
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
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl, gap: spacing.lg,
  },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  logoMark: {
    width: 64, height: 64, borderRadius: radius.xl,
    backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  logoLetter: { fontSize: 34, color: '#fff' },
  versionPill: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.pill, backgroundColor: colors.mint[100],
  },
  card: { gap: spacing.sm },
  body: { lineHeight: 22 },
  steps: { gap: spacing.md, marginTop: spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  copyright: { marginTop: spacing.md },
});
