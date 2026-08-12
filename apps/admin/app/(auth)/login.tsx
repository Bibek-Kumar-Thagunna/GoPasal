import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  ActivityIndicator,
  Text,
  ScrollView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';

type AuthMode = 'password' | 'otp_phone' | 'otp_verify';

function formatAuthError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const body = e.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return body?.error?.message || body?.message || e.message || 'Something went wrong';
  }
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

const OTP_LEN = 6;

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 840;

  const [mode, setMode] = useState<AuthMode>('password');
  const [email, setEmail] = useState('admin@gopasal.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LEN).fill(''));
  const [resendSec, setResendSec] = useState(0);
  const [error, setError] = useState('');

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const { loginWithEmailPassword, sendAdminOtp, verifyAdminOtp, isLoading } =
    useAuthStore();

  useEffect(() => {
    if (mode !== 'otp_verify' || resendSec <= 0) return;
    const t = setInterval(() => setResendSec((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [mode, resendSec]);

  const normalizedPhone = phone.startsWith('+977') ? phone : `+977${phone}`;

  const handlePasswordSignIn = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Enter email and password');
      return;
    }
    try {
      await loginWithEmailPassword(email.trim(), password);
    } catch (e) {
      setError(formatAuthError(e));
    }
  };

  const handleSendAdminOtp = async () => {
    setError('');
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    try {
      await sendAdminOtp(normalizedPhone);
      setMode('otp_verify');
      setOtp(Array(OTP_LEN).fill(''));
      setResendSec(30);
    } catch (e) {
      setError(formatAuthError(e));
    }
  };

  const otpString = otp.join('');

  const handleVerifyOtp = async () => {
    setError('');
    if (otpString.length !== OTP_LEN) {
      setError('Enter the 6-digit code');
      return;
    }
    try {
      await verifyAdminOtp(normalizedPhone, otpString);
    } catch (e) {
      setError(formatAuthError(e));
    }
  };

  const handleOtpDigit = useCallback((index: number, digit: string) => {
    const d = digit.replace(/\D/g, '').slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[index] = d;
      return next;
    });
    if (d && index < OTP_LEN - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const branding = (
    <Animated.View
      entering={FadeInDown.delay(80).duration(500)}
      style={[styles.brandColumn, isWide && styles.brandColumnWide]}
    >
      <View style={styles.logoRow}>
        <View style={styles.logoMark}>
          <Ionicons name="leaf" size={22} color="#0c1024" />
        </View>
        <Text style={styles.logoWord}>GoPasal</Text>
      </View>
      <Text style={[styles.heroTitle, { fontSize: isWide ? 36 : 26, lineHeight: isWide ? 44 : 32 }]}>
        Manage your marketplace with power and precision.
      </Text>
      <Text style={styles.heroSub}>
        Sign in to the admin panel to access and control your platform.
      </Text>
      <Text style={styles.footerNote}>© 2026 GoPasal. All rights reserved.</Text>
    </Animated.View>
  );

  const passwordCard = (
    <>
      <Text style={styles.cardTitle}>Admin Sign In</Text>
      <Text style={styles.cardSub}>Sign in to your account</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.inputDark}
        placeholder="admin@example.com"
        placeholderTextColor="rgba(255,255,255,0.35)"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />

      <Text style={styles.label}>Password</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.inputDark, styles.passwordInput]}
          placeholder="••••••••"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <Pressable
          onPress={() => setShowPassword((s) => !s)}
          style={styles.showBtn}
          hitSlop={12}
        >
          <Text style={styles.showBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>

      <View style={styles.rowBetween}>
        <Pressable style={styles.rememberRow} onPress={() => setRememberMe((r) => !r)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
            {rememberMe ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>
        <Pressable onPress={() => Alert.alert('Reset link', 'Contact a Super Admin to reset your password.')}>
          <Text style={styles.link}>Forgot password?</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
        onPress={handlePasswordSignIn}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#2563eb', '#38bdf8']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.primaryBtnGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Sign In</Text>
          )}
        </LinearGradient>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Pressable
          onPress={() => {
            setMode('otp_phone');
            setError('');
          }}
          hitSlop={10}
        >
          <Text style={styles.dividerText}>or OTP Login</Text>
        </Pressable>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        style={styles.googleBtn}
        onPress={() =>
          Alert.alert('Google sign-in', 'Enterprise SSO for admin is not enabled in this build.')
        }
      >
        <Ionicons name="logo-google" size={20} color="#fff" />
        <Text style={styles.googleBtnText}>Continue with Google</Text>
      </Pressable>
    </>
  );

  const otpPhoneCard = (
    <>
      <Pressable style={styles.backRow} onPress={() => { setMode('password'); setError(''); }}>
        <Ionicons name="arrow-back" size={20} color="#7dd3fc" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.cardTitle}>OTP Login</Text>
      <Text style={styles.cardSub}>We will send a code only if this number is registered for admin access.</Text>

      <View style={styles.phoneRow}>
        <View style={styles.prefixBox}>
          <Text style={styles.prefixText}>🇳🇵 +977</Text>
        </View>
        <TextInput
          style={[styles.inputDark, styles.phoneInput]}
          placeholder="98XXXXXXXX"
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
        onPress={handleSendAdminOtp}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#2563eb', '#38bdf8']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.primaryBtnGradient}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send code</Text>}
        </LinearGradient>
      </Pressable>
    </>
  );

  const otpVerifyCard = (
    <>
      <Pressable
        style={styles.backRow}
        onPress={() => {
          setMode('otp_phone');
          setError('');
          setOtp(Array(OTP_LEN).fill(''));
        }}
      >
        <Ionicons name="arrow-back" size={20} color="#7dd3fc" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.cardTitle}>Verify OTP</Text>
      <Text style={styles.cardSub}>Enter the 6-digit code sent to your phone.</Text>

      <View style={styles.otpRow}>
        {otp.map((ch, i) => (
          <TextInput
            key={i}
            ref={(r) => {
              otpRefs.current[i] = r;
            }}
            style={styles.otpCell}
            value={ch}
            onChangeText={(t) => handleOtpDigit(i, t)}
            onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.timerText}>
          {resendSec > 0 ? `Resend code in 00:${String(resendSec).padStart(2, '0')}` : 'You can resend now'}
        </Text>
        <Pressable
          disabled={resendSec > 0 || isLoading}
          onPress={async () => {
            setError('');
            try {
              await sendAdminOtp(normalizedPhone);
              setResendSec(30);
            } catch (e) {
              setError(formatAuthError(e));
            }
          }}
        >
          <Text style={[styles.link, resendSec > 0 && styles.linkMuted]}>Resend OTP</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
        onPress={handleVerifyOtp}
        disabled={isLoading}
      >
        <LinearGradient
          colors={['#2563eb', '#38bdf8']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.primaryBtnGradient}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Verify & Continue →</Text>
          )}
        </LinearGradient>
      </Pressable>
    </>
  );

  return (
    <LinearGradient colors={['#070818', '#0d1030', '#0a0b1e']} style={styles.root}>
      <LinearGradient
        colors={['rgba(56,189,248,0.12)', 'transparent', 'rgba(99,102,241,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
            keyboardShouldPersistTaps="handled"
          >
            {isWide ? (
              <View style={styles.wideRow}>
                <View style={styles.wideLeft}>{branding}</View>
                <Animated.View
                  entering={FadeInDown.delay(120).duration(550)}
                  style={[styles.glassCard, isWide && { flex: 1, maxWidth: 480 }]}
                >
                  {mode === 'password' ? passwordCard : null}
                  {mode === 'otp_phone' ? otpPhoneCard : null}
                  {mode === 'otp_verify' ? otpVerifyCard : null}
                </Animated.View>
              </View>
            ) : (
              <View style={styles.narrowStack}>
                {branding}
                <Animated.View
                  entering={FadeInDown.delay(120).duration(550)}
                  style={[styles.glassCard, isWide && { flex: 1, maxWidth: 480 }]}
                >
                  {mode === 'password' ? passwordCard : null}
                  {mode === 'otp_phone' ? otpPhoneCard : null}
                  {mode === 'otp_verify' ? otpVerifyCard : null}
                </Animated.View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
    justifyContent: 'center',
  },
  scrollWide: {
    justifyContent: 'center',
    minHeight: 560,
  },
  wideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['3xl'],
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  wideLeft: { flex: 1, paddingRight: spacing.xl },
  narrowStack: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  brandColumn: { marginBottom: spacing['2xl'] },
  brandColumnWide: { marginBottom: 0 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing['2xl'] },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWord: { fontFamily: 'Poppins-Bold', fontSize: 26, color: '#fff', letterSpacing: -0.5 },
  heroTitle: {
    fontFamily: 'Poppins-Bold',
    color: '#fff',
    marginBottom: spacing.md,
  },
  heroSub: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 22,
    maxWidth: 420,
  },
  footerNote: {
    marginTop: spacing['3xl'],
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  glassCard: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: 'rgba(12,14,35,0.72)',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: spacing['3xl'],
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  cardSub: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: spacing['2xl'],
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: spacing.sm,
  },
  inputDark: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    height: 52,
    paddingHorizontal: spacing.md,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#fff',
    marginBottom: spacing.lg,
  },
  passwordRow: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 72,
  },
  showBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 14,
  },
  showBtnText: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#7dd3fc' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  rememberText: { fontFamily: 'Inter', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  link: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#7dd3fc' },
  linkMuted: { opacity: 0.45 },
  error: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#f87171',
    marginBottom: spacing.md,
  },
  primaryBtn: { borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.sm },
  primaryBtnGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.65 },
  primaryBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: '#fff' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing['2xl'],
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  dividerText: { fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    height: 50,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  googleBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#fff' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  backText: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#7dd3fc' },
  phoneRow: { flexDirection: 'row', borderRadius: radius.md, overflow: 'hidden', marginBottom: spacing.lg },
  prefixBox: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRightWidth: 0,
  },
  prefixText: { fontFamily: 'Inter-Medium', fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  phoneInput: { flex: 1, marginBottom: 0, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  otpCell: {
    flex: 1,
    maxWidth: 52,
    aspectRatio: 1,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  timerText: { fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.45)' },
});
