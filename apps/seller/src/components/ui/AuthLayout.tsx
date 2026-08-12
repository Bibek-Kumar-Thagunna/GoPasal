import React from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { AuthHeader } from './AuthHeader';
import { colors } from '../../design-system/tokens/colors';
import { useResponsive } from '../../hooks/useResponsive';
import { useLanguageStore } from '../../store/language.store';

function Text({ style, children }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[500] }, style]}>
      {children}
    </Animated.Text>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  illustration?: React.ReactNode;
  showFooter?: boolean;
  /** When set, hero art aligns from the top with the form card (better for tall forms, e.g. category pick). */
  illustrationAlignWithCard?: boolean;
}

export function AuthLayout({
  children,
  illustration,
  showFooter = false,
  illustrationAlignWithCard = false,
}: AuthLayoutProps) {
  const { isDesktop, isTablet } = useResponsive();
  const { t } = useLanguageStore();
  const showSideIllustration = (isDesktop || isTablet) && illustration;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AuthHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.main,
          showSideIllustration && styles.mainDesktop,
        ]}>
          {/* Content side */}
          <View style={[
            styles.contentSide,
            showSideIllustration && styles.contentSideDesktop,
          ]}>
            <View style={styles.card}>
              {children}
            </View>
          </View>

          {/* Illustration side (desktop/tablet only) */}
          {showSideIllustration && (
            <View
              style={[
                styles.illustrationSide,
                illustrationAlignWithCard && styles.illustrationSideAlignCard,
              ]}
            >
              {illustration}
            </View>
          )}
        </View>

        {showFooter && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('footer.powered')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  main: {
    flex: 1,
    padding: 24,
  },
  mainDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
    maxWidth: 1160,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 40,
    paddingTop: 48,
    paddingBottom: 48,
  },
  contentSide: {
    flex: 1,
    maxWidth: 600,
  },
  contentSideDesktop: {
    flex: 1,
    maxWidth: 480,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 1px rgba(15, 23, 42, 0.1)' }
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 4,
        }),
  } as any,
  illustrationSide: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'center',
    minWidth: 320,
    maxWidth: 580,
    paddingHorizontal: 16,
  },
  illustrationSideAlignCard: {
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
