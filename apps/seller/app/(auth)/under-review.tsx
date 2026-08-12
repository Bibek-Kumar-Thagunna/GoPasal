import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthLayout } from '../../src/components/ui/AuthLayout';
import { Button } from '../../src/components/ui/Button';
import { UnderReviewIllustration } from '../../src/components/illustrations/UnderReviewIllustration';
import { colors } from '../../src/design-system/tokens/colors';
import { useLanguageStore } from '../../src/store/language.store';
import { useAuthStore } from '../../src/store/auth.store';
import apiClient from '../../src/services/api';

function Text({ style, children, ...props }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

export default function UnderReviewScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshedHint, setShowRefreshedHint] = useState(false);

  const checkVerificationStatus = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/seller/stores/verification-status');
      const step = data?.data?.verificationStep as string | undefined;
      const status = data?.data?.status as string | undefined;
      if (step === 'APPROVED' || status === 'ACTIVE') {
        router.replace('/(auth)/approved' as any);
        return;
      }
      if (step === 'REJECTED') {
        router.replace('/(auth)/kyc-resubmit' as any);
      }
    } catch {
      // ignore transient errors while polling
    }
  }, [router]);

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    setShowRefreshedHint(false);
    try {
      await useAuthStore.getState().checkAuth();
      await checkVerificationStatus();
      setShowRefreshedHint(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!showRefreshedHint) return undefined;
    const id = setTimeout(() => setShowRefreshedHint(false), 2800);
    return () => clearTimeout(id);
  }, [showRefreshedHint]);

  const handlePressSupportEmail = () => {
    const email = t('review.supportEmail');
    void Linking.openURL(`mailto:${email}`);
  };

  const CHECKLIST = [
    { label: t('review.step1'), done: true },
    { label: t('review.step2'), done: true },
    { label: t('review.step3'), done: true },
    { label: t('review.step4'), done: false, pending: true },
    { label: t('review.step5'), done: false },
  ];

  useEffect(() => {
    void checkVerificationStatus();
    pollRef.current = setInterval(() => {
      void checkVerificationStatus();
    }, 12_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkVerificationStatus]);

  return (
    <AuthLayout
      illustration={<UnderReviewIllustration />}
      illustrationAlignWithCard
      showFooter
    >
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <View style={styles.badge}>
          <Ionicons name="hourglass-outline" size={20} color={colors.warning.main} />
          <Text style={styles.badgeText}>{t('review.badge')}</Text>
        </View>

        <Text style={styles.title}>{t('review.title')}</Text>
        <Text style={styles.subtitle}>
          {t('review.subtitle')}
        </Text>
      </Animated.View>

      {/* Checklist */}
      <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.checklist}>
        {CHECKLIST.map((item, i) => (
          <Animated.View
            key={item.label}
            entering={FadeInDown.delay(300 + i * 80).duration(400)}
            style={styles.checkItem}
          >
            {item.done ? (
              <View style={styles.checkDone}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            ) : item.pending ? (
              <View style={styles.checkPending}>
                <Ionicons name="hourglass-outline" size={14} color={colors.warning.main} />
              </View>
            ) : (
              <View style={styles.checkUndone} />
            )}
            <Text style={[
              styles.checkLabel,
              item.done && styles.checkLabelDone,
              item.pending && styles.checkLabelPending,
            ]}>
              {item.label}
            </Text>
          </Animated.View>
        ))}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(700).duration(500)}>
        {/* Estimated time */}
        <View style={styles.etaCard}>
          <View style={styles.etaIconWrap}>
            <Ionicons name="time-outline" size={20} color={colors.primary[500]} />
          </View>
          <View>
            <Text style={styles.etaLabel}>{t('review.etaTitle')}</Text>
            <Text style={styles.etaValue}>{t('review.eta')}</Text>
          </View>
        </View>

        {/* Support */}
        <View style={styles.supportCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary[500]} style={styles.supportIcon} />
          <View style={styles.supportTextCol}>
            <Text style={styles.supportText}>{t('review.support')}</Text>
            <Pressable
              onPress={handlePressSupportEmail}
              accessibilityRole="link"
              accessibilityLabel={`${t('review.support')}: ${t('review.supportEmail')}`}
              style={({ pressed }) => [
                styles.supportEmailPressable,
                Platform.OS === 'web' && pressed && styles.supportEmailPressed,
              ]}
            >
              <Text style={styles.supportEmail}>{t('review.supportEmail')}</Text>
            </Pressable>
          </View>
        </View>

        <Button
          title={t('common.refresh')}
          variant="outline"
          onPress={() => void handleRefreshStatus()}
          loading={isRefreshing}
        />
        {showRefreshedHint ? (
          <Animated.View entering={FadeInDown.duration(320)} style={styles.refreshHint}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success.main} />
            <Text style={styles.refreshHintText}>{t('review.refreshChecked')}</Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warning.light,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.warning.dark,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: colors.neutral[900],
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[500],
    lineHeight: 20,
    marginBottom: 24,
  },
  checklist: {
    marginBottom: 24,
    gap: 14,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkDone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkPending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.warning.light,
    borderWidth: 1.5,
    borderColor: colors.warning.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkUndone: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[50],
  },
  checkLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[500],
    flex: 1,
  },
  checkLabelDone: {
    color: colors.neutral[700],
    textDecorationLine: 'line-through',
  },
  checkLabelPending: {
    color: colors.warning.dark,
    fontFamily: 'Inter-SemiBold',
  },
  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[100],
    marginBottom: 12,
  },
  etaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.primary[600],
  },
  etaValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: colors.primary[700],
    marginTop: 2,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.neutral[50],
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    marginBottom: 16,
  },
  supportIcon: {
    marginTop: 2,
  },
  supportTextCol: {
    flex: 1,
    gap: 6,
  },
  supportText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.neutral[600],
  },
  supportEmailPressable: {
    alignSelf: 'flex-start',
  },
  supportEmailPressed: {
    opacity: 0.85,
  },
  supportEmail: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary[600],
    textDecorationLine: 'underline',
  },
  refreshHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.success.light,
  },
  refreshHintText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.success.dark,
    flex: 1,
  },
});
