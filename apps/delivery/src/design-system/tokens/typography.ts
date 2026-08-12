import { Platform } from 'react-native';

// Fonts loaded via @expo-google-fonts in app/_layout.tsx
// Key names MUST match keys passed to useFonts()

const poppinsFamily = Platform.select({
  ios: 'Poppins',
  android: 'Poppins',
  web: '"Poppins", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'Poppins',
});

const interFamily = Platform.select({
  ios: 'Inter',
  android: 'Inter',
  web: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'Inter',
});

// Font family tokens
export const fontFamilies = {
  display: poppinsFamily,     // Headings, hero text, section titles
  body: interFamily,          // Body copy, labels, captions
  mono: Platform.select({
    web: '"SF Mono", "Fira Code", monospace',
    default: 'monospace',
  }),
} as const;

// Legacy compat: default fontFamily is Poppins
export const fontFamily = poppinsFamily;

export const typography = {
  fontFamily: poppinsFamily,
  fontFamilyBody: interFamily,

  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
    '4xl': 42,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 1.5,   // For section labels like "POPULAR NEAR YOU"
  },

  // Style presets — used in GText component
  presets: {
    displayLg: {
      fontFamily: poppinsFamily,
      fontSize: 42,
      fontWeight: '800' as const,
      lineHeight: 50,
      letterSpacing: -0.5,
    },
    displayMd: {
      fontFamily: poppinsFamily,
      fontSize: 34,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.3,
    },
    h1: {
      fontFamily: poppinsFamily,
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
      letterSpacing: -0.2,
    },
    h2: {
      fontFamily: poppinsFamily,
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 30,
    },
    h3: {
      fontFamily: poppinsFamily,
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    h4: {
      fontFamily: poppinsFamily,
      fontSize: 17,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    bodyLg: {
      fontFamily: interFamily,
      fontSize: 17,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    body: {
      fontFamily: interFamily,
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodySm: {
      fontFamily: interFamily,
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    caption: {
      fontFamily: interFamily,
      fontSize: 11,
      fontWeight: '500' as const,
      lineHeight: 14,
      letterSpacing: 0.3,
    },
    overline: {
      fontFamily: poppinsFamily,
      fontSize: 11,
      fontWeight: '600' as const,
      lineHeight: 14,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
    },
    // Section labels like "POPULAR NEAR YOU"
    sectionLabel: {
      fontFamily: poppinsFamily,
      fontSize: 13,
      fontWeight: '600' as const,
      lineHeight: 18,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
    },
    button: {
      fontFamily: poppinsFamily,
      fontSize: 15,
      fontWeight: '600' as const,
      lineHeight: 20,
      letterSpacing: 0.3,
    },
    buttonSm: {
      fontFamily: poppinsFamily,
      fontSize: 13,
      fontWeight: '600' as const,
      lineHeight: 18,
      letterSpacing: 0.2,
    },
  },
} as const;

export type TypographyToken = typeof typography;
