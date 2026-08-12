import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import { useAuthStore } from '../../src/store/auth.store';
import apiClient, { unwrapApi } from '../../src/services/api';

type DashboardStats = {
  totalUsers: number;
  activeStores: number;
  totalOrders: number;
  totalRevenue: number;
};

const FALLBACK_STATS: DashboardStats = {
  totalUsers: 0,
  activeStores: 0,
  totalOrders: 0,
  totalRevenue: 0,
};

function T({ style, children, n }: any) {
  return <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Poppins', color: colors.neutral[900] }, style]}>{children}</Animated.Text>;
}

function StatBox({ label, value, icon, color, delay }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.statBox}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <T style={styles.statValue}>{value}</T>
      <T style={styles.statLabel}>{label}</T>
    </Animated.View>
  );
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(FALLBACK_STATS);

  const loadStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/analytics/dashboard');
      const data = unwrapApi<DashboardStats>(res);
      setStats(data);
    } catch {
      setStats(FALLBACK_STATS);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <LinearGradient colors={['#1a1f3a', '#10142b']} style={styles.header}>
        <View>
          <T style={styles.greeting}>Administrator Dashboard</T>
          <T style={styles.userName}>{user?.name || 'Super Admin'}</T>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a1f3a" />}
      >
        <T style={styles.sectionTitle}>System Overview</T>
        <View style={styles.grid}>
          <StatBox label="Total Users" value={stats.totalUsers.toLocaleString()} icon="people" color={colors.primary[500]} delay={100} />
          <StatBox label="Active Stores" value={stats.activeStores.toLocaleString()} icon="storefront" color={colors.accent[500]} delay={150} />
          <StatBox label="Total Orders" value={stats.totalOrders.toLocaleString()} icon="receipt" color={colors.success.main} delay={200} />
          <StatBox label="Platform Revenue" value={`NPR ${Math.round(stats.totalRevenue / 1000)}k`} icon="cash" color={colors.gold[500]} delay={250} />
        </View>

        <T style={styles.sectionTitle}>Pending Actions</T>
        <Pressable style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: colors.warning.main + '20' }]}>
            <Ionicons name="alert-circle" size={24} color={colors.warning.main} />
          </View>
          <View style={{ flex: 1 }}>
            <T style={styles.actionTitle}>Review Moderation Queue</T>
            <T style={styles.actionSub}>Open the Reviews tab to moderate content</T>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.neutral[300]} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing['2xl'], paddingVertical: spacing.xl },
  greeting: { fontFamily: 'Inter', fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  userName: { fontFamily: 'Poppins-Bold', fontSize: 24, color: '#fff', marginTop: 2 },
  headerBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing['2xl'] },
  sectionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: colors.neutral[500], letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: spacing.md, marginTop: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statBox: { flex: 1, minWidth: '45%', backgroundColor: colors.surface.card, padding: spacing.xl, borderRadius: radius.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  statIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  statValue: { fontFamily: 'Poppins-Bold', fontSize: 22, color: colors.neutral[900] },
  statLabel: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.neutral[500], marginTop: 2 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.card, padding: spacing.lg, borderRadius: radius.lg, gap: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.neutral[900] },
  actionSub: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500] },
});
