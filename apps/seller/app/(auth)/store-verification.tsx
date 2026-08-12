import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthLayout } from '../../src/components/ui/AuthLayout';
import { FormInput } from '../../src/components/ui/FormInput';
import { Button } from '../../src/components/ui/Button';
import { StepProgress } from '../../src/components/ui/StepProgress';
import { VerificationIllustration } from '../../src/components/illustrations/VerificationIllustration';
import { colors } from '../../src/design-system/tokens/colors';
import { useLanguageStore } from '../../src/store/language.store';
import { useRegistrationFlowStore } from '../../src/store/registration-flow.store';
import { useAuthStore } from '../../src/store/auth.store';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { uploadKycFileFromUri } from '../../src/utils/upload-kyc-file';
import { extractApiErrorMessage } from '../../src/utils/api-error';
import { FilePreviewCard } from '../../src/components/ui/FilePreviewCard';

function Text({ style, children, ...props }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

export default function StoreVerificationScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();
  const { completeRegistration, isLoading, validateAndSendOtp } = useAuthStore();
  const regStore = useRegistrationFlowStore();

  // Route protection: must have completed category step
  useEffect(() => {
    if (!regStore.phone?.trim()) {
      router.replace('/(auth)/register');
      return;
    }
    if (!regStore.otpVerified) {
      setError('Enter the OTP on the Register screen first, then continue here.');
      router.replace('/(auth)/register');
    }
  }, []);

  const STEPS = [
    { label: t('verify.step1Title'), key: 'info' },
    { label: t('verify.step2Title'), key: 'docs' },
    { label: t('verify.step3Title'), key: 'review' },
  ];
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Step 1: Business Info
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [panVat, setPanVat] = useState('');

  // Step 2: Documents
  const [businessRegDoc, setBusinessRegDoc] = useState('');
  const [storeLicense, setStoreLicense] = useState('');
  const [storePhotos, setStorePhotos] = useState<string[]>([]);

  const handleStep1 = () => {
    if (!businessName.trim()) { setError('Enter your business name'); return; }
    if (!businessAddress.trim()) { setError('Enter your business address'); return; }
    if (!panVat.trim()) { setError('Enter your PAN/VAT number'); return; }
    setError('');
    regStore.setBusinessInfo({ businessName, businessAddress, panVat });
    setStep(1);
  };

  const step2DocsComplete =
    Boolean(businessRegDoc?.trim()) &&
    Boolean(storeLicense?.trim()) &&
    storePhotos.length >= 1;

  const handleStep2 = () => {
    if (!step2DocsComplete) {
      setError(t('verify.step2Incomplete'));
      return;
    }
    setError('');
    regStore.setDocuments({ businessRegDoc, storeLicense, storePhotos });
    setStep(2);
  };

  const handleResendOtp = async () => {
    setError('');
    if (!regStore.name || !regStore.email || !regStore.phone || !regStore.password) {
      setError('Registration details missing. Go back to register and start again.');
      return;
    }
    try {
      await validateAndSendOtp({
        name: regStore.name,
        email: regStore.email,
        phone: regStore.phone,
        password: regStore.password,
      });
      setError('');
      Alert.alert(
        'OTP sent',
        `A new code was sent to ${regStore.phone}. Go back to Register, enter the new OTP, then return here to upload.`
      );
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not resend OTP'));
    }
  };

  const handleUpload = async (setFn: (v: string) => void) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      const phone = regStore.phone?.trim();
      if (!phone) {
        setError('Verify your phone with OTP on the register screen before uploading documents.');
        return;
      }
      setUploading(true);
      const webFile = (asset as { file?: File }).file;
      const url = await uploadKycFileFromUri(
        asset.uri,
        asset.name || 'document.pdf',
        asset.mimeType || 'application/pdf',
        { registrationPhone: phone, webFile, registrationToken: null }
      );
      setFn(url);
      setError('');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleAddPhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      const phone = regStore.phone?.trim();
      if (!phone) {
        setError('Verify your phone with OTP before uploading documents.');
        return;
      }
      setUploading(true);
      const webFile = (asset as { file?: File }).file;
      const url = await uploadKycFileFromUri(
        asset.uri,
        asset.fileName || 'store-photo.jpg',
        asset.mimeType || 'image/jpeg',
        { registrationPhone: phone, webFile }
      );
      setStorePhotos([...storePhotos, url]);
      setError('');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  // FINAL SUBMIT: This is where ALL data gets saved to the database
  const handleSubmit = async () => {
    setError('');
    try {
      // Get all data from registration flow store
      const state = useRegistrationFlowStore.getState();

      await completeRegistration({
        name: state.name,
        email: state.email,
        phone: state.phone,
        password: state.password,
        otp: state.otp,
        category: state.category || undefined,
        businessName: businessName || undefined,
        businessAddress: businessAddress || undefined,
        panVat: panVat || undefined,
        businessRegDoc: businessRegDoc || undefined,
        storeLicense: storeLicense || undefined,
        storePhotos: storePhotos.length > 0 ? storePhotos : undefined,
      });

      regStore.markSubmitted();
      router.replace('/(auth)/under-review');
    } catch (e: any) {
      const apiMsg = e.response?.data?.error?.message;
      const fallbackMsg = e.response?.status >= 500
        ? 'Submission failed due to a server error. Please try again.'
        : 'Submission failed. Please check your details.';
      setError(apiMsg || fallbackMsg);
    }
  };

  return (
    <AuthLayout illustration={<VerificationIllustration />} illustrationAlignWithCard>
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>{t('verify.title')}</Text>
        <Text style={styles.subtitle}>
          {step === 0 ? t('verify.step1Desc') :
            step === 1 ? t('verify.step2Desc') :
              t('verify.step3Desc')}
        </Text>
        <StepProgress steps={STEPS} currentStep={step} />
      </Animated.View>

      {/* Error */}
      {error ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.errorWrap}>
          <Ionicons name="alert-circle" size={16} color={colors.error.main} />
          <View style={{ flex: 1 }}>
            <Text style={styles.errorText}>{error}</Text>
            {error.toLowerCase().includes('already registered') || error.toLowerCase().includes('log in') ? (
              <Pressable
                style={styles.errorLoginBtn}
                onPress={() => router.push('/(auth)/login' as any)}
              >
                <Text style={styles.errorLoginBtnText}>Log In to Existing Account →</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      {/* Step 1: Business Info */}
      {step === 0 && (
        <Animated.View entering={FadeInRight.delay(150).duration(400)}>
          <FormInput
            icon="business-outline"
            placeholder={t('verify.businessName')}
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
          />
          <FormInput
            icon="location-outline"
            placeholder={t('verify.address')}
            value={businessAddress}
            onChangeText={setBusinessAddress}
          />
          <FormInput
            icon="document-text-outline"
            placeholder={t('verify.panVat')}
            value={panVat}
            onChangeText={setPanVat}
          />
          <View style={styles.stepButtons}>
            <Pressable
              onPress={() => {
                setError('');
                router.replace('/(auth)/category-select');
              }}
              style={({ pressed }) => [styles.backArrowBtn, pressed && styles.backArrowBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Ionicons name="chevron-back" size={28} color={colors.primary[700]} />
            </Pressable>
            <View style={styles.stepButtonsMain}>
              <Button title={t('common.continue')} onPress={handleStep1} />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Step 2: Documents */}
      {step === 1 && (
        <Animated.View entering={FadeInRight.delay(150).duration(400)}>
          {regStore.phone ? (
            <Text style={styles.otpHint}>
              Uploads are tied to {regStore.phone}. If uploads fail, your OTP may have expired —{' '}
              <Text style={styles.otpLink} onPress={() => void handleResendOtp()}>
                resend OTP
              </Text>
              .
            </Text>
          ) : null}
          {uploading ? (
            <Text style={styles.uploadingLabel}>Uploading…</Text>
          ) : null}
          <View style={{ marginTop: 12 }}>
            <FilePreviewCard
              label={t('verify.uploadDoc')}
              url={businessRegDoc}
              fileName="business-registration"
              onUploadNew={() => handleUpload(setBusinessRegDoc)}
              onRemove={() => setBusinessRegDoc('')}
              uploading={uploading}
            />

            <FilePreviewCard
              label={t('verify.uploadPan')}
              url={storeLicense}
              fileName="store-license"
              onUploadNew={() => handleUpload(setStoreLicense)}
              onRemove={() => setStoreLicense('')}
              uploading={uploading}
            />

            {storePhotos.map((photoUrl, idx) => (
              <FilePreviewCard
                key={photoUrl + idx}
                label={`Store Photo #${idx + 1}`}
                url={photoUrl}
                fileName={`store-photo-${idx + 1}.jpg`}
                fileType="image"
                onRemove={() => setStorePhotos((prev) => prev.filter((_, i) => i !== idx))}
              />
            ))}

            {storePhotos.length < 5 && (
              <FilePreviewCard
                label={storePhotos.length > 0 ? "Add another store photo" : t('verify.uploadPhoto')}
                onUploadNew={handleAddPhoto}
                uploading={uploading}
              />
            )}
          </View>

          <View style={styles.stepButtons}>
            <Pressable
              onPress={() => {
                setError('');
                setStep(0);
              }}
              style={({ pressed }) => [styles.backArrowBtn, pressed && styles.backArrowBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Ionicons name="chevron-back" size={28} color={colors.primary[700]} />
            </Pressable>
            <View style={styles.stepButtonsMain}>
              <Button
                title={t('common.continue')}
                onPress={handleStep2}
                disabled={!step2DocsComplete}
              />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Step 3: Review & Submit */}
      {step === 2 && (
        <Animated.View entering={FadeInRight.delay(150).duration(400)}>
          {/* Registration Info */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Account Information</Text>
            <View style={styles.reviewCard}>
              <ReviewRow label="Name" value={regStore.name} />
              <ReviewRow label="Email" value={regStore.email} />
              <ReviewRow label="Phone" value={regStore.phone} />
            </View>
          </View>

          {/* Store Type */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>Store Type</Text>
            <View style={styles.reviewCard}>
              <ReviewRow
                label="Category"
                value={regStore.category || 'Not selected'}
                icon="pricetag"
                iconColor={colors.primary[500]}
              />
            </View>
          </View>

          {/* Business Info */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>{t('verify.step1Title')}</Text>
            <View style={styles.reviewCard}>
              <ReviewRow label={t('verify.businessName')} value={businessName} />
              <ReviewRow label={t('verify.address')} value={businessAddress} />
              <ReviewRow label={t('verify.panVat')} value={panVat} />
            </View>
          </View>

          {/* Documents */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewLabel}>{t('verify.step2Title')}</Text>
            <View style={styles.reviewCard}>
              <ReviewRow
                label={t('verify.uploadDoc')}
                value={businessRegDoc ? 'Document Uploaded' : 'Not uploaded'}
                icon={businessRegDoc ? 'checkmark-circle' : 'alert-circle-outline'}
                iconColor={businessRegDoc ? colors.success.main : colors.warning.main}
              />
              <ReviewRow
                label={t('verify.uploadPan')}
                value={storeLicense ? 'License Uploaded' : 'Not uploaded'}
                icon={storeLicense ? 'checkmark-circle' : 'remove-circle-outline'}
                iconColor={storeLicense ? colors.success.main : colors.neutral[400]}
              />
              <ReviewRow
                label={t('verify.uploadPhoto')}
                value={`${storePhotos.length} photo(s)`}
                icon={storePhotos.length > 0 ? 'checkmark-circle' : 'alert-circle-outline'}
                iconColor={storePhotos.length > 0 ? colors.success.main : colors.warning.main}
              />
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerWrap}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary[500]} />
            <Text style={styles.disclaimerText}>
              By submitting, your account will be created and your application reviewed within 24–48 hours. No data is saved until you submit.
            </Text>
          </View>

          <View style={styles.stepButtons}>
            <Pressable
              onPress={() => {
                setError('');
                setStep(1);
              }}
              style={({ pressed }) => [styles.backArrowBtn, pressed && styles.backArrowBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
            >
              <Ionicons name="chevron-back" size={28} color={colors.primary[700]} />
            </Pressable>
            <View style={styles.stepButtonsMain}>
              <Button title={t('verify.submit')} onPress={handleSubmit} loading={isLoading} />
            </View>
          </View>
        </Animated.View>
      )}
    </AuthLayout>
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
        {icon && <Ionicons name={icon as any} size={16} color={iconColor} style={{ marginRight: 4 }} />}
        <Text style={styles.reviewRowText} numberOfLines={1}>{value}</Text>
      </View>
    </View>
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
    marginBottom: 20,
  },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error.light,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.error.dark,
    flex: 1,
  },
  errorLoginBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorLoginBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#991B1B',
  },
  otpHint: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.neutral[600],
    lineHeight: 18,
    marginBottom: 8,
  },
  otpLink: {
    fontFamily: 'Inter-SemiBold',
    color: colors.primary[600],
    textDecorationLine: 'underline',
  },
  uploadingLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.primary[600],
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.neutral[700],
    marginBottom: 8,
    marginTop: 4,
  },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  uploadText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.neutral[600],
  },
  uploadHint: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.neutral[400],
  },
  uploadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  uploadedIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.success.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedName: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.neutral[800],
  },
  uploadedStatus: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: colors.success.main,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    alignItems: 'stretch',
  },
  photoThumb: {
    width: 104,
    height: 104,
    borderRadius: 14,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  photoName: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: colors.primary[600],
  },
  addPhotoBtn: {
    flexGrow: 1,
    flexBasis: 160,
    minHeight: 132,
    minWidth: 160,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    backgroundColor: colors.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  addPhotoBtnPressed: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.primary[200],
  },
  addPhotoIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary[50],
    borderWidth: 1.5,
    borderColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoHint: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.neutral[700],
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 18,
  },
  stepButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  stepButtonsMain: {
    flex: 1,
    minWidth: 0,
  },
  backArrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[0],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
  },
  backArrowBtnPressed: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.primary[200],
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
    gap: 12,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  reviewRowLabel: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.neutral[500],
    flexShrink: 0,
    maxWidth: '48%',
  },
  reviewRowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  reviewRowText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.neutral[800],
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
});
