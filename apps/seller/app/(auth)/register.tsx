import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthLayout } from '../../src/components/ui/AuthLayout';
import { FormInput, PhoneInput } from '../../src/components/ui/FormInput';
import { Button } from '../../src/components/ui/Button';
import { StorefrontIllustration } from '../../src/components/illustrations/StorefrontIllustration';
import { colors } from '../../src/design-system/tokens/colors';
import { useAuthStore } from '../../src/store/auth.store';
import { useRegistrationFlowStore } from '../../src/store/registration-flow.store';
import { useLanguageStore } from '../../src/store/language.store';

function Text({ style, children, ...props }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const { validateAndSendOtp, confirmRegistrationOtp, isLoading } = useAuthStore();
  const { setRegistrationData, markOtpVerified } = useRegistrationFlowStore();

  const [mode, setMode] = useState<'form' | 'otp'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+977');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const getFullPhone = () => `${countryCode}${phone.trim()}`;

  const handleRegister = async () => {
    setError('');
    
    if (!name.trim() || name.trim().length < 2) return setError('Please enter a valid full name');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return setError('Please enter a valid email address');
    
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.trim())) return setError('Phone number must be exactly 10 digits');
    
    if (!password || password.length < 8) return setError('Password must be at least 8 characters');

    try {
      const fullPhone = getFullPhone();
      // This ONLY validates uniqueness + sends OTP. NO user is created in DB.
      await validateAndSendOtp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: fullPhone,
        password,
      });

      // Store data in client-side registration flow store
      setRegistrationData({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: fullPhone,
        password,
      });

      setMode('otp');
    } catch (e: any) {
      const apiMsg = e.response?.data?.error?.message;
      const fallbackMsg = e.response?.status >= 500 
        ? 'Registration failed due to a server error. Please try again later.'
        : 'Registration failed. Please check your details.';
      setError(apiMsg || fallbackMsg);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (!otp || otp.length !== 6) return setError('Enter the 6-digit OTP sent to your phone');

    try {
      const fullPhone = getFullPhone();
      await confirmRegistrationOtp(fullPhone, otp);
      useRegistrationFlowStore.setState({ otp });
      markOtpVerified();
      router.replace('/(auth)/category-select');
    } catch (e: unknown) {
      const apiMsg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data
        ?.error?.message;
      setError(apiMsg || 'Invalid or expired OTP. Tap resend on the previous step or register again.');
    }
  };

  return (
    <AuthLayout illustration={<StorefrontIllustration />}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={styles.title}>
          {mode === 'form' ? t('auth.signUp.title') : t('auth.enterOtp')}
        </Text>
        <Text style={styles.subtitle}>
          {mode === 'form' 
            ? t('auth.signUp.subtitle') 
            : `${t('auth.sentTo')} ${countryCode}${phone}`}
        </Text>
      </Animated.View>

      {mode === 'form' && (
        <>
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <FormInput
              icon="person-outline"
              placeholder={t('auth.fullName')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <FormInput
              icon="mail-outline"
              placeholder={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <PhoneInput
              countryCode={countryCode}
              phone={phone}
              onCountryCodeChange={setCountryCode}
              onPhoneChange={(text: string) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
            />
            <FormInput
              icon="lock-closed-outline"
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </Animated.View>
        </>
      )}

      {mode === 'otp' && (
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Pressable onPress={() => setMode('form')} style={styles.backBtn}>
             <Ionicons name="arrow-back" size={18} color={colors.primary[500]} />
             <Text style={styles.backText}>Edit Details</Text>
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
      )}

      {error ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.errorWrap}>
          <Ionicons name="alert-circle" size={16} color={colors.error.main} />
          <View style={{ flex: 1 }}>
            <Text style={styles.errorText}>{error}</Text>
            {error.toLowerCase().includes('already registered') || error.toLowerCase().includes('log in') ? (
              <Pressable
                style={styles.errorLoginBtn}
                onPress={() => router.push('/(auth)/login' as any)}
              >
                <Text style={styles.errorLoginBtnText}>Log In to Existing Account →</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        {mode === 'form' ? (
          <Button
            title={t('auth.signUp')}
            onPress={handleRegister}
            loading={isLoading}
          />
        ) : (
          <Button
            title={t('auth.verifyAndContinue')}
            onPress={handleVerifyOtp}
            loading={isLoading}
          />
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(450).duration(500)} style={styles.tosWrap}>
        <Text style={styles.tosText}>
          {t('auth.tos')}{' '}
          <Text style={styles.tosLink}>{t('auth.tosLink')}</Text> {t('auth.and')}{' '}
          <Text style={styles.tosLink}>{t('auth.privacyLink')}</Text>
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.loginWrap}>
        <Text style={styles.loginText}>{t('auth.alreadyHave')} </Text>
        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginLink}>{t('auth.logIn')}</Text>
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
  errorLoginBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorLoginBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#991B1B',
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
  tosWrap: {
    marginTop: 4,
    marginBottom: 16,
  },
  tosText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  tosLink: {
    color: colors.primary[500],
    fontFamily: 'Inter-SemiBold',
  },
  loginWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[600],
  },
  loginLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.neutral[900],
  },
});
