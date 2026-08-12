import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { typography } from '../design-system/tokens/typography';
import { COUNTRIES, getCountryByCode } from '../constants/countries';
import { useTranslation } from '../i18n';

const AnimatedView = Animated.createAnimatedComponent(View as any) as any;

interface PhoneInputProps {
  countryCode: string;
  phone: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
  error?: string;
  placeholder?: string;
}

export function PhoneInput({
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
  error,
  placeholder,
}: PhoneInputProps) {
  const { t } = useTranslation();
  const [showPicker, setShowPicker] = useState(false);
  const focusAnim = useSharedValue(0);
  const selected = getCountryByCode(countryCode);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [colors.neutral[200], colors.primary[400]]
    ),
    borderWidth: withTiming(focusAnim.value ? 2 : 1.5, { duration: 150 }),
  }));

  const handleFocus = () => {
    focusAnim.value = withTiming(1, { duration: 200 });
  };

  const handleBlur = () => {
    focusAnim.value = withTiming(0, { duration: 200 });
  };

  const handlePhoneChange = (text: string) => {
    onPhoneChange(text.replace(/[^\d]/g, ''));
  };

  return (
    <View style={{ gap: spacing.xs }}>
      <AnimatedView
        style={[
          styles.wrap,
          animatedBorderStyle,
          error ? styles.wrapError : null,
        ]}
      >
        <Pressable
          style={styles.countryBtn}
          onPress={() => setShowPicker(true)}
          accessibilityRole="button"
          accessibilityLabel={t('login.selectCountry')}
        >
          <GText style={styles.flag}>{selected.flag}</GText>
          <GText variant="bodySm" weight="semibold" color={colors.neutral[700]}>
            {selected.code}
          </GText>
          <Ionicons name="chevron-down" size={14} color={colors.neutral[500]} />
        </Pressable>

        <TextInput
          value={phone}
          onChangeText={handlePhoneChange}
          placeholder={placeholder ?? t('login.phonePlaceholder')}
          keyboardType="phone-pad"
          maxLength={countryCode === '+977' ? 10 : 15}
          placeholderTextColor={colors.neutral[400]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={styles.input}
        />
      </AnimatedView>

      {error ? (
        <GText variant="caption" color={colors.error.main}>
          {error}
        </GText>
      ) : null}

      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <GText variant="h4" color={colors.neutral[900]}>
                {t('login.selectCountry')}
              </GText>
              <Pressable onPress={() => setShowPicker(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={colors.neutral[600]} />
              </Pressable>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.code === countryCode;
                return (
                  <Pressable
                    style={[styles.countryRow, active && styles.countryRowActive]}
                    onPress={() => {
                      onCountryCodeChange(item.code);
                      setShowPicker(false);
                    }}
                  >
                    <GText style={styles.countryFlag}>{item.flag}</GText>
                    <GText variant="body" color={colors.neutral[800]} style={styles.countryName}>
                      {item.name}
                    </GText>
                    <GText variant="bodySm" weight="medium" color={colors.neutral[500]}>
                      {item.code}
                    </GText>
                    {active ? (
                      <Ionicons name="checkmark" size={18} color={colors.primary[600]} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    height: 52,
  },
  wrapError: {
    borderColor: colors.error.main,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: colors.neutral[150],
    backgroundColor: colors.neutral[50],
  },
  flag: {
    fontSize: 18,
    lineHeight: 22,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily,
    color: colors.neutral[900],
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
    height: '100%',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as object) : {}),
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 24,
          elevation: 8,
        }),
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[100],
  },
  countryRowActive: {
    backgroundColor: colors.primary[50],
  },
  countryFlag: {
    fontSize: 22,
    lineHeight: 26,
  },
  countryName: {
    flex: 1,
  },
});
