import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthLayout } from '../../src/components/ui/AuthLayout';
import { FormInput } from '../../src/components/ui/FormInput';
import { Button } from '../../src/components/ui/Button';
import { StorefrontIllustration } from '../../src/components/illustrations/StorefrontIllustration';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing } from '../../src/design-system/tokens/spacing';
import { useAuthStore } from '../../src/store/auth.store';
import { useLanguageStore } from '../../src/store/language.store';
import { storage } from '../../src/utils/storage';

function Text({ style, children, ...props }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

type LoginMode = 'email' | 'otp-phone' | 'otp-verify';

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, isLoading, loginWithEmail } = useAuthStore();
  const { t } = useLanguageStore();

  const [mode, setMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const handleEmailLogin = async () => {
    setError('');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return setError('Please enter a valid email address');
    if (!password) return setError('Please enter your password');

    try {
      await storage.deleteItemAsync('accessToken');
      await storage.deleteItemAsync('refreshToken');
      await loginWithEmail(email.trim().toLowerCase(), password);
    } catch (e: any) {
      const apiMsg = e.response?.data?.error?.message;
      const fallbackMsg = e.response?.status >= 500
         ? 'Login failed due to a server error. Please try again later.'
         : 'Login failed. Please check your credentials.';
      setError(apiMsg || fallbackMsg);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) return setError('Phone number must be exactly 10 digits');

    try {
      // login.tsx doesn't use country code picker yet, just assume +977 or exactly 10 digits + append it.
      const fullPhone = phone.startsWith('+977') ? phone : `+977${phone.trim()}`;
      await sendOtp(fullPhone);
      setMode('otp-verify');
    } catch (e: any) {
      setError(e.response?.data?.error?.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (!otp || otp.length < 4) return setError('Enter the OTP sent to your phone');
    try {
      await verifyOtp(phone.startsWith('+977') ? phone : `+977${phone}`, otp);
    } catch (e: any) {
      setError(e.response?.data?.error?.message || 'Invalid OTP');
    }
  };

  return (
    <AuthLayout illustration={<StorefrontIllustration />} showFooter>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={styles.title}>
          {mode === 'email' ? t('auth.signIn.title') :
            mode === 'otp-phone' ? t('auth.signInOtp') : t('auth.enterOtp')}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'email' ? t('auth.signIn.subtitle') :
            mode === 'otp-phone' ? t('auth.signIn.otpSubtitle') :
              `${t('auth.sentTo')}${phone}`}
        </Text>
      </Animated.View>

      {mode === 'email' && (
        <>
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.demoBox}>
            <Text style={styles.demoText}>Demo Seller: seller@gopasal.com / pass1234</Text>
            <Pressable
              style={styles.demoBtn}
              onPress={() => {
                setEmail('seller@gopasal.com');
                setPassword('pass1234');
              }}
            >
              <Text style={styles.demoBtnText}>Fill Demo</Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <FormInput
              icon="mail-outline"
              placeholder={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <FormInput
              icon="lock-closed-outline"
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </Animated.View>

          {error ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.errorWrap}>
              <Ionicons name="alert-circle" size={16} color={colors.error.main} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Button title={t('auth.signIn')} onPress={handleEmailLogin} loading={isLoading} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <Button
              title={t('auth.signInOtp')}
              variant="phone"
              icon={<Ionicons name="call-outline" size={18} color={colors.primary[500]} />}
              onPress={() => { setMode('otp-phone'); setError(''); }}
            />
          </Animated.View>
        </>
      )}

      {mode === 'otp-phone' && (
        <>
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <FormInput
              icon="call-outline"
              placeholder={t('auth.phonePlaceholder')}
              value={phone}
              onChangeText={(text: string) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </Animated.View>

          {error ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.errorWrap}>
              <Ionicons name="alert-circle" size={16} color={colors.error.main} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Button title={t('auth.sendOtp')} onPress={handleSendOtp} loading={isLoading} />
            <Button
              title={t('auth.useEmailInstead')}
              variant="outline"
              onPress={() => { setMode('email'); setError(''); }}
            />
          </Animated.View>
        </>
      )}

      {mode === 'otp-verify' && (
        <>
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Pressable onPress={() => setMode('otp-phone')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={18} color={colors.primary[500]} />
              <Text style={styles.backText}>{t('auth.changeNumber')}</Text>
            </Pressable>
            <FormInput
              icon="keypad-outline"
              placeholder={t('auth.otpPlaceholder')}
              value={otp}
              onChangeText={(text: string) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />
          </Animated.View>

          {error ? (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.errorWrap}>
              <Ionicons name="alert-circle" size={16} color={colors.error.main} />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <Button title={t('auth.verifyAndContinue')} onPress={handleVerifyOtp} loading={isLoading} />
          </Animated.View>
        </>
      )}

      {/* Register link */}
      <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.registerWrap}>
        <Text style={styles.registerText}>{t('auth.dontHave')} </Text>
        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerLink}>{t('auth.signUpLink')}</Text>
        </Pressable>
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: colors.neutral[900],
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[500],
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.neutral[400],
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error.light,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.error.dark,
    flex: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary[500],
  },
  registerWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  demoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  demoText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
  },
  demoBtn: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demoBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#1E40AF',
  },
  registerText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[600],
  },
  registerLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.neutral[900],
  },
});
