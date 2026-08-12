import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { webPageContainer } from '../utils/web-layout';

type WebPageShellProps = {
  children: React.ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
};

/** Centers page content on web with a max width; full-width on native. */
export function WebPageShell({ children, maxWidth, style }: WebPageShellProps) {
  return <View style={[styles.shell, webPageContainer(maxWidth), style]}>{children as any}</View>;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: '100%',
  },
});
