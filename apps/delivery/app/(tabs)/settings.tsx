import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import apiClient from '../../src/services/api';

function T({ style, children }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Poppins', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

const VEHICLE_TYPES = [
  { id: 'EV_BIKE', label: 'EV Bike' },
  { id: 'EV_SCOOTER', label: 'EV Scooter' },
  { id: 'MOTORBIKE', label: 'Motorbike' },
  { id: 'BICYCLE', label: 'Bicycle' },
] as const;

export default function DeliverySettingsScreen() {
  const { logout, user } = useAuthStore();
  const qc = useQueryClient();

  const [vehicleType, setVehicleType] = useState<string>('EV_BIKE');
  const [licensePlate, setLicensePlate] = useState('');

  const {
    data: rider,
    isLoading: riderLoading,
    isError: riderError,
  } = useQuery({
    queryKey: ['rider-me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/riders/me');
      return data?.data ?? null;
    },
    retry: false,
  });

  const onboard = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/riders/onboard', {
        vehicleType,
        licensePlate: licensePlate.trim(),
      });
      return data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rider-me'] });
      Alert.alert('Onboarded', 'Your rider profile is ready. Turn on duty status to receive routes.');
    },
    onError: (err: any) => {
      Alert.alert(
        'Onboarding failed',
        err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Could not onboard. Try again.'
      );
    },
  });

  const setDuty = useMutation({
    mutationFn: async (status: string) => {
      await apiClient.put('/riders/status', { status });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rider-me'] }),
    onError: (err: any) => {
      Alert.alert(
        'Status update failed',
        err?.response?.data?.error?.message ?? err?.response?.data?.message ?? 'Could not update duty status.'
      );
    },
  });

  const isOnboarded = !!rider;
  const isOnline = String(rider?.status ?? '').toUpperCase() === 'ONLINE';

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.header}>
        <T style={styles.title}>Rider Profile</T>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {riderLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#1a3a2a" />
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(100).duration(400)}>
              <View style={styles.card}>
                <View style={styles.profileRow}>
                  <View style={styles.avatar}>
                    <T style={styles.avatarText}>{user?.name?.charAt(0) || 'R'}</T>
                  </View>
                  <View>
                    <T style={styles.name}>{user?.name || 'Delivery Rider'}</T>
                    <T style={styles.phone}>{user?.phone || 'No phone set'}</T>
                  </View>
                </View>

                {isOnboarded ? (
                  <>
                    <View style={styles.riderMeta}>
                      <T style={styles.metaText}>
                        Vehicle: {rider.vehicleType} · {rider.licensePlate}
                      </T>
                      {rider.isEV ? (
                        <View style={styles.evPill}>
                          <Ionicons name="leaf-outline" size={12} color={colors.success.dark} />
                          <T style={styles.evPillText}>EV verified</T>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.statusBox}>
                      <View>
                        <T style={styles.statusLabel}>Duty Status</T>
                        <T style={styles.statusSub}>
                          {isOnline ? 'Online — receiving routes' : 'Currently off duty'}
                        </T>
                      </View>
                      <Switch
                        value={isOnline}
                        onValueChange={(v) => setDuty.mutate(v ? 'ONLINE' : 'OFFLINE')}
                        disabled={setDuty.isPending}
                        trackColor={{ false: colors.neutral[300], true: colors.success.main }}
                        thumbColor="#fff"
                      />
                    </View>
                  </>
                ) : (
                  <View style={styles.onboardWrap}>
                    <T style={styles.onboardTitle}>Become a rider</T>
                    <T style={styles.onboardSub}>
                      {riderError
                        ? 'You don’t have a rider profile yet. Add your vehicle to start receiving delivery routes.'
                        : 'Loading rider profile…'}
                    </T>
                    <View style={styles.vehicleRow}>
                      {VEHICLE_TYPES.map((v) => (
                        <Pressable
                          key={v.id}
                          onPress={() => setVehicleType(v.id)}
                          style={[styles.vehicleChip, vehicleType === v.id && styles.vehicleChipOn]}
                        >
                          <T
                            style={[
                              styles.vehicleChipText,
                              vehicleType === v.id && styles.vehicleChipTextOn,
                            ]}
                          >
                            {v.label}
                          </T>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      style={styles.input}
                      value={licensePlate}
                      onChangeText={setLicensePlate}
                      placeholder="License plate (e.g. BA 1 PA 1234)"
                      placeholderTextColor={colors.neutral[400]}
                      autoCapitalize="characters"
                    />
                    <Pressable
                      style={[styles.onboardBtn, onboard.isPending && styles.btnDisabled]}
                      disabled={onboard.isPending}
                      onPress={() => {
                        if (!licensePlate.trim()) {
                          Alert.alert('License plate required', 'Enter your vehicle license plate to continue.');
                          return;
                        }
                        onboard.mutate();
                      }}
                    >
                      {onboard.isPending ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <T style={styles.onboardBtnText}>Save rider profile</T>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginTop: spacing.xl }}>
              <T style={styles.sectionTitle}>Preferences</T>
              <View style={styles.card}>
                <View style={styles.menuItem}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.info.main + '15' }]}>
                    <Ionicons name="notifications-outline" size={20} color={colors.info.main} />
                  </View>
                  <T style={styles.menuText}>Push Notifications</T>
                  <Switch value={true} onValueChange={() => {}} style={{ marginLeft: 'auto' }} />
                </View>
                <View style={[styles.menuItem, styles.menuBorder]}>
                  <View style={[styles.menuIcon, { backgroundColor: colors.warning.main + '15' }]}>
                    <Ionicons name="location-outline" size={20} color={colors.warning.main} />
                  </View>
                  <T style={styles.menuText}>Background Location</T>
                  <Switch value={true} onValueChange={() => {}} style={{ marginLeft: 'auto' }} />
                </View>
              </View>
            </Animated.View>
          </>
        )}

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginTop: spacing.xl }}>
          <View style={styles.card}>
            <Pressable style={styles.menuItem} onPress={logout}>
              <View style={[styles.menuIcon, { backgroundColor: colors.error.light }]}>
                <Ionicons name="log-out-outline" size={20} color={colors.error.main} />
              </View>
              <T style={styles.menuTextDestructive}>Sign out</T>
            </Pressable>
          </View>
        </Animated.View>

        <T style={styles.versionInfo}>GoPasal Delivery v2.0.0</T>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: { paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  content: { padding: spacing.lg },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.neutral[500],
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a3a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: 'Poppins-Bold', fontSize: 24, color: '#fff' },
  name: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[900] },
  phone: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500] },
  riderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  metaText: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[600], flex: 1 },
  evPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.success.light,
  },
  evPillText: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: colors.success.dark },
  statusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[150],
    paddingHorizontal: spacing.sm,
  },
  statusLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.neutral[900] },
  statusSub: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500], marginTop: 2 },
  onboardWrap: { padding: spacing.sm, gap: spacing.md, marginTop: spacing.sm },
  onboardTitle: { fontFamily: 'Poppins-Bold', fontSize: 17, color: colors.neutral[900] },
  onboardSub: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500], lineHeight: 19 },
  vehicleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  vehicleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  vehicleChipOn: { borderColor: '#1a3a2a', backgroundColor: '#1a3a2a' },
  vehicleChipText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.neutral[700] },
  vehicleChipTextOn: { color: '#fff' },
  input: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: 15,
    color: colors.neutral[900],
  },
  onboardBtn: {
    backgroundColor: '#1a3a2a',
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  onboardBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#fff' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm },
  menuBorder: { borderTopWidth: 1, borderTopColor: colors.neutral[150] },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.neutral[800] },
  menuTextDestructive: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.error.main },
  versionInfo: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing.xl,
  },
});
