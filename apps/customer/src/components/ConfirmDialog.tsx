import React from 'react';
import { View, Modal, Pressable, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { Button } from '../design-system/primitives/Button';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { useConfirmDialogStore } from '../store/confirm-dialog.store';

export function ConfirmDialog() {
  const {
    visible,
    title,
    message,
    confirmLabel,
    cancelLabel,
    loading,
    destructive,
    hide,
    onConfirm,
    setLoading,
  } = useConfirmDialogStore();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      hide();
    } catch {
      // Keep dialog open; caller handles user-facing error feedback.
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide}>
      <Pressable style={styles.backdrop} onPress={hide}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconWrap}>
            <Ionicons
              name="storefront-outline"
              size={28}
              color={destructive ? colors.warning.main : colors.primary[600]}
            />
          </View>
          <GText variant="h3" color={colors.neutral[900]} align="center">
            {title}
          </GText>
          <GText variant="body" color={colors.neutral[600]} align="center" style={styles.message}>
            {message}
          </GText>
          <View style={styles.actions}>
            <Button
              label={cancelLabel}
              variant="outline"
              onPress={hide}
              style={styles.actionBtn}
              disabled={loading}
            />
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={() => void handleConfirm()}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 12,
        }),
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    lineHeight: 22,
    maxWidth: 320,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
});
