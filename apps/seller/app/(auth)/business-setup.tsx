import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthLayout } from '../../src/components/ui/AuthLayout';
import { FormInput } from '../../src/components/ui/FormInput';
import { Button } from '../../src/components/ui/Button';
import { StepProgress } from '../../src/components/ui/StepProgress';
import { CategoryIllustration } from '../../src/components/illustrations/CategoryIllustration';
import { VerificationIllustration } from '../../src/components/illustrations/VerificationIllustration';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import { useLanguageStore } from '../../src/store/language.store';
import { translateSellerOnboardingCategories } from '../../src/constants/seller-onboarding-categories';

function Text({ style, children, ...props }: any) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

export default function BusinessSetupScreen() {
  const router = useRouter();
  const { t } = useLanguageStore();

  useEffect(() => {
    router.replace('/(auth)/kyc-resubmit');
  }, [router]);

  const STEPS = [
    { label: 'Store Type', key: 'category' },
    { label: 'Business Info', key: 'info' },
    { label: 'Documents', key: 'docs' },
  ];
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  // Step 1: Category
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Step 2: Business Info
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [panVat, setPanVat] = useState('');

  // Step 3: Documents
  const [businessRegDoc, setBusinessRegDoc] = useState('');
  const [storeLicense, setStoreLicense] = useState('');
  const [storePhotos, setStorePhotos] = useState<string[]>([]);

  const translatedCategories = translateSellerOnboardingCategories(t);

  // Step 1: Category validation
  const handleStep1 = () => {
    if (!selectedCategory) {
      setError('Please select your store type to continue');
      return;
    }
    setError('');
    setStep(1);
  };

  // Step 2: Business Info validation
  const handleStep2 = () => {
    if (!businessName.trim()) { setError('Enter your business name'); return; }
    if (!businessAddress.trim()) { setError('Enter your business address'); return; }
    if (!panVat.trim()) { setError('Enter your PAN/VAT number'); return; }
    setError('');
    setStep(2);
  };

  // Step 3: Documents → Proceed to Review
  const handleStep3 = () => {
    setError('');
    // Store data in a global context or pass via params
    router.push({
      pathname: '/(auth)/review-submit',
      params: {
        category: selectedCategory!,
        categoryName: translatedCategories.find(c => c.id === selectedCategory)?.name || selectedCategory!,
        businessName,
        businessAddress,
        panVat,
        businessRegDoc: businessRegDoc || '',
        storeLicense: storeLicense || '',
        storePhotos: storePhotos.length.toString(),
        storePhotosJson: JSON.stringify(storePhotos),
      },
    });
  };

  const handleUpload = (setFn: (v: string) => void) => {
    setFn('uploaded_document.pdf');
  };

  const handleAddPhoto = () => {
    setStorePhotos([...storePhotos, `photo_${storePhotos.length + 1}.jpg`]);
  };

  const getSubtitle = () => {
    switch (step) {
      case 0: return 'Choose the category that best describes your business';
      case 1: return 'Tell us about your business so we can set up your store';
      case 2: return 'Upload documents to verify your business (optional for now)';
      default: return '';
    }
  };

  return (
    <AuthLayout
      illustrationAlignWithCard
      illustration={
        step === 0 ? (
          <CategoryIllustration />
        ) : (
          <VerificationIllustration />
        )
      }
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <Text style={styles.title}>Set Up Your Store</Text>
        <Text style={styles.subtitle}>{getSubtitle()}</Text>
        <StepProgress steps={STEPS} currentStep={step} />
      </Animated.View>

      {/* Error */}
      {error ? (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.errorWrap}>
          <Ionicons name="alert-circle" size={16} color={colors.error.main} />
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}

      {/* Step 1: Category Selection */}
      {step === 0 && (
        <Animated.View entering={FadeInRight.delay(150).duration(400)}>
          <View style={styles.grid}>
            {translatedCategories.map((cat, index) => (
              <Animated.View
                key={cat.id}
                entering={FadeInUp.delay(200 + index * 50).duration(350)}
              >
                <Pressable
                  style={[
                    styles.categoryCard,
                    selectedCategory === cat.id && {
                      borderColor: cat.color,
                      backgroundColor: cat.bgColor,
                    },
                  ]}
                  onPress={() => { setSelectedCategory(cat.id); setError(''); }}
                >
                  <View style={[styles.iconWrap, { backgroundColor: cat.bgColor }]}>
                    <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.cardRow}>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      {selectedCategory === cat.id && (
                        <View style={[styles.checkBadge, { backgroundColor: cat.color }]}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.categoryDesc}>{cat.description}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <Button
            title="Continue"
            onPress={handleStep1}
            disabled={!selectedCategory}
          />
        </Animated.View>
      )}

      {/* Step 2: Business Info */}
      {step === 1 && (
        <Animated.View entering={FadeInRight.delay(150).duration(400)}>
          <FormInput
            icon="business-outline"
            placeholder="Business / Store Name"
            value={businessName}
            onChangeText={setBusinessName}
            autoCapitalize="words"
          />
          <FormInput
            icon="location-outline"
            placeholder="Business Address"
            value={businessAddress}
            onChangeText={setBusinessAddress}
          />
          <FormInput
            icon="document-text-outline"
            placeholder="PAN / VAT Number"
            value={panVat}
            onChangeText={setPanVat}
          />
          <View style={styles.stepButtons}>
            <Button title="Back" variant="outline" onPress={() => setStep(0)} />
            <View style={{ flex: 1 }}>
              <Button title="Continue" onPress={handleStep2} />
            </View>
          </View>
        </Animated.View>
      )}

      {/* Step 3: Documents */}
      {step === 2 && (
        <Animated.View entering={FadeInRight.delay(150).duration(400)}>
          {/* Business Registration */}
          <Text style={styles.sectionLabel}>Business Registration Document</Text>
          <Pressable style={styles.uploadArea} onPress={() => handleUpload(setBusinessRegDoc)}>
            {businessRegDoc ? (
              <View style={styles.uploadedRow}>
                <View style={styles.uploadedIcon}>
                  <Ionicons name="document-text" size={20} color={colors.success.main} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadedName}>{businessRegDoc}</Text>
                  <Text style={styles.uploadedStatus}>Uploaded</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload-outline" size={28} color={colors.primary[300]} />
                <Text style={styles.uploadText}>Tap to upload or drag & drop</Text>
                <Text style={styles.uploadHint}>PDF, JPG, PNG — max 10MB</Text>
              </View>
            )}
          </Pressable>

          {/* PAN / License */}
          <Text style={styles.sectionLabel}>PAN Card / Store License</Text>
          <Pressable style={styles.uploadArea} onPress={() => handleUpload(setStoreLicense)}>
            {storeLicense ? (
              <View style={styles.uploadedRow}>
                <View style={styles.uploadedIcon}>
                  <Ionicons name="document-text" size={20} color={colors.success.main} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadedName}>{storeLicense}</Text>
                  <Text style={styles.uploadedStatus}>Uploaded</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.success.main} />
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Ionicons name="cloud-upload-outline" size={28} color={colors.primary[300]} />
                <Text style={styles.uploadText}>Tap to upload or drag & drop</Text>
                <Text style={styles.uploadHint}>PDF, JPG, PNG — max 10MB</Text>
              </View>
            )}
          </Pressable>

          {/* Store Photos */}
          <Text style={styles.sectionLabel}>Store Photos (Optional)</Text>
          <View style={styles.photosGrid}>
            {storePhotos.map((photo, i) => (
              <View key={i} style={styles.photoThumb}>
                <Ionicons name="image" size={24} color={colors.primary[300]} />
                <Text style={styles.photoName}>Photo {i + 1}</Text>
              </View>
            ))}
            <Pressable style={styles.addPhotoBtn} onPress={handleAddPhoto}>
              <Ionicons name="add-circle-outline" size={28} color={colors.primary[500]} />
              <Text style={styles.addPhotoText}>Add</Text>
            </Pressable>
          </View>

          <View style={styles.stepButtons}>
            <Button title="Back" variant="outline" onPress={() => setStep(1)} />
            <View style={{ flex: 1 }}>
              <Button title="Review & Submit" onPress={handleStep3} />
            </View>
          </View>
        </Animated.View>
      )}
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
    marginBottom: 20,
    lineHeight: 20,
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
  // Category styles
  grid: {
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[0],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.neutral[800],
  },
  categoryDesc: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.neutral[500],
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Business info + documents styles
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
    gap: 10,
    marginBottom: 20,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  photoName: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.primary[500],
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: colors.primary[500],
  },
  stepButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
