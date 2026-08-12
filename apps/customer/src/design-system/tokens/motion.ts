export const motion = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 700,
  },
  easing: {
    easeOut: [0.25, 0.46, 0.45, 0.94] as const,
    easeIn: [0.55, 0.085, 0.68, 0.53] as const,
    easeInOut: [0.645, 0.045, 0.355, 1] as const,
    spring: [0.175, 0.885, 0.32, 1.275] as const,
    bounce: [0.68, -0.55, 0.265, 1.55] as const,
  },
  spring: {
    gentle: { damping: 20, stiffness: 150, mass: 1 },
    snappy: { damping: 15, stiffness: 300, mass: 0.8 },
    bouncy: { damping: 10, stiffness: 200, mass: 0.8 },
    slow: { damping: 25, stiffness: 100, mass: 1.2 },
  },
} as const;

export type MotionToken = typeof motion;
