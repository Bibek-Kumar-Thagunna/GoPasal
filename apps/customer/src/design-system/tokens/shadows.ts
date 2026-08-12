import { Platform } from 'react-native';

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    web: {
      boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 1px 4px -2px rgba(0, 0, 0, 0.04)',
    } as any,
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    web: {
      boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.06), 0 4px 12px -4px rgba(0, 0, 0, 0.04)',
    } as any,
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
    android: { elevation: 12 },
    web: {
      boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.08), 0 8px 16px -8px rgba(0, 0, 0, 0.04)',
    } as any,
    default: {},
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.1,
      shadowRadius: 32,
    },
    android: { elevation: 16 },
    web: {
      boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.1), 0 12px 24px -12px rgba(0, 0, 0, 0.06)',
    } as any,
    default: {},
  }),
  float: Platform.select({
    ios: {
      shadowColor: '#1ABFAD', // Subtle mint glow
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.2,
      shadowRadius: 32,
    },
    android: { elevation: 24 },
    web: {
      boxShadow: '0 20px 40px -10px rgba(26, 191, 173, 0.2), 0 8px 20px -10px rgba(26, 191, 173, 0.15)',
    } as any,
    default: {},
  }),
} as const;

export type ShadowToken = typeof shadows;
