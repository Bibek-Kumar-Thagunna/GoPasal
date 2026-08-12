import { Platform, type ViewStyle } from 'react-native';

export const WEB_PAGE_MAX_WIDTH = 800;
export const WEB_PAGE_MAX_WIDTH_WIDE = 1200;

export function webPageContainer(maxWidth = WEB_PAGE_MAX_WIDTH): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return { maxWidth, width: '100%', alignSelf: 'center' };
}

export function isWebLayout(): boolean {
  return Platform.OS === 'web';
}
