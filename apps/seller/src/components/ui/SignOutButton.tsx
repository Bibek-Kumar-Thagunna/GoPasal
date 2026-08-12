import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useAuthStore } from '../../store/auth.store';
import { useLanguageStore } from '../../store/language.store';
import { colors } from '../../design-system/tokens/colors';

type SignOutButtonProps = {
  variant?: 'onDark' | 'onLight';
};

export function SignOutButton({ variant = 'onLight' }: SignOutButtonProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const { t } = useLanguageStore();
  const onDark = variant === 'onDark';

  const handleSignOut = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Pressable
      style={[styles.btn, onDark ? styles.btnOnDark : styles.btnOnLight]}
      onPress={() => void handleSignOut()}
      accessibilityRole="button"
      accessibilityLabel={t('nav.logout')}
    >
      <Ionicons
        name="log-out-outline"
        size={18}
        color={onDark ? '#FFFFFF' : colors.primary[700]}
      />
      <Animated.Text
        style={[styles.label, { color: onDark ? '#FFFFFF' : colors.primary[700] }]}
      >
        {t('nav.logout')}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  btnOnDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  btnOnLight: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
});
