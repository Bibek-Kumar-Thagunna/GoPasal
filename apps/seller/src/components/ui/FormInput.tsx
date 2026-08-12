import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, FlatList, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../design-system/tokens/colors';
import { spacing, radius } from '../../design-system/tokens/spacing';

function Text({ style, children, ...props }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

// Country data
const COUNTRIES = [
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
];

interface FormInputProps {
  icon?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function FormInput({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  maxLength,
  autoCapitalize = 'none',
}: FormInputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        {icon && (
          <View style={styles.inputIcon}>
            <Ionicons name={icon as any} size={18} color={colors.primary[500]} />
          </View>
        )}
        <TextInput
          style={[styles.input, !icon && styles.inputNoIcon]}
          placeholder={placeholder ?? label}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          placeholderTextColor={colors.neutral[400]}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setIsSecure(!isSecure)} style={styles.eyeBtn}>
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.neutral[400]}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface PhoneInputProps {
  countryCode: string;
  phone: string;
  onCountryCodeChange: (code: string) => void;
  onPhoneChange: (phone: string) => void;
}

export function PhoneInput({
  countryCode,
  phone,
  onCountryCodeChange,
  onPhoneChange,
}: PhoneInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  return (
    <>
      <View style={styles.inputWrap}>
        <Pressable style={styles.countryPicker} onPress={() => setShowPicker(true)}>
          <Text style={styles.flagText}>{selectedCountry.flag}</Text>
          <Text style={styles.codeText}>{selectedCountry.code}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.neutral[500]} />
        </Pressable>
        <TextInput
          style={[styles.input, styles.phoneInput]}
          placeholder="Phone Number"
          value={phone}
          onChangeText={onPhoneChange}
          keyboardType="phone-pad"
          maxLength={15}
          placeholderTextColor={colors.neutral[400]}
        />
      </View>

      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Country</Text>
              <Pressable onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={22} color={colors.neutral[600]} />
              </Pressable>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.countryRow,
                    item.code === countryCode && styles.countryRowActive,
                  ]}
                  onPress={() => {
                    onCountryCodeChange(item.code);
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryCode}>{item.code}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    width: '100%',
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.sm,
    backgroundColor: colors.neutral[0],
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  inputIcon: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.neutral[150],
    backgroundColor: colors.neutral[50],
    alignSelf: 'stretch',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: spacing.md,
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[900],
  },
  inputNoIcon: {
    paddingLeft: spacing.lg,
  },
  phoneInput: {
    borderLeftWidth: 0,
  },
  eyeBtn: {
    paddingHorizontal: spacing.md,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.neutral[150],
    backgroundColor: colors.neutral[50],
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 18,
  },
  codeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.neutral[700],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 }),
  } as any,
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  pickerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.neutral[900],
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.neutral[100],
  },
  countryRowActive: {
    backgroundColor: colors.primary[50],
  },
  countryFlag: {
    fontSize: 22,
  },
  countryName: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[800],
    flex: 1,
  },
  countryCode: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.neutral[500],
  },
});
