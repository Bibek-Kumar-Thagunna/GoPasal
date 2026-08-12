import React from 'react';
import { Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors } from '../../design-system/tokens/colors';
import { radius } from '../../design-system/tokens/spacing';

function Text({ style, children }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Poppins-SemiBold', color: '#FFFFFF' }, style]}>
      {children}
    </Animated.Text>
  );
}

interface ButtonProps {
  title?: string;
  /** Alias for `title`, kept for screens written against the shared UI API. */
  label?: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'google' | 'phone';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  subtitle?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  title,
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  subtitle,
  fullWidth = false,
  size = 'md',
}: ButtonProps) {
  const text = title ?? label ?? '';
  const sizeStyle =
    size === 'lg' ? styles.btnLg : size === 'sm' ? styles.btnSm : null;
  const variantStyles = {
    primary: {
      container: [styles.btn, styles.btnPrimary],
      text: styles.btnPrimaryText,
    },
    outline: {
      container: [styles.btn, styles.btnOutline],
      text: styles.btnOutlineText,
    },
    google: {
      container: [styles.btn, styles.btnGoogle],
      text: styles.btnGoogleText,
    },
    phone: {
      container: [styles.btn, styles.btnPhone],
      text: styles.btnPhoneText,
    },
  };

  const vs = variantStyles[variant];

  return (
    <Pressable
      style={[
        ...vs.container,
        sizeStyle,
        fullWidth && styles.btnFullWidth,
        (disabled || loading) && styles.btnDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary[500]} />
      ) : (
        <>
          {icon}
          <Text style={vs.text}>{text}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  btnFullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  btnLg: {
    height: 54,
  },
  btnSm: {
    height: 40,
  },
  btnPrimary: {
    backgroundColor: colors.primary[500],
  },
  btnPrimaryText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  btnOutlineText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.neutral[800],
  },
  btnGoogle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.google.border,
  },
  btnGoogleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.google.text,
  },
  btnPhone: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  btnPhoneText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.neutral[800],
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});
