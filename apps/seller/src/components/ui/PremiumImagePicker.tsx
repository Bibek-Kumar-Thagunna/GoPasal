import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../../design-system/tokens/colors';
import { spacing, radius } from '../../design-system/tokens/spacing';
import { uploadSellerProductImage } from '../../services/sellerMediaUpload';

interface Props {
  value: string | null;
  onChange: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
}

export function PremiumImagePicker({ value, onChange, label = 'Upload Image', maxSizeMB = 5 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePick = async () => {
    try {
      setError(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Size validation (approximate from base64 if size not provided, otherwise from fileSize)
        const sizeInMB = (asset.fileSize || 0) / (1024 * 1024);
        if (sizeInMB > maxSizeMB) {
          setError(`File is too large (max ${maxSizeMB}MB)`);
          return;
        }

        await uploadImage(asset.uri, asset.fileName || 'upload.jpg', asset.mimeType || 'image/jpeg');
      }
    } catch (err) {
      setError('Failed to pick image');
    }
  };

  const uploadImage = async (uri: string, name: string, type: string) => {
    setUploading(true);
    try {
      const url = await uploadSellerProductImage(uri, name, type);
      onChange(url);
    } catch {
      setError('Upload failed. Check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Pressable 
        style={[styles.uploadBox, value && styles.uploadBoxHasValue, error && styles.uploadBoxError]} 
        onPress={handlePick}
        disabled={uploading}
      >
        {uploading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary[500]} />
            <Text style={styles.uploadingText}>Uploading securely...</Text>
          </View>
        ) : value ? (
          <Animated.View entering={FadeIn} style={StyleSheet.absoluteFill}>
            <Image source={{ uri: value }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            <View style={styles.overlay}>
              <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
              <Text style={styles.overlayText}>Tap to change</Text>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.center}>
            <View style={styles.iconWrap}>
              <Ionicons name="cloud-upload-outline" size={28} color={colors.primary[500]} />
            </View>
            <Text style={styles.placeholderText}>Tap or drag to upload</Text>
            <Text style={styles.hintText}>JPG, PNG max {maxSizeMB}MB</Text>
          </View>
        )}
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  uploadBox: {
    height: 160,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutral[200],
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxHasValue: {
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  uploadBoxError: {
    borderColor: colors.error.main,
    backgroundColor: colors.error.light,
  },
  center: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  placeholderText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.neutral[700],
  },
  hintText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.neutral[500],
  },
  uploadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.primary[600],
    marginTop: spacing.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  overlayText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#fff',
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.error.main,
    marginTop: 4,
  },
});
