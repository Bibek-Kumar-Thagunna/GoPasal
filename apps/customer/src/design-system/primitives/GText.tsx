import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { webStaticTextProps } from '@gopasal/ui';
import { typography } from '../tokens/typography';
import { colors } from '../tokens/colors';

type TypographyPreset = keyof typeof typography.presets;

interface GTextProps extends RNTextProps {
  variant?: TypographyPreset;
  color?: string;
  align?: 'left' | 'center' | 'right';
  weight?: keyof typeof typography.fontWeight;
}

// Resolve color strings like 'neutral.900' or raw hex values
function resolveColor(color: string): string {
  if (!color.includes('.')) return color;
  const [group, shade] = color.split('.') as [string, string];
  const colorGroup = (colors as any)[group];
  if (!colorGroup) return color;
  return colorGroup[shade] ?? color;
}

export function GText({
  variant = 'body',
  color = colors.neutral[900],
  align = 'left',
  weight,
  style,
  selectable,
  children,
  ...props
}: GTextProps) {
  const preset = typography.presets[variant];
  const resolvedColor = resolveColor(color);
  const { selectable: resolvedSelectable, style: webStaticStyle } = webStaticTextProps({ selectable });

  return (
    <RNText
      style={[
        {
          ...preset,
          color: resolvedColor,
          textAlign: align,
          ...(weight ? { fontWeight: typography.fontWeight[weight] } : {}),
        },
        webStaticStyle,
        style,
      ]}
      selectable={resolvedSelectable}
      {...props}
    >
      {children}
    </RNText>
  );
}
