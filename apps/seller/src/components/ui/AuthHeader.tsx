import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Modal, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../../design-system/tokens/colors';
import { useLanguageStore, Language } from '../../store/language.store';
import { useAuthStore } from '../../store/auth.store';
import Animated from 'react-native-reanimated';
import { LogoIcon } from '../illustrations/GoPasalLogo';
import { SignOutButton } from './SignOutButton';

function Text({ style, children, ...props }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Poppins', color: '#FFFFFF' }, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

const LANGUAGES = [
  { code: 'en' as Language, name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ne' as Language, name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
];

export function AuthHeader() {
  const { language, setLanguage, t } = useLanguageStore();
  const [showPicker, setShowPicker] = useState(false);
  const currentLang = LANGUAGES.find(l => l.code === language)!
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const handleLogoPress = async () => {
    if (isAuthenticated) {
      await logout();
    }
    router.replace('/(auth)/login');
  };

  return (
    <>
      <LinearGradient
        colors={['#1A4D3E', '#1D5A44', '#236B51', '#2D8B6A', '#48A882']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.3 }}
        style={styles.header}
      >
        {/* Decorative overlay shapes for organic feel */}
        <View style={styles.overlayCircle1} />
        <View style={styles.overlayCircle2} />

        <View style={styles.headerContent}>
          <Pressable
            style={styles.logoWrap}
            onPress={() => void handleLogoPress()}
            accessibilityRole="link"
            accessibilityLabel={t('auth.headerLogoA11y')}
          >
            <LogoIcon size={44} style={{ marginRight: 10 }} />
            <View style={styles.logoWordRow}>
              <Text style={styles.logoGo}>Go</Text>
              <Text style={styles.logoPasal}>Pasal</Text>
            </View>
          </Pressable>

          <View style={styles.headerActions}>
            {isAuthenticated ? <SignOutButton variant="onDark" /> : null}
            <Pressable style={styles.langBtn} onPress={() => setShowPicker(true)}>
              <Text style={styles.langFlag}>{currentLang.flag}</Text>
              <Text style={styles.langCode}>{currentLang.code.toUpperCase()}</Text>
              <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.8)" />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      {/* Language Picker Modal */}
      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{language === 'ne' ? 'भाषा छान्नुहोस्' : 'Select Language'}</Text>
              <Pressable onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={22} color={colors.neutral[600]} />
              </Pressable>
            </View>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.langRow,
                  lang.code === language && styles.langRowActive,
                ]}
                onPress={() => {
                  setLanguage(lang.code);
                  setShowPicker(false);
                }}
              >
                <Text style={styles.langRowFlag}>{lang.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.langRowName}>{lang.name}</Text>
                  <Text style={styles.langRowNative}>{lang.nativeName}</Text>
                </View>
                {lang.code === language && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'web' ? 16 : 8,
    paddingBottom: 16,
    paddingHorizontal: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  // Organic gradient overlay blobs
  overlayCircle1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  overlayCircle2: {
    position: 'absolute',
    bottom: -60,
    right: 100,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoWordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoGo: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 23,
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  logoPasal: {
    fontFamily: 'Poppins-ExtraBold',
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -1.1,
    marginLeft: 1,
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  langFlag: {
    fontSize: 16,
  },
  langCode: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    maxWidth: 340,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }
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
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.neutral[100],
  },
  langRowActive: {
    backgroundColor: colors.primary[50],
  },
  langRowFlag: {
    fontSize: 26,
  },
  langRowName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: colors.neutral[800],
  },
  langRowNative: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 2,
  },
});
