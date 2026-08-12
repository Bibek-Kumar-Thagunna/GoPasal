import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GText } from '../src/components/GText';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import { useSellerWorkspace } from '../src/hooks/useSellerWorkspace';
import { usePublicConfig } from '../src/hooks/usePublicConfig';
import { formatCoordinate } from '../src/utils/coordinates';
import apiClient from '../src/services/api';

const DELIVERY_TYPES = [
  { id: 'MERCHANT_SELF', label: 'We deliver (our staff / shop)' },
  { id: 'PICKUP_ONLY', label: 'Pickup only (no delivery)' },
  { id: 'PLATFORM', label: 'GoPasal fleet delivery' },
  { id: 'HYBRID', label: 'Merchant + GoPasal fleet (advanced)' },
] as const;

export default function SelfDeliveryScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { store, isLoading, refetch } = useSellerWorkspace();
  const { platformDeliveryEnabled } = usePublicConfig();

  const [deliveryType, setDeliveryType] = useState('MERCHANT_SELF');
  const [radiusText, setRadiusText] = useState('3');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (store && !loaded) {
      const dt = String((store as { deliveryType?: string })?.deliveryType || 'MERCHANT_SELF');
      setDeliveryType(dt === 'SELF' || dt === 'MERCHANT' ? 'MERCHANT_SELF' : dt);
      const r = (store as { deliveryRadius?: number | null })?.deliveryRadius;
      if (r != null) setRadiusText(String(r));
      setLoaded(true);
    }
  }, [store, loaded]);

  const save = useMutation({
    mutationFn: async () => {
      const radius = parseFloat(radiusText);
      if (!Number.isFinite(radius) || radius < 0.5 || radius > 50) {
        throw new Error('Radius must be between 0.5 and 50 km');
      }
      await apiClient.put('/seller/stores/me', {
        deliveryType,
        deliveryRadius: radius,
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller-stores-me'] });
      void refetch();
      setLoaded(false);
      Alert.alert('Saved', 'Delivery configuration updated.');
    },
    onError: (err: any) => {
      Alert.alert('Save failed', err?.response?.data?.message || err?.message || 'Try again.');
    },
  });

  const options = DELIVERY_TYPES.filter(
    (t) => t.id === 'MERCHANT_SELF' || t.id === 'PICKUP_ONLY' || platformDeliveryEnabled
  );

  const lat = (store as { latitude?: number | null } | null)?.latitude;
  const lon = (store as { longitude?: number | null } | null)?.longitude;
  const hasPin = lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon);

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText style={styles.title}>Delivery</GText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GText style={styles.desc}>
          Configure how this branch fulfils orders. Customers see the option you enable at checkout.
        </GText>

        <View style={styles.card}>
          <GText style={styles.cardLabel} weight="semiBold">Fulfilment mode</GText>
          {options.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setDeliveryType(t.id)}
              style={[styles.radioRow, deliveryType === t.id && styles.radioRowActive]}
            >
              <View style={[styles.radio, deliveryType === t.id && styles.radioActive]} />
              <GText
                style={[
                  styles.radioText,
                  deliveryType === t.id && styles.radioTextActive,
                ]}
              >
                {t.label}
              </GText>
            </Pressable>
          ))}
        </View>

        {deliveryType !== 'PICKUP_ONLY' ? (
          <View style={styles.card}>
            <GText style={styles.cardLabel} weight="semiBold">Delivery radius (km)</GText>
            <TextInput
              value={radiusText}
              onChangeText={setRadiusText}
              keyboardType="numeric"
              style={styles.input}
            />
            {!hasPin ? (
              <View style={styles.warnRow}>
                <Ionicons name="warning-outline" size={16} color="#b45309" />
                <GText style={styles.warnText}>
                  Shop location not set — customers won't see this store until you add it in settings.
                </GText>
              </View>
            ) : (
              <GText style={styles.meta}>
                Shop pin: {formatCoordinate(lat)}, {formatCoordinate(lon)}
              </GText>
            )}
          </View>
        ) : null}

        <Pressable
          style={[styles.saveBtn, save.isPending && styles.btnDisabled]}
          disabled={save.isPending}
          onPress={() => save.mutate()}
        >
          {save.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <GText weight="semiBold" style={styles.saveBtnText}>Save delivery settings</GText>
          )}
        </Pressable>

        <Pressable style={styles.advancedBtn} onPress={() => router.push('/(tabs)/settings' as any)}>
          <GText style={styles.advancedText}>Open full store settings</GText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[150],
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.neutral[900] },
  content: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  desc: { fontSize: 14, color: colors.neutral[600], marginBottom: spacing.xl, lineHeight: 20 },
  card: {
    padding: spacing.lg,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  cardLabel: { fontSize: 15, color: colors.neutral[900], marginBottom: spacing.xs },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  radioRowActive: {},
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.neutral[300],
  },
  radioActive: { borderColor: colors.primary[600], backgroundColor: colors.primary[600] },
  radioText: { flex: 1, fontSize: 14, color: colors.neutral[700] },
  radioTextActive: { color: colors.neutral[900], fontWeight: '600' },
  input: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: 15,
    color: colors.neutral[900],
  },
  meta: { fontSize: 13, color: colors.neutral[500], marginTop: spacing.xs },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  warnText: { flex: 1, fontSize: 13, color: colors.neutral[600] },
  saveBtn: {
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 15 },
  advancedBtn: {
    marginTop: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary[300],
  },
  advancedText: { color: colors.primary[600], fontSize: 14, fontWeight: '600' },
});
