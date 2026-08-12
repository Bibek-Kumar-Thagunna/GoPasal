// GoPasal Design System — Color Tokens
// Brand identity: a warm, trustworthy neighborhood marketplace.
// Primary — Jade green (fresh, local, dependable).
// Accent — Marigold/saffron (Nepali warmth, festive energy; used sparingly).
// Surfaces — warm paper off-white so the UI feels human, not clinical.

export const colors = {
  // ─── Hero Gradient (refined jade, calm — not flashy) ────────
  hero: {
    gradientStart: '#0B6B50', // Deep jade (top-left)
    gradientMid: '#0E8060',   // Jade
    gradientEnd: '#1E9E7C',   // Bright jade (bottom-right)
    text: '#FFFFFF',
    subtext: 'rgba(255,255,255,0.85)',
  },

  // ─── Primary (Brand jade green — buttons, links, active) ────
  primary: {
    50: '#E7F5F0',
    100: '#C2E8DC',
    200: '#8FD4C0',
    300: '#54BC9F',
    400: '#1E9E7C',
    500: '#0E8060', // Brand jade — primary actions
    600: '#0B6B50',
    700: '#0A5540',
    800: '#073F30',
    900: '#04261D',
  },

  // ─── Gold / Mustard (Membership "Gold" CTA) ─────────────────
  gold: {
    50: '#FFF8E7',
    100: '#FCEBBF',
    200: '#F7D98C',
    300: '#F1C75A',
    400: '#EDB836',
    500: '#E3A41A', // Membership accent
    600: '#C2860F',
    700: '#97670C',
    800: '#6E4B08',
    900: '#463004',
  },

  // ─── Accent (Marigold/saffron — highlights, badges, active) ─
  accent: {
    50: '#FEF6E7',
    100: '#FDE9BF',
    200: '#FBD688',
    300: '#F9C351',
    400: '#F7B335',
    500: '#F5A524', // Warm marigold — sparingly used
    600: '#D9870F',
    700: '#B36A0B',
    800: '#8A5108',
    900: '#5E3704',
  },

  // ─── Neutrals (warm-tinted greys) ───────────────────────────
  neutral: {
    0: '#FFFFFF',
    50: '#FBFAF8',
    100: '#F4F3EF',
    150: '#EDEBE5',
    200: '#E5E3DC',
    300: '#D0CDC4',
    400: '#A6A39A',
    500: '#7A766D',
    600: '#585550',
    700: '#3C3A36',
    800: '#26241F',
    900: '#16140F',
  },

  // ─── Surface / Background ───────────────────────────────────
  surface: {
    background: '#FBF9F4', // Warm paper
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    elevatedHover: '#FAF8F2',
    subtle: '#F3F1EA',
    overlay: 'rgba(22, 20, 15, 0.5)',
    tint: '#EFF6F2', // Faint jade wash
    heroArea: '#0B6B50',
  },

  // ─── Semantic ───────────────────────────────────────────────
  success: {
    light: '#E7F5EE',
    main: '#15A05E',
    dark: '#0C7A45',
  },
  warning: {
    light: '#FEF6E7',
    main: '#E3A41A',
    dark: '#B37F12',
  },
  error: {
    light: '#FDECEA',
    main: '#E04A3A',
    dark: '#B5301F',
  },
  info: {
    light: '#E7F1FB',
    main: '#2E7DD1',
    dark: '#1E5C9E',
  },

  // ─── Star Rating ────────────────────────────────────────────
  star: {
    filled: '#F5A524',
    empty: '#E5E3DC',
  },

  // ─── Legacy aliases (kept so existing components don't break) ──
  teal: {
    main: '#0E8060',
    dark: '#0B6B50',
  },
  brandBeige: {
    main: '#F1ECE2',
    light: '#F8F4EC',
  },
  mint: {
    50: '#E7F5F0',
    100: '#C2E8DC',
    200: '#8FD4C0',
    300: '#54BC9F',
    400: '#1E9E7C',
  },
} as const;

export type ColorToken = typeof colors;

// Convenience brand shortcuts for fast, consistent usage in new code.
export const brand = {
  green: colors.primary[500],
  greenDark: colors.primary[600],
  greenSoft: colors.primary[50],
  marigold: colors.accent[500],
  paper: colors.surface.background,
  ink: colors.neutral[900],
} as const;
