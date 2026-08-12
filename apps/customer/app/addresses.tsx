import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../src/design-system/primitives/GText';
import { Card } from '../src/design-system/primitives/Card';
import { Button } from '../src/design-system/primitives/Button';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import { EmptyState } from '../src/components/StateViews';
import { useAddresses, useDeleteAddress } from '../src/services/hooks';
import { useTranslation } from '../src/i18n';
import { WebPageShell } from '../src/components/WebPageShell';

export default function AddressesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: addresses, isLoading } = useAddresses();
  const deleteAddress = useDeleteAddress();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <WebPageShell>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/' as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText variant="h2" color={colors.neutral[900]}>{t('addresses.title')}</GText>
        <Pressable style={styles.backBtn} onPress={() => router.push('/address-new' as any)}>
          <Ionicons name="add" size={22} color={colors.primary[600]} />
        </Pressable>
      </View>

      {!isLoading && (!addresses || addresses.length === 0) ? (
        <EmptyState
          icon="location-outline"
          title={t('addresses.none')}
          message={t('addresses.noneMsg')}
          actionLabel={t('addresses.addAddress')}
          onAction={() => router.push('/address-new' as any)}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {addresses?.map((addr, i) => (
            <Animated.View key={addr.id} entering={FadeInDown.delay(i * 50).duration(300)}>
              <Card variant="elevated" style={styles.addressCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name="location" size={20} color={colors.primary[600]} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.labelRow}>
                    <GText variant="body" weight="semibold">{addr.label}</GText>
                    {addr.isDefault && (
                      <View style={styles.defaultBadge}>
                        <GText variant="caption" weight="semibold" color={colors.primary[700]}>{t('addresses.default')}</GText>
                      </View>
                    )}
                  </View>
                  <GText variant="bodySm" color={colors.neutral[600]}>{addr.addressLine}</GText>
                  <GText variant="caption" color={colors.neutral[400]}>{addr.city}</GText>
                </View>
                <Pressable onPress={() => deleteAddress.mutate(addr.id)}>
                  <Ionicons name="trash-outline" size={18} color={colors.neutral[400]} />
                </Pressable>
              </Card>
            </Animated.View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      </WebPageShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.mint[100], alignItems: 'center', justifyContent: 'center',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  defaultBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm,
    backgroundColor: colors.mint[100],
  },
});
