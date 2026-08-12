import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';

type Step = 'phone' | 'otp';

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const { sendOtp, verifyOtp, isLoading } = useAuthStore();

  const handleSendOtp = async () => {
    setError('');
    if (!phone || phone.length < 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    try {
      await sendOtp(phone.startsWith('+977') ? phone : `+977${phone}`);
      setStep('otp');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to send OTP. Try again.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (!otp || otp.length < 4) {
      setError('Enter the OTP sent to your phone');
      return;
    }
    try {
      await verifyOtp(phone.startsWith('+977') ? phone : `+977${phone}`, otp);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Invalid OTP. Try again.');
    }
  };

  return (
    <LinearGradient
      colors={['#1a3a2a', '#142c20', '#0a1710']}
      style={styles.gradient}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Logo / Brand */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.brand}>
            <View style={styles.logoCircle}>
              <Ionicons name="bicycle" size={36} color={'#1a3a2a'} />
            </View>
            <Text style={styles.logoTitle}>GoPasal Delivery</Text>
            <Text style={styles.logoSub}>Earn on your own schedule</Text>
          </Animated.View>

          {/* Card */}
          <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.card}>
            {step === 'phone' ? (
              <>
                <Text style={styles.cardTitle}>Rider Login</Text>
                <Text style={styles.cardSub}>Enter your registered phone number</Text>

                <View style={styles.inputRow}>
                  <View style={styles.prefix}>
                    <Text style={styles.prefixText}>🇳🇵 +977</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholderTextColor={colors.neutral[400]}
                  />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  style={[styles.btn, isLoading && styles.btnDisabled]}
                  onPress={handleSendOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Send OTP</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Pressable onPress={() => setStep('phone')} style={styles.back}>
                  <Ionicons name="arrow-back" size={20} color={colors.primary[500]} />
                  <Text style={styles.backText}>Change number</Text>
                </Pressable>

                <Text style={styles.cardTitle}>Enter OTP</Text>
                <Text style={styles.cardSub}>Sent to +977 {phone}</Text>

                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="• • • • • •"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor={colors.neutral[400]}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  style={[styles.btn, isLoading && styles.btnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Verify & Continue</Text>
                  )}
                </Pressable>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Simple Text without GText to avoid font loading dependency here
function Text({ style, children }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Poppins', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  brand: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#fff',
    letterSpacing: -0.5,
  },
  logoSub: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius['2xl'],
    padding: spacing['3xl'],
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 10,
  },
  cardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },
  cardSub: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[500],
    marginBottom: spacing['2xl'],
  },
  inputRow: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  prefix: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.neutral[700],
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: spacing.md,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.neutral[900],
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    textAlign: 'center',
    letterSpacing: 6,
    height: 64,
    fontSize: 22,
    marginBottom: spacing.md,
    flex: 0,
    width: '100%',
  },
  error: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.error.main,
    marginBottom: spacing.md,
  },
  btn: {
    backgroundColor: colors.primary[500],
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  backText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary[500],
  },
});
