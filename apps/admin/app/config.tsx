import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GText } from '../src/components/GText';
import { colors } from '../src/design-system/tokens/colors';
import { spacing } from '../src/design-system/tokens/spacing';

export default function AdminConfigScreen() {
  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <GText style={styles.title} weight="bold">Global Configuration</GText>
        <GText style={styles.desc}>Manage platform fees, geo-boundaries, and feature flags.</GText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  content: { padding: spacing.lg },
  title: { fontSize: 24, marginBottom: spacing.sm },
  desc: { fontSize: 14, color: colors.neutral[600] },
});
