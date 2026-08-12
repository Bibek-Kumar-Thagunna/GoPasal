import { useEffect } from 'react';
import { Platform, type TextProps } from 'react-native';

const STYLE_ID = 'gopasal-web-static-text';

const WEB_STATIC_TEXT_CSS = `
html, body {
  user-select: none;
  -webkit-user-select: none;
}

input,
textarea,
select,
[contenteditable="true"],
[data-selectable="true"] {
  user-select: text !important;
  -webkit-user-select: text !important;
}
`;

/** Injects global CSS on web so static UI text does not show a text caret on click. */
export function WebSelectionGuard() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      styleEl.textContent = WEB_STATIC_TEXT_CSS;
      document.head.appendChild(styleEl);
    }

    return () => {
      styleEl?.remove();
    };
  }, []);

  return null;
}

type StaticTextProps = Pick<TextProps, 'selectable'>;

/** Default props/styles for non-editable text on web (RN Web Text does not disable selection by default). */
export function webStaticTextProps({ selectable }: StaticTextProps = {}) {
  if (Platform.OS !== 'web' || selectable === true) {
    return { selectable, style: undefined as { userSelect: 'none' } | undefined };
  }

  return {
    selectable: false as const,
    style: { userSelect: 'none' as const },
  };
}
