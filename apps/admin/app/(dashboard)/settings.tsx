import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';

function T({ style, children }: any) {
  return <Animated.Text style={[{ fontFamily: 'Poppins', color: colors.neutral[900] }, style]}>{children}</Animated.Text>;
}

export default function AdminSettingsScreen() {
  const { logout, user } = useAuthStore();

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <T style={styles.title}>System Settings</T>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <T style={styles.sectionTitle}>Administrator Profile</T>
          <View style={styles.card}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <T style={styles.avatarText}>{user?.name?.charAt(0) || 'A'}</T>
              </View>
              <View>
                <T style={styles.name}>{user?.name || 'Admin User'}</T>
                <T style={styles.phone}>{user?.phone || 'No phone set'}</T>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginTop: spacing.xl }}>
          <T style={styles.sectionTitle}>System Operations</T>
          <View style={styles.card}>
            {[
              { icon: 'settings-outline', color: colors.primary[500], label: 'Global Configuration' },
              { icon: 'shield-checkmark-outline', color: colors.accent[500], label: 'Role & Permissions' },
              { icon: 'notifications-outline', color: colors.warning.main, label: 'System Alerts' },
              { icon: 'server-outline', color: colors.info.main, label: 'Database Status' },
            ].map((item, i) => (
              <Pressable key={i} style={[styles.menuItem, i !== 0 && styles.menuBorder]}>
                <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <T style={styles.menuText}>{item.label}</T>
                <Ionicons name="chevron-forward" size={18} color={colors.neutral[300]} style={{ marginLeft: 'auto' }} />
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginTop: spacing.xl }}>
          <View style={styles.card}>
            <Pressable style={styles.menuItem} onPress={logout}>
              <View style={[styles.menuIcon, { backgroundColor: colors.error.light }]}>
                <Ionicons name="log-out-outline" size={20} color={colors.error.main} />
              </View>
              <T style={styles.menuTextDestructive}>Sign out securely</T>
            </Pressable>
          </View>
        </Animated.View>

        <T style={styles.versionInfo}>GoPasal Terminal v2.0.0{'\n'}Environment: Production</T>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: { paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  content: { padding: spacing.lg },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: colors.neutral[500], letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.md, marginLeft: spacing.xs },
  card: { backgroundColor: colors.surface.card, borderRadius: radius.xl, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1a1f3a', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Poppins-Bold', fontSize: 24, color: '#fff' },
  name: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[900] },
  phone: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500] },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm },
  menuBorder: { borderTopWidth: 1, borderTopColor: colors.neutral[150] },
  menuIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  menuText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.neutral[800] },
  menuTextDestructive: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.error.main },
  versionInfo: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[400], textAlign: 'center', marginTop: spacing['3xl'], marginBottom: spacing.xl, lineHeight: 18 },
});
