import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image, Modal, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

interface FilePreviewCardProps {
  label: string;
  url?: string | null;
  fileName?: string;
  fileType?: 'image' | 'pdf' | 'document';
  onRemove?: () => void;
  onUploadNew?: () => void;
  uploading?: boolean;
}

export function FilePreviewCard({
  label,
  url,
  fileName,
  fileType = 'document',
  onRemove,
  onUploadNew,
  uploading = false,
}: FilePreviewCardProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const isImage = fileType === 'image' || (url && (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.webp')));

  const handlePreviewPress = () => {
    if (!url) return;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else if (isImage) {
      setModalVisible(true);
    } else {
      void Linking.openURL(url);
    }
  };

  if (!url) {
    return (
      <Pressable
        style={styles.uploadBox}
        onPress={onUploadNew}
        disabled={uploading}
      >
        <View style={styles.uploadIconWrap}>
          <Ionicons name="cloud-upload-outline" size={24} color="#059669" />
        </View>
        <View style={styles.uploadTextCol}>
          <Animated.Text style={styles.uploadTitle}>
            {uploading ? 'Uploading file…' : label}
          </Animated.Text>
          <Animated.Text style={styles.uploadSub}>
            Tap to select PDF or image document
          </Animated.Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
      </Pressable>
    );
  }

  return (
    <>
      <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
        <View style={styles.leftCol}>
          {isImage ? (
            <Image source={{ uri: url }} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <View style={styles.pdfIconBox}>
              <Ionicons name="document-text" size={24} color="#DC2626" />
            </View>
          )}

          <View style={styles.metaCol}>
            <Animated.Text style={styles.fileLabel}>{label}</Animated.Text>
            <Animated.Text style={styles.fileName} numberOfLines={1}>
              {fileName || (isImage ? 'Uploaded Image' : 'PDF Document')}
            </Animated.Text>
            <View style={styles.verifiedPill}>
              <Ionicons name="checkmark-circle" size={12} color="#059669" />
              <Animated.Text style={styles.verifiedText}>Ready for review</Animated.Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsCol}>
          <Pressable style={styles.previewBtn} onPress={handlePreviewPress}>
            <Ionicons name="eye-outline" size={16} color="#0284C7" />
            <Animated.Text style={styles.previewBtnText}>Preview</Animated.Text>
          </Pressable>

          {onRemove && (
            <Pressable style={styles.removeBtn} onPress={onRemove}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Image Fullscreen Modal preview */}
      {isImage && (
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalHeader}>
              <Animated.Text style={styles.modalTitle}>{label}</Animated.Text>
              <Pressable style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <Image source={{ uri: url }} style={styles.fullImage} resizeMode="contain" />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  uploadIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTextCol: {
    flex: 1,
  },
  uploadTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0F172A',
  },
  uploadSub: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  thumbImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  pdfIconBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaCol: {
    flex: 1,
  },
  fileLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#0F172A',
  },
  fileName: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#059669',
  },
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  previewBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#0284C7',
  },
  removeBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 8,
  },
  modalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
