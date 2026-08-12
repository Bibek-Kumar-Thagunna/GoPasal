import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { AuthLayout } from '../../src/components/ui/AuthLayout';
import { FormInput } from '../../src/components/ui/FormInput';
import { Button } from '../../src/components/ui/Button';
import { VerificationIllustration } from '../../src/components/illustrations/VerificationIllustration';
import { colors } from '../../src/design-system/tokens/colors';
import apiClient from '../../src/services/api';
import { uploadKycFileFromUri } from '../../src/utils/upload-kyc-file';
import { extractApiErrorMessage } from '../../src/utils/api-error';
import { FilePreviewCard } from '../../src/components/ui/FilePreviewCard';

function Text({ style, children, ...props }: { style?: object; children: React.ReactNode }) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]} {...props}>
      {children}
    </Animated.Text>
  );
}

type VerificationPayload = {
  kycBusinessName?: string | null;
  kycAddress?: string | null;
  kycPanVat?: string | null;
  kycDocumentUrl?: string | null;
  kycStoreLicenseUrl?: string | null;
  kycStorePhotos?: string[] | null;
  adminNotes?: string | null;
};

export default function KycResubmitScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [panVat, setPanVat] = useState('');
  const [businessRegDoc, setBusinessRegDoc] = useState('');
  const [storeLicense, setStoreLicense] = useState('');
  const [storePhotos, setStorePhotos] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await apiClient.get('/seller/stores/verification-status');
        const v = data?.data as VerificationPayload | null;
        if (!v) return;
        setBusinessName(v.kycBusinessName ?? '');
        setBusinessAddress(v.kycAddress ?? '');
        setPanVat(v.kycPanVat ?? '');
        setBusinessRegDoc(v.kycDocumentUrl ?? '');
        setStoreLicense(v.kycStoreLicenseUrl ?? '');
        setStorePhotos(Array.isArray(v.kycStorePhotos) ? v.kycStorePhotos : []);
        setAdminNotes(v.adminNotes ?? '');
      } catch {
        setError('Could not load your KYC profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpload = async (setFn: (v: string) => void) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const asset = res.assets[0];
      setUploading(true);
      const webFile = (asset as { file?: File }).file;
      const url = await uploadKycFileFromUri(
        asset.uri,
        asset.name || 'document.pdf',
        asset.mimeType || 'application/pdf',
        { webFile }
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
      setUploading(true);
      const webFile = (asset as { file?: File }).file;
      const url = await uploadKycFileFromUri(
        asset.uri,
        asset.fileName || 'store-photo.jpg',
        asset.mimeType || 'image/jpeg',
        { webFile }
      );
      setStorePhotos((prev) => [...prev, url]);
      setError('');
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!businessName.trim() || !businessAddress.trim() || !panVat.trim()) {
      setError('Complete business name, address, and PAN/VAT.');
      return;
    }
    if (!businessRegDoc || !storeLicense || storePhotos.length < 1) {
      setError('Upload business registration, license, and at least one store photo.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiClient.put('/seller/stores/kyc/business-info', {
        businessName: businessName.trim(),
        panVat: panVat.trim(),
        address: businessAddress.trim(),
      });
      await apiClient.put('/seller/stores/kyc/documents', {
        kycDocumentUrl: businessRegDoc,
        kycStoreLicenseUrl: storeLicense,
      });
      await apiClient.put('/seller/stores/kyc/photos', { photoUrls: storePhotos });
      await apiClient.post('/seller/stores/kyc/submit');
      router.replace('/(auth)/under-review' as any);
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' &&
        e !== null &&
        'response' in e &&
        typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message ===
          'string'
          ? (e as { response: { data: { message: string } } }).response.data.message
          : 'Submission failed. Try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthLayout illustration={<VerificationIllustration />}>
        <Text style={{ textAlign: 'center', color: colors.neutral[500] }}>Loading…</Text>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout illustration={<VerificationIllustration />}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={styles.title}>Update KYC documents</Text>
          <Text style={styles.subtitle}>
            Fix the issues below and resubmit for admin review.
          </Text>
        </Animated.View>

        {adminNotes ? (
          <View style={styles.rejectBox}>
            <Ionicons name="alert-circle" size={20} color={colors.warning.main} />
            <Text style={styles.rejectText}>{adminNotes}</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FormInput label="Business name" value={businessName} onChangeText={setBusinessName} />
        <FormInput label="Address" value={businessAddress} onChangeText={setBusinessAddress} />
        <FormInput label="PAN / VAT" value={panVat} onChangeText={setPanVat} />

        <View style={{ marginTop: 12 }}>
          <FilePreviewCard
            label="Business Registration (PDF/Image)"
            url={businessRegDoc}
            fileName="business-registration"
            onUploadNew={() => handleUpload(setBusinessRegDoc)}
            onRemove={() => setBusinessRegDoc('')}
            uploading={uploading}
          />

          <FilePreviewCard
            label="Store PAN / License (PDF/Image)"
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
              label={storePhotos.length > 0 ? "Add another store photo" : "Store Front Photo"}
              onUploadNew={handleAddPhoto}
              uploading={uploading}
            />
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          <Button
            label={submitting ? 'Submitting…' : 'Resubmit for review'}
            fullWidth
            size="lg"
            disabled={submitting || uploading}
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontFamily: 'Poppins-Bold', marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.neutral[600], lineHeight: 22, marginBottom: 20 },
  rejectBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.warning.light,
    marginBottom: 16,
  },
  rejectText: { flex: 1, fontSize: 14, color: colors.neutral[800], lineHeight: 20 },
  error: { color: colors.error.main, marginBottom: 12, fontSize: 14 },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  uploadLabel: { fontSize: 14, color: colors.neutral[700], textAlign: 'center' },
});
