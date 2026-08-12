import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthLayout } from '../../src/components/ui/AuthLayout';
import { Button } from '../../src/components/ui/Button';
import { CategoryIllustration } from '../../src/components/illustrations/CategoryIllustration';
import { colors } from '../../src/design-system/tokens/colors';
import { useLanguageStore } from '../../src/store/language.store';
import { useRegistrationFlowStore } from '../../src/store/registration-flow.store';
import { translateSellerOnboardingCategories } from '../../src/constants/seller-onboarding-categories';

function Text({ style, children, ...props }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

export default function CategorySelectScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const { canAccess, setCategory } = useRegistrationFlowStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Route protection: must have completed OTP step
  useEffect(() => {
    if (!canAccess('category')) {
      router.replace('/(auth)/register');
    }
  }, []);

  const translatedCategories = translateSellerOnboardingCategories(t);

  const handleContinue = () => {
    if (!selected) {
      setError('Please select your store type to continue');
      return;
    }
    setError('');
    setCategory(selected);
    router.push('/(auth)/store-verification');
  };

  return (
    <AuthLayout
      illustration={<CategoryIllustration />}
      illustrationAlignWithCard
    >
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Text style={styles.title}>{t('category.title')}</Text>
        <Text style={styles.subtitle}>
          {t('category.subtitle')}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.grid}>
        {translatedCategories.map((cat, index) => (
          <Animated.View
            key={cat.id}
            entering={FadeInUp.delay(250 + index * 60).duration(400)}
          >
            <Pressable
              style={[
                styles.categoryCard,
                selected === cat.id && {
                  borderColor: cat.color,
                  backgroundColor: cat.bgColor,
                },
              ]}
              onPress={() => { setSelected(cat.id); setError(''); }}
            >
              <View style={[styles.iconWrap, { backgroundColor: cat.bgColor }]}>
                <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={22} color={cat.color} />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardRow}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  {selected === cat.id && (
                    <View style={[styles.checkBadge, { backgroundColor: cat.color }]}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text style={styles.categoryDesc}>{cat.description}</Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </Animated.View>

      {error ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.errorWrap}>
          <Ionicons name="alert-circle" size={16} color={colors.error.main} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeInDown.delay(600).duration(500)}>
        <Button
          title={t('category.continue')}
          onPress={handleContinue}
          disabled={!selected}
        />
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: colors.primary[700],
    marginBottom: 6,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: colors.neutral[600],
    marginBottom: 24,
    lineHeight: 22,
  },
  grid: {
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.neutral[800],
  },
  categoryDesc: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.neutral[500],
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
});
