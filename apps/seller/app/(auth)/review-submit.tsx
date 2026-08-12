import React from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthLayout } from '../../src/components/ui/AuthLayout';
import { Button } from '../../src/components/ui/Button';
import { VerificationIllustration } from '../../src/components/illustrations/VerificationIllustration';
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

function ReviewRow({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon?: string;
  iconColor?: string;
}) {
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewRowLabel}>{label}</Text>
      <View style={styles.reviewRowValue}>
        {icon && <Ionicons name={icon as any} size={16} color={iconColor} />}
        <Text style={styles.reviewRowText}>{value}</Text>
      </View>
    </View>
  );
}

export default function ReviewSubmitScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const params = useLocalSearchParams<{
    category: string;
    categoryName: string;
    businessName: string;
    businessAddress: string;
    panVat: string;
    businessRegDoc: string;
    storeLicense: string;
    storePhotos: string;
    storePhotosJson?: string;
  }>();

  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const name = (params.businessName || '').trim();
      const address = (params.businessAddress || '').trim();
      const pan = (params.panVat || '').trim();
      if (name.length < 2 || address.length < 5 || pan.length < 3) {
        Alert.alert('Incomplete', 'Please go back and complete business name, address, and PAN/VAT.');
        return;
      }

      await apiClient.put('/seller/stores/kyc/business-info', {
        businessName: name,
        panVat: pan,
        address,
      });

      const doc = (params.businessRegDoc || '').trim();
      const lic = (params.storeLicense || '').trim();
      if (doc || lic) {
        await apiClient.put('/seller/stores/kyc/documents', {
          ...(doc ? { kycDocumentUrl: doc } : {}),
          ...(lic ? { kycStoreLicenseUrl: lic } : {}),
        });
      }

      let photoUrls: string[] = [];
      if (params.storePhotosJson) {
        try {
          const parsed = JSON.parse(params.storePhotosJson) as unknown;
          if (Array.isArray(parsed)) {
            photoUrls = parsed.filter((x): x is string => typeof x === 'string');
          }
        } catch {
          photoUrls = [];
        }
      }
      if (photoUrls.length > 0) {
        await apiClient.put('/seller/stores/kyc/photos', { photoUrls });
      }

      await apiClient.post('/seller/stores/kyc/submit');
      router.replace('/(auth)/under-review');
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' &&
        e !== null &&
        'response' in e &&
        typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (e as { response: { data: { message: string } } }).response.data.message
          : 'Submission failed. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const photosCount = parseInt(params.storePhotos || '0', 10);

  return (
    <AuthLayout illustration={<VerificationIllustration />} illustrationAlignWithCard>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>Review & Submit</Text>
        <Text style={styles.subtitle}>
          Please review your business details before submitting for verification
        </Text>
      </Animated.View>

      {/* Store Type */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Store Type</Text>
        <View style={styles.reviewCard}>
          <ReviewRow
            label="Category"
            value={params.categoryName || 'Not selected'}
            icon="pricetag"
            iconColor={colors.primary[500]}
          />
        </View>
      </Animated.View>

      {/* Business Info */}
      <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Business Information</Text>
        <View style={styles.reviewCard}>
          <ReviewRow label="Business Name" value={params.businessName || '—'} />
          <View style={styles.separator} />
          <ReviewRow label="Address" value={params.businessAddress || '—'} />
          <View style={styles.separator} />
          <ReviewRow label="PAN / VAT" value={params.panVat || '—'} />
        </View>
      </Animated.View>

      {/* Documents */}
      <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.reviewSection}>
        <Text style={styles.reviewLabel}>Documents</Text>
        <View style={styles.reviewCard}>
          <ReviewRow
            label="Business Registration"
            value={params.businessRegDoc || 'Not uploaded'}
            icon={params.businessRegDoc ? 'checkmark-circle' : 'alert-circle-outline'}
            iconColor={params.businessRegDoc ? colors.success.main : colors.warning.main}
          />
          <View style={styles.separator} />
          <ReviewRow
            label="PAN Card / License"
            value={params.storeLicense || 'Not uploaded'}
            icon={params.storeLicense ? 'checkmark-circle' : 'remove-circle-outline'}
            iconColor={params.storeLicense ? colors.success.main : colors.neutral[400]}
          />
          <View style={styles.separator} />
          <ReviewRow
            label="Store Photos"
            value={`${photosCount} photo(s)`}
            icon={photosCount > 0 ? 'checkmark-circle' : 'alert-circle-outline'}
            iconColor={photosCount > 0 ? colors.success.main : colors.warning.main}
          />
        </View>
      </Animated.View>

      {/* Disclaimer */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.disclaimerWrap}>
        <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary[500]} />
        <Text style={styles.disclaimerText}>
          By submitting, you confirm that the information provided is accurate. Your application will be reviewed within 24–48 hours.
        </Text>
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.stepButtons}>
        <Button
          title="Edit Details"
          variant="outline"
          onPress={() => router.back()}
        />
        <View style={{ flex: 1 }}>
          <Button
            title="Submit for Review"
            onPress={handleSubmit}
            loading={loading}
          />
        </View>
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: colors.neutral[900],
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[500],
    marginBottom: 24,
    lineHeight: 20,
  },
  reviewSection: {
    marginBottom: 16,
  },
  reviewLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.neutral[700],
    marginBottom: 8,
  },
  reviewCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: 16,
    gap: 0,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: 10,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewRowLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.neutral[500],
    flex: 1,
  },
  reviewRowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  reviewRowText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.neutral[800],
    maxWidth: 200,
    textAlign: 'right',
  },
  disclaimerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.primary[50],
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[100],
    marginBottom: 16,
  },
  disclaimerText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.primary[700],
    flex: 1,
    lineHeight: 18,
  },
  stepButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
});
