import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors } from '../design-system/tokens/colors';
import { fontFamilies } from '../design-system/tokens/typography';

interface GTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
}

export const GText = ({ style, weight = 'regular', children, ...props }: GTextProps) => {
  let fontFamily = fontFamilies.body;
  let fontWeight: any = '400';
  if (weight === 'medium') fontWeight = '500';
  if (weight === 'semiBold') fontWeight = '600';
  if (weight === 'bold') fontWeight = '700';
  const isHeader = StyleSheet.flatten(style)?.fontSize && StyleSheet.flatten(style).fontSize! >= 16;
  if (isHeader) fontFamily = fontFamilies.display;
  return (
    <Text style={[{ fontFamily, fontWeight, color: colors.neutral[900] }, style]} {...props}>
      {children}
    </Text>
  );
};
