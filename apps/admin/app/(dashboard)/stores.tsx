import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/services/api';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';

function T({ style, children, n }: any) {
  return <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Poppins', color: colors.neutral[900] }, style]}>{children}</Animated.Text>;
}

export default function StoresScreen() {
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/store/all');
      return data || [];
    },
    retry: 1,
  });

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <T style={styles.title}>Stores</T>
      </View>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1f3a" />
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(400)} style={styles.card}>
              <View style={styles.iconBox}>
                <Ionicons name="storefront" size={24} color={colors.accent[500]} />
              </View>
              <View style={styles.info}>
                <T style={styles.name}>{item.name}</T>
                <T style={styles.address}>{item.address}</T>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACTIVE' ? colors.success.main + '20' : colors.neutral[200] }]}>
                  <T style={[styles.statusText, { color: item.status === 'ACTIVE' ? colors.success.dark : colors.neutral[600] }]}>{item.status}</T>
                </View>
              </View>
            </Animated.View>
          )}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="storefront-outline" size={48} color={colors.neutral[300]} />
              <T style={styles.emptyText}>No stores found</T>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: { paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent[500] + '15', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, alignItems: 'flex-start' },
  name: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.neutral[900] },
  address: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500], marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.xs },
  statusText: { fontFamily: 'Inter-Medium', fontSize: 10 },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[400] },
});
