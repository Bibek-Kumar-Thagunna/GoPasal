// GoPasal Design System — Color Tokens
// Source: Reference image palette extraction
// Hero: Slate-purple #4a4e8a → Peach #f1a17b → Warm off-white #fbf8f1

export const colors = {
  // ─── Hero Gradient ──────────────────────────────────────────
  hero: {
    gradientStart: '#4a4e8a', // Deep slate-purple (top-left)
    gradientMid: '#e88b64',   // Warm peach/orange (right)
    gradientEnd: '#f1a17b',   // Soft peach
    text: '#FFFFFF',
    subtext: 'rgba(255,255,255,0.85)',
  },

  // ─── Primary (Teal/Slate button color) ──────────────────────
  primary: {
    50: '#EEF2F5',
    100: '#C8D5DD',
    200: '#A2B8C6',
    300: '#7C9BAE',
    400: '#567E97',
    500: '#3b596d', // "Add" button color from reference
    600: '#2e4757',
    700: '#223541',
    800: '#16232b',
    900: '#0a1116',
  },

  // ─── Gold / Mustard (Join Gold CTA) ─────────────────────────
  gold: {
    50: '#FFF9E6',
    100: '#FFF0B3',
    200: '#FFE580',
    300: '#FFD94D',
    400: '#FFCE1A',
    500: '#f3c46b', // "Join Gold" button — exact from reference
    600: '#e6a800',
    700: '#b38400',
    800: '#806000',
    900: '#4d3a00',
  },

  // ─── Accent Orange (Active tab, CTAs) ───────────────────────
  accent: {
    50: '#FFF0EB',
    100: '#FFD5C2',
    200: '#FFB899',
    300: '#FF9B70',
    400: '#FF7E47',
    500: '#FF6B35', // Active tab state, warm orange
    600: '#E55520',
    700: '#CC4010',
    800: '#B32B00',
    900: '#991600',
  },

  // ─── Neutrals ───────────────────────────────────────────────
  neutral: {
    0: '#FFFFFF',
    50: '#FBFAF8',
    100: '#F5F4F0',
    150: '#EFEEE9',
    200: '#E8E7E0',
    300: '#D1CFCA',
    400: '#A8A6A0',
    500: '#7C7A74',
    600: '#5C5A55',
    700: '#3D3C38',
    800: '#2A2927',
    900: '#1A1918',
  },

  // ─── Surface / Background ───────────────────────────────────
  surface: {
    background: '#fbf8f1', // Warm off-white from reference
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    elevatedHover: '#FAFAF8',
    subtle: '#F4F2EC',
    overlay: 'rgba(26, 25, 24, 0.5)',
    tint: '#F2F0E8',
    heroArea: '#4a4e8a', // Used for SafeAreaView behind gradient
  },

  // ─── Semantic ───────────────────────────────────────────────
  success: {
    light: '#E8F8EE',
    main: '#2ECC71',
    dark: '#1A9C50',
  },
  warning: {
    light: '#FFF8E6',
    main: '#F5A623',
    dark: '#C4841C',
  },
  error: {
    light: '#FDECEA',
    main: '#E74C3C',
    dark: '#C0392B',
  },
  info: {
    light: '#E8F4FD',
    main: '#3498DB',
    dark: '#2176AE',
  },

  // ─── Star Rating ────────────────────────────────────────────
  star: {
    filled: '#F5A623',
    empty: '#E2E0DA',
  },

  // ─── Legacy aliases (kept for backward compat with existing components) ──
  teal: {
    main: '#3b596d',
    dark: '#2e4757',
  },
  brandBeige: {
    main: '#F4ECE4',
    light: '#F8F3EC',
  },
  mint: {
    50: '#F0F2F5',
    100: '#D4DCE5',
    200: '#A8B9CB',
    300: '#7C96B1',
    400: '#507397',
  },
} as const;

export type ColorToken = typeof colors;
