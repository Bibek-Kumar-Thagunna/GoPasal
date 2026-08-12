import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/tokens/colors';
import { spacing, radius } from '../../design-system/tokens/spacing';
import { uploadSellerProductImage } from '../../services/sellerMediaUpload';

type Props = {
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  label?: string;
  maxSizeMB?: number;
};

export function ProductImageGallery({
  images,
  onChange,
  maxImages = 8,
  label = 'Product photos',
  maxSizeMB = 8,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (images.length >= maxImages) return;
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const sizeInMB = (asset.fileSize || 0) / (1024 * 1024);
      if (sizeInMB > maxSizeMB) {
        setError(`Each image must be under ${maxSizeMB}MB`);
        return;
      }
      setUploading(true);
      const url = await uploadSellerProductImage(
        asset.uri,
        asset.fileName || 'product.jpg',
        asset.mimeType || 'image/jpeg'
      );
      onChange([...images, url]);
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Text style={styles.hint}>First photo is the main image in listings. Up to {maxImages} photos.</Text>
      <View style={styles.grid}>
        {images.map((uri, idx) => (
          <View key={`${uri}-${idx}`} style={styles.tile}>
            <Image source={{ uri }} style={styles.img} resizeMode="cover" />
            <Pressable style={styles.remove} onPress={() => handleRemove(idx)} accessibilityLabel="Remove image">
              <Ionicons name="close-circle" size={26} color="#fff" />
            </Pressable>
            {idx === 0 ? (
              <View style={styles.coverBadge}>
                <Text style={styles.coverTxt}>Cover</Text>
              </View>
            ) : null}
          </View>
        ))}
        {images.length < maxImages ? (
          <Pressable style={styles.addTile} onPress={handleAdd} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={colors.primary[600]} />
            ) : (
              <>
                <Ionicons name="add" size={32} color={colors.primary[500]} />
                <Text style={styles.addTxt}>Add photo</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.neutral[700], marginBottom: 4 },
  hint: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500], marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
  },
  img: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 14,
  },
  coverBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coverTxt: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: '#fff' },
  addTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.card,
    gap: 4,
  },
  addTxt: { fontFamily: 'Inter-Medium', fontSize: 11, color: colors.neutral[600] },
  err: { fontFamily: 'Inter', fontSize: 12, color: colors.error.main, marginTop: 6 },
});
