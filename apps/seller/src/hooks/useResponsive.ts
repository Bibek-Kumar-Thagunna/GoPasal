import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useResponsive() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => sub?.remove();
  }, []);

  const width = dimensions.width;
  const breakpoint: Breakpoint =
    width >= 1024 ? 'desktop' : width >= 768 ? 'tablet' : 'mobile';

  return {
    width,
    height: dimensions.height,
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isWeb: Platform.OS === 'web',
  };
}
