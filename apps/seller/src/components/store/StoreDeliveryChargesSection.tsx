import React from 'react';
import { View, StyleSheet, TextInput, Switch, Text } from 'react-native';
import { colors } from '../../design-system/tokens/colors';
import { spacing, radius } from '../../design-system/tokens/spacing';

type Props = {
  deliveryFeeText: string;
  freeDeliveryThresholdText: string;
  alwaysFreeDelivery: boolean;
  disabled?: boolean;
  pickupOnly?: boolean;
  onDeliveryFeeChange: (value: string) => void;
  onFreeDeliveryThresholdChange: (value: string) => void;
  onAlwaysFreeDeliveryChange: (value: boolean) => void;
};

export function StoreDeliveryChargesSection({
  deliveryFeeText,
  freeDeliveryThresholdText,
  alwaysFreeDelivery,
  disabled = false,
  pickupOnly = false,
  onDeliveryFeeChange,
  onFreeDeliveryThresholdChange,
  onAlwaysFreeDeliveryChange,
}: Props) {
  if (pickupOnly) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>Delivery charges</Text>
        <Text style={styles.hint}>
          Pickup-only shops do not charge delivery. Switch delivery preference above if you deliver to
          customers.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Delivery charges</Text>
      <Text style={styles.hint}>
        Set your own delivery fee — customers see it on cart and checkout. Nothing is applied until you
        save here (the platform does not auto-charge Rs 49).
      </Text>

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.switchTitle}>Always free delivery</Text>
          <Text style={styles.switchSub}>No delivery fee on any order</Text>
        </View>
        <Switch
          value={alwaysFreeDelivery}
          onValueChange={onAlwaysFreeDeliveryChange}
          disabled={disabled}
          trackColor={{ false: colors.neutral[200], true: colors.primary[200] }}
          thumbColor={alwaysFreeDelivery ? colors.primary[600] : colors.neutral[50]}
        />
      </View>

      {!alwaysFreeDelivery ? (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery fee (Rs)</Text>
            <TextInput
              style={styles.input}
              value={deliveryFeeText}
              editable={!disabled}
              onChangeText={onDeliveryFeeChange}
              placeholder="e.g. 49"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Free delivery above (Rs) — optional</Text>
            <TextInput
              style={styles.input}
              value={freeDeliveryThresholdText}
              editable={!disabled}
              onChangeText={onFreeDeliveryThresholdChange}
              placeholder="e.g. 500"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="decimal-pad"
            />
            <Text style={styles.fieldHint}>Leave empty if you never waive delivery by order size.</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  inputGroup: { marginBottom: spacing.md },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  hint: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: colors.neutral[500],
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  fieldHint: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.neutral[400],
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[900],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[50],
  },
  switchTitle: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: colors.neutral[800] },
  switchSub: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500], marginTop: 2 },
});
