import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { webStaticTextProps } from '@gopasal/ui';
import { colors } from '../design-system/tokens/colors';
import { fontFamilies } from '../design-system/tokens/typography';

interface GTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
}

export const GText = ({ style, weight = 'regular', selectable, children, ...props }: GTextProps) => {
  let fontFamily = fontFamilies.body;
  let fontWeight: any = '400';
  if (weight === 'medium') fontWeight = '500';
  if (weight === 'semiBold') fontWeight = '600';
  if (weight === 'bold') fontWeight = '700';
  const isHeader = StyleSheet.flatten(style)?.fontSize && StyleSheet.flatten(style).fontSize! >= 16;
  if (isHeader) fontFamily = fontFamilies.display;

  const { selectable: resolvedSelectable, style: webStaticStyle } = webStaticTextProps({ selectable });

  return (
    <Text
      style={[{ fontFamily, fontWeight, color: colors.neutral[900] }, webStaticStyle, style]}
      selectable={resolvedSelectable}
      {...props}
    >
      {children}
    </Text>
  );
};
