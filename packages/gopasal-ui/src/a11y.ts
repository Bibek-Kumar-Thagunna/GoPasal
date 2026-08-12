import { Platform } from 'react-native';

/**
 * Extra styles for web inputs so keyboard users get a visible focus ring.
 * Safe no-op on native (outline is ignored).
 */
export const webInputFocusRing =
  Platform.OS === 'web'
    ? ({
        outlineWidth: 2,
        outlineStyle: 'solid' as const,
        outlineColor: '#236B51',
        outlineOffset: 2,
      } as const)
    : {};
