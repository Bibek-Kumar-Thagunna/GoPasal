import React from 'react';
import { View, ViewProps, Dimensions, Platform, StyleSheet } from 'react-native';
import { spacing } from '../tokens/spacing';
import { colors } from '../tokens/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ContainerProps extends ViewProps {
  padded?: boolean;
  centered?: boolean;
  maxWidth?: number;
}

export function Container({
  padded = true,
  centered = false,
  maxWidth = 1200,
  style,
  children,
  ...props
}: ContainerProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.surface.background,
          ...(padded ? { paddingHorizontal: spacing.lg } : {}),
          ...(centered
            ? { alignItems: 'center' }
            : {}),
          ...(Platform.OS === 'web'
            ? { maxWidth, alignSelf: 'center' as const, width: '100%' as any }
            : {}),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

interface SectionProps extends ViewProps {
  gap?: keyof typeof spacing;
  horizontal?: boolean;
}

export function Section({
  gap = 'lg',
  horizontal = false,
  style,
  children,
  ...props
}: SectionProps) {
  return (
    <View
      style={[
        {
          gap: spacing[gap],
          flexDirection: horizontal ? 'row' : 'column',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

interface RowProps extends ViewProps {
  gap?: keyof typeof spacing;
  align?: 'center' | 'flex-start' | 'flex-end' | 'stretch';
  justify?: 'center' | 'flex-start' | 'flex-end' | 'space-between' | 'space-around';
  wrap?: boolean;
}

export function Row({
  gap = 'sm',
  align = 'center',
  justify = 'flex-start',
  wrap = false,
  style,
  children,
  ...props
}: RowProps) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: align,
          justifyContent: justify,
          gap: spacing[gap],
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

interface SpacerProps {
  size?: keyof typeof spacing;
  horizontal?: boolean;
}

export function Spacer({ size = 'lg', horizontal = false }: SpacerProps) {
  return (
    <View
      style={{
        [horizontal ? 'width' : 'height']: spacing[size],
      }}
    />
  );
}

interface DividerProps {
  color?: string;
  thickness?: number;
  spacing?: number;
}

export function Divider({
  color = colors.neutral[150],
  thickness = 1,
  spacing: divSpacing = 0,
}: DividerProps) {
  return (
    <View
      style={{
        height: thickness,
        backgroundColor: color,
        marginVertical: divSpacing,
      }}
    />
  );
}
