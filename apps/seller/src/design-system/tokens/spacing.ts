export const spacing = {
  0: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
  '7xl': 80,
  '8xl': 96,
} as const;

export const radius = {
  none: 0,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  pill: 999,
} as const;

export type SpacingToken = typeof spacing;
export type RadiusToken = typeof radius;
