import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import apiClient from '../../src/services/api';

function T({ style, children, n }: any) {
  return (
    <Animated.Text
      numberOfLines={n}
      style={[{ fontFamily: 'Poppins', color: colors.neutral[900] }, style]}
    >
      {children}
    </Animated.Text>
  );
}

type HistoryTask = {
  taskId: string;
  status: string;
  orderId: string;
  storeName: string;
  deliveryAddress: string | null;
  codAmount: string | null;
  codCollected: boolean | null;
  createdAt: string;
  deliveredAt: string | null;
};

export default function HistoryScreen() {
  const { data: history = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['rider-tasks-history'],
    queryFn: async () => {
      const { data } = await apiClient.get('/riders/tasks/history?limit=50');
      return (data?.data ?? []) as HistoryTask[];
    },
  });

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <T style={styles.title}>Delivery History</T>
        <T style={styles.subtitle}>{history.length} completed route{history.length === 1 ? '' : 's'}</T>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a3a2a" />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.taskId}
          renderItem={({ item, index }) => {
            const cod = item.codAmount != null && Number(item.codAmount) > 0;
            const collected = item.codCollected === true;
            return (
              <Animated.View entering={FadeInDown.delay(index * 40).duration(350)} style={styles.card}>
                <View style={styles.cardHead}>
                  <T style={styles.orderId} n={1}>
                    #{item.orderId.slice(-8).toUpperCase()}
                  </T>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: item.status === 'DELIVERED' ? colors.success.light : colors.warning.light },
                    ]}
                  >
                    <T
                      style={[
                        styles.statusText,
                        { color: item.status === 'DELIVERED' ? colors.success.dark : colors.warning.dark },
                      ]}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </T>
                  </View>
                </View>
                <View style={styles.row}>
                  <Ionicons name="storefront-outline" size={14} color={colors.neutral[500]} />
                  <T style={styles.rowText} n={1}>{item.storeName}</T>
                </View>
                {item.deliveryAddress ? (
                  <View style={styles.row}>
                    <Ionicons name="location-outline" size={14} color={colors.neutral[500]} />
                    <T style={styles.rowText} n={2}>{item.deliveryAddress}</T>
                  </View>
                ) : null}
                <View style={styles.cardFoot}>
                  {cod ? (
                    <T style={[styles.cod, { color: collected ? colors.success.dark : colors.warning.dark }]}>
                      {collected ? 'COD collected' : `COD ${item.codAmount}`}
                    </T>
                  ) : (
                    <T style={styles.muted}>No COD</T>
                  )}
                  {item.deliveredAt ? (
                    <T style={styles.muted}>
                      {new Date(item.deliveredAt).toLocaleDateString()}
                    </T>
                  ) : null}
                </View>
              </Animated.View>
            );
          }}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="documents-outline" size={48} color={colors.neutral[300]} />
              <T style={styles.emptyText}>No past deliveries</T>
              <T style={styles.emptySub}>Completed routes will appear here with COD details.</T>
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
  subtitle: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500], marginTop: 2 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing['3xl'] },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { flex: 1, fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.neutral[900] },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { fontFamily: 'Inter-SemiBold', fontSize: 11, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  rowText: { flex: 1, fontFamily: 'Inter', fontSize: 13, color: colors.neutral[600] },
  cardFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  cod: { fontFamily: 'Inter-SemiBold', fontSize: 12 },
  muted: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[400] },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[400] },
  emptySub: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[400], textAlign: 'center' },
});
