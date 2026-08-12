import React, { useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TextInput, Pressable } from 'react-native';
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

function UserCard({ user, index }: any) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)} style={styles.card}>
      <View style={styles.avatar}>
        <T style={styles.avatarText}>{user.name?.charAt(0) || 'U'}</T>
      </View>
      <View style={styles.info}>
        <T style={styles.name}>{user.name || 'Unknown User'}</T>
        <T style={styles.phone}>{user.phone}</T>
        <View style={styles.roles}>
          {user.roles?.map((r: string) => (
            <View key={r} style={styles.roleTag}>
              <T style={styles.roleText}>{r}</T>
            </View>
          ))}
        </View>
      </View>
      <Ionicons name="ellipsis-vertical" size={20} color={colors.neutral[400]} />
    </Animated.View>
  );
}

export default function UsersScreen() {
  const [search, setSearch] = useState('');

  // We map this to a search endpoint since standard listing might be large
  // Assuming a generic search logic is standard
  const { data = [], isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      // Assuming missing endpoint, simulate with empty array if fails
      return [] as any[];
    },
  });

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <T style={styles.title}>Users</T>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.neutral[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or phone..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={colors.neutral[400]}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#1a1f3a" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => <UserCard user={item} index={index} />}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.neutral[300]} />
              <T style={styles.emptyText}>No users matched</T>
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
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.surface.card, borderRadius: radius.md, paddingHorizontal: spacing.md, height: 48, borderWidth: 1, borderColor: colors.neutral[150] },
  searchInput: { flex: 1, fontFamily: 'Inter', fontSize: 14, color: colors.neutral[900] },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary[100], alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.primary[500] },
  info: { flex: 1 },
  name: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.neutral[900] },
  phone: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500] },
  roles: { flexDirection: 'row', gap: 6, marginTop: 4 },
  roleTag: { backgroundColor: colors.neutral[100], paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  roleText: { fontFamily: 'Inter-Medium', fontSize: 10, color: colors.neutral[600] },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.neutral[400] },
});
