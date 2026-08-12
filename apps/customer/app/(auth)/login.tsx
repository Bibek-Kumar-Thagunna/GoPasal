import React, { useState } from 'react';
import { View, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Alert, useWindowDimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../../src/design-system/primitives/GText';
import { Button } from '../../src/design-system/primitives/Button';
import { Input } from '../../src/design-system/primitives/Input';
import { PhoneInput } from '../../src/components/PhoneInput';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing } from '../../src/design-system/tokens/spacing';
import { DEFAULT_COUNTRY_CODE } from '../../src/constants/countries';
import { useSendOtp, useVerifyOtp, useSocialLogin } from '../../src/services/hooks';
import { useAuthStore } from '../../src/store/auth.store';
import { isSocialLoginEnabled } from '../../src/constants/env';
import { useTranslation } from '../../src/i18n';

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { t } = useTranslation();

  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [phone, setPhone] = useState('');
  const [fullPhone, setFullPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');

  const buildFullPhone = () => `${countryCode}${phone.trim()}`;

  const isPhoneValid = () => {
    if (countryCode === '+977') return phone.length === 10;
    return phone.length >= 6 && phone.length <= 15;
  };

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();
  const socialLogin = useSocialLogin();
  const setUser = useAuthStore((s) => s.setUser);

  const handleSocial = async (provider: 'GOOGLE' | 'APPLE') => {
    setError('');
    const runLogin = async (token: string) => {
      try {
        const result = await socialLogin.mutateAsync({ provider, token });
        setUser(result.user);
        router.replace('/(tabs)');
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        setError(err?.response?.data?.message || t('login.errSocialFailed'));
      }
    };
    const socialTitle = provider === 'GOOGLE' ? t('login.socialGoogleTitle') : t('login.socialAppleTitle');
    if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
      Alert.prompt(
        socialTitle,
        t('login.socialPasteToken'),
        (token) => {
          if (token?.trim()) void runLogin(token.trim());
        }
      );
      return;
    }
    Alert.alert(
      socialTitle,
      t('login.socialAlertMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('login.enterToken'),
          onPress: () => {
            if (Platform.OS === 'web' && typeof globalThis.prompt === 'function') {
              const token = globalThis.prompt(t('login.pasteIdToken'));
              if (token?.trim()) void runLogin(token.trim());
            } else {
              Alert.alert(t('login.usePhoneOtp'), t('login.socialTokenIosWeb'));
            }
          },
        },
      ]
    );
  };

  const handleSendOtp = async () => {
    if (!isPhoneValid()) {
      setError(
        countryCode === '+977' ? t('login.errNepalPhone') : t('login.errValidPhone')
      );
      return;
    }
    setError('');
    const dialled = buildFullPhone();
    try {
      await sendOtp.mutateAsync({ phone: dialled });
      setFullPhone(dialled);
      setStep('otp');
    } catch (e: any) {
      setError(e?.response?.data?.message || t('login.errSendOtp'));
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setError(t('login.err6digit'));
      return;
    }
    setError('');
    try {
      await verifyOtp.mutateAsync({ phone: fullPhone, otp });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.response?.data?.message || t('login.errInvalidOtp'));
    }
  };

  return (
    <SafeAreaView style={[styles.safe, isDesktop && { backgroundColor: '#e5e7eb' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Close button */}
        <Pressable 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }} 
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={24} color={colors.neutral[700]} />
        </Pressable>

        <View style={isDesktop ? styles.desktopCard : styles.mobileContent}>
          <View style={isDesktop ? styles.desktopFormCol : styles.mobileFormCol}>
            {/* Logo / brand */}
          <Animated.View entering={FadeIn.duration(500)} style={styles.brand}>
            <View style={styles.logoCircle}>
              <Ionicons name="storefront" size={36} color={colors.primary[500]} />
            </View>
            <GText variant="displayMd" color={colors.neutral[900]} align="center">
              GoPasal
            </GText>
            <GText variant="body" color={colors.neutral[500]} align="center">
              {t('login.tagline')}
            </GText>
          </Animated.View>

          {step === 'phone' ? (
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.form}>
              <GText variant="h3" color={colors.neutral[900]}>
                {t('login.enterPhone')}
              </GText>
              <GText variant="bodySm" color={colors.neutral[500]}>
                {t('login.sendCode')}
              </GText>
              <PhoneInput
                countryCode={countryCode}
                phone={phone}
                onCountryCodeChange={setCountryCode}
                onPhoneChange={setPhone}
                error={error}
                placeholder={
                  countryCode === '+977'
                    ? t('login.phonePlaceholderNepal')
                    : t('login.phonePlaceholder')
                }
              />
              <Button
                label={t('login.sendOtp')}
                fullWidth
                size="lg"
                loading={sendOtp.isPending}
                onPress={handleSendOtp}
              />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.form}>
              <GText variant="h3" color={colors.neutral[900]}>
                {t('login.verifyOtp')}
              </GText>
              <GText variant="bodySm" color={colors.neutral[500]}>
                {t('login.otpSentTo', { phone: fullPhone })}
              </GText>
              <Input
                placeholder={t('login.otpPlaceholder')}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                error={error}
                leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.neutral[400]} />}
              />
              <Button
                label={t('login.verifyContinue')}
                fullWidth
                size="lg"
                loading={verifyOtp.isPending}
                onPress={handleVerifyOtp}
              />
              <Pressable onPress={() => { setStep('phone'); setOtp(''); setError(''); setFullPhone(''); }}>
                <GText variant="bodySm" weight="semibold" color={colors.primary[600]} align="center">
                  {t('login.changePhone')}
                </GText>
              </Pressable>
            </Animated.View>
          )}

          {/* Social login — only shown when real OAuth credentials are configured */}
          {isSocialLoginEnabled && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.social}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <GText variant="caption" color={colors.neutral[400]}>{t('login.orContinueWith')}</GText>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialBtns}>
              <Pressable
                style={styles.socialBtn}
                disabled={socialLogin.isPending}
                onPress={() => void handleSocial('GOOGLE')}
              >
                <Ionicons name="logo-google" size={22} color={colors.neutral[700]} />
              </Pressable>
              <Pressable
                style={styles.socialBtn}
                disabled={socialLogin.isPending}
                onPress={() => void handleSocial('APPLE')}
              >
                <Ionicons name="logo-apple" size={22} color={colors.neutral[700]} />
              </Pressable>
            </View>
          </Animated.View>
          )}
          </View>

          {isDesktop && (
            <View style={styles.desktopGraphicCol}>
              <Video 
                source={require('../../assets/images/delivery_video.mp4')} 
                style={StyleSheet.absoluteFillObject}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
              <LinearGradient
                colors={['transparent', 'rgba(10, 30, 20, 0.8)', 'rgba(5, 20, 10, 1)']}
                style={styles.graphicOverlay}
              />
              <View style={styles.desktopGraphicContent}>
                <GText variant="h1" color="#ffffff" style={styles.graphicTitle}>Welcome to GoPasal</GText>
                <GText variant="bodyLg" color="rgba(255,255,255,0.9)" style={styles.graphicText}>
                  Your neighborhood marketplace. Log in to access fresh groceries, local essentials, and much more right at your fingertips.
                </GText>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  flex: { flex: 1, justifyContent: 'center' },
  closeBtn: {
    position: 'absolute', top: spacing.lg, right: spacing.lg, zIndex: 10,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 6 },
      web: { boxShadow: '0 6px 16px rgba(0,0,0,0.1)' } as any
    })
  },
  mobileContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  mobileFormCol: {
    gap: spacing['3xl'],
  },
  desktopCard: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 1200,
    minHeight: 640,
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 48,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.12)',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.12, shadowRadius: 40 },
      android: { elevation: 16 },
      web: { boxShadow: '0 40px 80px rgba(0,0,0,0.12)' } as any
    })
  },
  desktopFormCol: {
    width: 440,
    justifyContent: 'center',
    paddingHorizontal: spacing['4xl'],
    paddingVertical: spacing['3xl'],
    gap: spacing['3xl'],
  },
  desktopGraphicCol: {
    flex: 1,
    backgroundColor: colors.primary[900],
    justifyContent: 'flex-end',
    padding: spacing['4xl'],
    position: 'relative',
    overflow: 'hidden',
  },
  desktopGraphicContent: {
    zIndex: 2,
    gap: spacing.lg,
    width: '100%',
    maxWidth: 480,
  },
  graphicOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '60%',
    zIndex: 1,
  },
  graphicTitle: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  graphicText: {
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  brand: { alignItems: 'center', gap: spacing.sm },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.mint[100],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  form: { gap: spacing.lg },
  social: { gap: spacing.lg },
  divider: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  dividerLine: {
    flex: 1, height: 1, backgroundColor: colors.neutral[200],
  },
  socialBtns: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.lg,
  },
  socialBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.neutral[200],
  },
});
