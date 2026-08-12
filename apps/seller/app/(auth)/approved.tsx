import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, BounceIn, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { AuthLayout } from '../../src/components/ui/AuthLayout';
import { Button } from '../../src/components/ui/Button';
import { ApprovedIllustration } from '../../src/components/illustrations/ApprovedIllustration';
import { colors } from '../../src/design-system/tokens/colors';
import { useLanguageStore } from '../../src/store/language.store';
import apiClient from '../../src/services/api';

function Text({ style, children, ...props }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

export default function ApprovedScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();

  const { data: verification } = useQuery({
    queryKey: ['seller-verification-approved'],
    queryFn: async () => {
      const res = await apiClient.get('/seller/stores/verification-status');
      return res.data?.data as {
        status?: string;
        verificationStep?: string;
        storeName?: string;
      } | null;
    },
  });

  const storeLabel = verification?.storeName ?? 'Your GoPasal Store';
  const statusLabel =
    verification?.verificationStep === 'APPROVED' || verification?.status === 'ACTIVE'
      ? 'Active'
      : 'Approved';

  const MILESTONES = [
    { title: 'Account Verified', desc: 'Phone & email authenticated', icon: 'shield-checkmark-sharp', color: '#10B981' },
    { title: 'Store Category Set', desc: 'Catalog & tax rules configured', icon: 'pricetag-sharp', color: '#3B82F6' },
    { title: 'KYC & License Approved', desc: 'Legal documents verified by Admin', icon: 'document-text-sharp', color: '#8B5CF6' },
    { title: 'Store Live Ready', desc: 'Ready to receive orders', icon: 'rocket-sharp', color: '#F59E0B' },
  ];

  const handleLaunchStore = () => {
    router.replace('/(auth)/store-setup' as any);
  };

  const HeroIllustration = (
    <View style={styles.illustrationWrapper}>
      <Animated.View entering={ZoomIn.duration(700)} style={styles.illustrationCard}>
        <View style={styles.illustrationBadge}>
          <Ionicons name="sparkles" size={16} color="#059669" />
          <Text style={styles.illustrationBadgeText}>Official Verified Partner</Text>
        </View>
        <ApprovedIllustration width={340} height={280} />
        <View style={styles.trustGrid}>
          <View style={styles.trustItem}>
            <Ionicons name="flash-sharp" size={16} color="#059669" />
            <Text style={styles.trustText}>Instant Setup</Text>
          </View>
          <View style={styles.trustItem}>
            <Ionicons name="card-sharp" size={16} color="#059669" />
            <Text style={styles.trustText}>0% Commission Start</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );

  return (
    <AuthLayout illustration={HeroIllustration} showFooter illustrationAlignWithCard>
      {/* Success Badge */}
      <Animated.View entering={BounceIn.delay(200).duration(600)}>
        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Ionicons name="checkmark-circle-sharp" size={18} color="#059669" />
          <Text style={styles.statusBadgeText}>Store Approved & Verified</Text>
        </View>
      </Animated.View>

      {/* Main Title Section */}
      <Animated.View entering={FadeInDown.delay(350).duration(500)}>
        <Text style={styles.title}>Welcome aboard! 🎉</Text>
        <Text style={styles.storeHighlight}>{storeLabel}</Text>
        <Text style={styles.subtitle}>
          Your store application has passed all compliance checks and is now fully authorized to go live on the GoPasal Marketplace.
        </Text>
      </Animated.View>

      {/* Milestones Card Grid */}
      <Animated.View entering={FadeInDown.delay(500).duration(500)} style={styles.milestonesContainer}>
        {MILESTONES.map((item, i) => (
          <Animated.View
            key={item.title}
            entering={FadeInUp.delay(600 + i * 90).duration(400)}
            style={styles.milestoneCard}
          >
            <View style={[styles.milestoneIconCircle, { backgroundColor: `${item.color}15` }]}>
              <Ionicons name={item.icon as any} size={18} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.milestoneTitle}>{item.title}</Text>
              <Text style={styles.milestoneDesc}>{item.desc}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
          </Animated.View>
        ))}
      </Animated.View>

      {/* Quick Metrics */}
      <Animated.View entering={FadeInDown.delay(900).duration(500)} style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{statusLabel}</Text>
          <Text style={styles.metricLabel}>Store Status</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricValue, { color: '#059669' }]}>Public</Text>
          <Text style={styles.metricLabel}>Visibility</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>Ready</Text>
          <Text style={styles.metricLabel}>POS & Catalog</Text>
        </View>
      </Animated.View>

      {/* Launch CTA */}
      <Animated.View entering={FadeInDown.delay(1100).duration(500)} style={styles.actionWrap}>
        <Button
          title="Launch Seller Dashboard 🚀"
          onPress={handleLaunchStore}
          fullWidth
          size="lg"
        />
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusBadgeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 13,
    color: '#065F46',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: colors.neutral[900],
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  storeHighlight: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 17,
    color: colors.primary[600],
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[600],
    lineHeight: 22,
    marginBottom: 24,
  },
  milestonesContainer: {
    gap: 10,
    marginBottom: 24,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  milestoneIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.neutral[900],
  },
  milestoneDesc: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.neutral[900],
    marginBottom: 2,
  },
  metricLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.neutral[500],
  },
  actionWrap: {
    marginTop: 4,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  illustrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)' }
      : {
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 3,
        }),
  } as any,
  illustrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  illustrationBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#065F46',
  },
  trustGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trustText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#166534',
  },
});
