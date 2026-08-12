// GoPasal Seller Design System — Color Tokens
// Updated for Seller Command Center
// Primary: Deep Forest Green #236B51 (from reference images)

export const colors = {
  // ─── Primary — Deep Forest Green ──────────────────────────
  primary: {
    50: '#EBF5F0',
    100: '#C8E6D6',
    200: '#A0D4B9',
    300: '#78C29C',
    400: '#4FAF7F',
    500: '#236B51', // Main brand — extracted from reference
    600: '#1D5A44',
    700: '#174937',
    800: '#11382A',
    900: '#0B271D',
  },

  // ─── Header Gradient ─────────────────────────────────────
  header: {
    gradientStart: '#1D5A44',
    gradientMid: '#236B51',
    gradientEnd: '#3B9B74',
    text: '#FFFFFF',
    subtext: 'rgba(255,255,255,0.85)',
  },

  // ─── Neutrals ───────────────────────────────────────────
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    150: '#E8EEF3',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // ─── Surface / Background ──────────────────────────────
  surface: {
    background: '#F8FAFC', // Light off-white from reference
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    elevatedHover: '#F8FAFC',
    subtle: '#F1F5F9',
    overlay: 'rgba(15, 23, 42, 0.5)',
    tint: '#EBF5F0',
    headerArea: '#1D5A44',
  },

  // ─── Status Pills (from reference images) ──────────────
  status: {
    active: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
    pending: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
    outOfStock: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
    lowStock: { bg: '#FFEDD5', text: '#9A3412', border: '#FED7AA' },
    completed: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
    rejected: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
    underReview: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  },

  // ─── Semantic ───────────────────────────────────────────
  success: {
    light: '#DCFCE7',
    main: '#22C55E',
    dark: '#166534',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#92400E',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#991B1B',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1E40AF',
  },

  // ─── Google brand color ─────────────────────────────────
  google: {
    bg: '#FFFFFF',
    border: '#DADCE0',
    text: '#3C4043',
  },

  // ─── Legacy (backward compat) ───────────────────────────
  hero: {
    gradientStart: '#1D5A44',
    gradientMid: '#236B51',
    gradientEnd: '#3B9B74',
    text: '#FFFFFF',
    subtext: 'rgba(255,255,255,0.85)',
  },
  teal: {
    main: '#236B51',
    dark: '#1D5A44',
  },
  accent: {
    50: '#EBF5F0',
    100: '#C8E6D6',
    200: '#A0D4B9',
    300: '#78C29C',
    400: '#4FAF7F',
    500: '#236B51',
    600: '#1D5A44',
    700: '#174937',
    800: '#11382A',
    900: '#0B271D',
  },
  gold: {
    50: '#FFF9E6',
    100: '#FFF0B3',
    200: '#FFE580',
    300: '#FFD94D',
    400: '#FFCE1A',
    500: '#f3c46b',
    600: '#e6a800',
    700: '#b38400',
    800: '#806000',
    900: '#4d3a00',
  },
  mint: {
    50: '#EBF5F0',
    100: '#C8E6D6',
    200: '#A0D4B9',
    300: '#78C29C',
    400: '#4FAF7F',
  },
  brandBeige: {
    main: '#F1F5F9',
    light: '#F8FAFC',
  },
  star: {
    filled: '#F59E0B',
    empty: '#E2E8F0',
  },
} as const;

export type ColorToken = typeof colors;
