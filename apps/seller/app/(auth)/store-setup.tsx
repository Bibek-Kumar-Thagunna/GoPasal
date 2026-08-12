import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../src/components/ui/Button';
import { AuthHeader } from '../../src/components/ui/AuthHeader';
import { SignOutButton } from '../../src/components/ui/SignOutButton';
import { colors } from '../../src/design-system/tokens/colors';
import apiClient from '../../src/services/api';
import { useSellerWorkspace } from '../../src/hooks/useSellerWorkspace';
import { useSellerTenantReady } from '../../src/hooks/useSellerTenantReady';
import { syncSellerTenantToken } from '../../src/utils/seller-session';
import { extractApiErrorMessage } from '../../src/utils/api-error';

function Text({ style, children, ...props }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

type SetupStep = {
  id: string;
  title: string;
  subtitle: string;
  done: boolean;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge: string;
};

export default function StoreSetupScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isReady } = useSellerTenantReady();
  const { store, refetch } = useSellerWorkspace();
  const [navigating, setNavigating] = useState(false);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const { data: products } = useQuery({
    queryKey: ['seller-products-setup'],
    enabled: isReady,
    queryFn: async () => {
      try {
        const res = await apiClient.get('/seller/products', { params: { limit: 1 } });
        const payload = res.data?.data;
        if (Array.isArray(payload)) return payload;
        if (payload?.items && Array.isArray(payload.items)) return payload.items;
        return [];
      } catch {
        return [];
      }
    },
  });

  const hasProducts = (products?.length ?? 0) > 0;
  const hasPin =
    store?.latitude != null &&
    store?.longitude != null &&
    ((store?.deliveryRadius as number | undefined) ?? 0) > 0;

  const steps: SetupStep[] = useMemo(
    () => [
      {
        id: 'product',
        title: 'Add your first product',
        subtitle: 'Add items so customers can browse and place orders from your catalog.',
        done: hasProducts,
        route: '/product/new',
        icon: 'cube-sharp',
        badge: hasProducts ? 'Completed' : '1 Item Required',
      },
      {
        id: 'location',
        title: 'Set delivery pin & coverage radius',
        subtitle: 'Configure your physical store location and delivery radius for customer checkout.',
        done: hasPin,
        route: '/(tabs)/settings',
        icon: 'location-sharp',
        badge: hasPin ? 'Configured' : 'Action Needed',
      },
      {
        id: 'open',
        title: 'Open your shop',
        subtitle: store?.isOpen
          ? 'Shop is active and receiving live orders.'
          : 'Complete steps 1 & 2 above to open your shop for customer orders.',
        done: !!store?.isOpen,
        route: '/(tabs)',
        icon: 'storefront-sharp',
        badge: store?.isOpen ? 'Open for Orders' : 'Currently Closed',
      },
    ],
    [hasProducts, hasPin, store?.isOpen]
  );

  const completedCount = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const allDone = completedCount === steps.length;

  const completeM = useMutation({
    mutationFn: async () => {
      await apiClient.post('/seller/stores/onboarding/complete');
    },
    onSuccess: async () => {
      await refetch();
      void qc.invalidateQueries({ queryKey: ['seller-stores-me'] });
      await handleOpenDashboard();
    },
    onError: async () => {
      await handleOpenDashboard();
    },
  });

  const handleOpenDashboard = async () => {
    setNavigating(true);
    try {
      await syncSellerTenantToken();
      router.replace('/(tabs)' as any);
    } catch {
      router.replace('/(tabs)' as any);
    } finally {
      setNavigating(false);
    }
  };

  const handleStepClick = async (step: SetupStep) => {
    setActiveStepId(step.id);
    try {
      // 1. Sync tenant token first so seller context is active for all routes
      await syncSellerTenantToken();

      if (step.id === 'product') {
        router.push('/product/new' as any);
        return;
      }

      if (step.id === 'location') {
        router.push('/(tabs)/settings' as any);
        return;
      }

      if (step.id === 'open') {
        if (!hasProducts) {
          Alert.alert(
            'Product Required',
            'Please add at least 1 product to your catalog before opening your shop for customer orders.',
            [
              { text: 'Add Product Now', onPress: () => router.push('/product/new' as any) },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return;
        }

        if (!hasPin) {
          Alert.alert(
            'Delivery Pin Required',
            'Please set your store delivery location pin and coverage radius before opening your shop for customer orders.',
            [
              { text: 'Set Location Now', onPress: () => router.push('/(tabs)/settings' as any) },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return;
        }

        // Toggle shop open status
        const nextState = !store?.isOpen;
        await apiClient.put('/seller/stores/me', { isOpen: nextState });
        await refetch();
        Alert.alert(
          nextState ? 'Shop Opened! 🎉' : 'Shop Closed',
          nextState
            ? 'Your store is now open and visible to nearby customers.'
            : 'Your store is now closed for new orders.'
        );
      }
    } catch (err) {
      Alert.alert('Notice', extractApiErrorMessage(err, 'Action could not be completed'));
    } finally {
      setActiveStepId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AuthHeader />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.cardWrapper}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <View style={styles.headerBadge}>
              <Ionicons name="sparkles-sharp" size={14} color={colors.primary[600]} />
              <Text style={styles.headerBadgeText}>Onboarding Checklist</Text>
            </View>
            <Text style={styles.title}>Finish your store setup</Text>
            <Text style={styles.subtitle}>
              Complete these steps so nearby customers can discover your store and place delivery orders.
            </Text>
          </Animated.View>

          {/* Progress Bar */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressTitle}>Setup Progress</Text>
              <Text style={styles.progressValue}>{completedCount} of 3 completed ({progressPercent}%)</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </Animated.View>

          {/* Step Cards */}
          <View style={styles.stepList}>
            {steps.map((step, i) => {
              const isLoading = activeStepId === step.id;
              return (
                <Animated.View key={step.id} entering={FadeInUp.delay(200 + i * 80).duration(400)}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.stepCard,
                      step.done && styles.stepCardDone,
                      pressed && styles.stepCardPressed,
                    ]}
                    onPress={() => void handleStepClick(step)}
                    disabled={isLoading || navigating}
                  >
                    <View style={[styles.stepIconCircle, step.done && styles.stepIconCircleDone]}>
                      {isLoading ? (
                        <ActivityIndicator size="small" color={step.done ? '#FFF' : colors.primary[600]} />
                      ) : (
                        <Ionicons
                          name={step.done ? 'checkmark' : step.icon}
                          size={20}
                          color={step.done ? '#FFFFFF' : colors.primary[600]}
                        />
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.stepTitleRow}>
                        <Text style={styles.stepTitle}>{step.title}</Text>
                        <View style={[styles.badgePill, step.done ? styles.badgeDone : styles.badgePending]}>
                          <Text style={[styles.badgeText, step.done ? styles.badgeTextDone : styles.badgeTextPending]}>
                            {step.badge}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                    </View>

                    <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* Primary Action Button */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.actionSection}>
            <Button
              title={
                allDone
                  ? 'Complete & Open Dashboard 🚀'
                  : 'Go to Seller Dashboard'
              }
              fullWidth
              size="lg"
              loading={completeM.isPending || navigating}
              onPress={() => {
                if (allDone) {
                  completeM.mutate();
                } else {
                  void handleOpenDashboard();
                }
              }}
            />

            {!allDone && (
              <Pressable
                style={styles.skipBtn}
                onPress={() => void handleOpenDashboard()}
                disabled={navigating}
              >
                <Text style={styles.skipBtnText}>Skip setup — open dashboard →</Text>
              </Pressable>
            )}
          </Animated.View>

          {/* Sign Out Link */}
          <View style={styles.signOutWrapper}>
            <SignOutButton />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  cardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 4,
        }),
  } as any,
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[50],
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  headerBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.primary[700],
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: colors.neutral[900],
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[600],
    lineHeight: 22,
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.neutral[800],
  },
  progressValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.primary[700],
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#CBD5E1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  stepList: {
    gap: 12,
    marginBottom: 24,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    cursor: 'pointer' as any,
  },
  stepCardDone: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  stepCardPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: colors.primary[300],
  },
  stepIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconCircleDone: {
    backgroundColor: '#059669',
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  stepTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: colors.neutral[900],
  },
  stepSubtitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.neutral[500],
    lineHeight: 18,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeDone: {
    backgroundColor: '#DCFCE7',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
  },
  badgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
  },
  badgeTextDone: {
    color: '#15803D',
  },
  badgeTextPending: {
    color: '#B45309',
  },
  actionSection: {
    gap: 12,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.primary[600],
  },
  signOutWrapper: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});
