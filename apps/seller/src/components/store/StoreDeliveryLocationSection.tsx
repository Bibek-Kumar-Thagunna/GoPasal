import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../design-system/tokens/colors';
import { spacing, radius } from '../../design-system/tokens/spacing';
import {
  COORDINATE_LIMITS,
  DELIVERY_RADIUS_PRESETS_KM,
  formatCoordinate,
} from '../../utils/coordinates';

type Props = {
  latitudeText: string;
  longitudeText: string;
  radiusText: string;
  disabled?: boolean;
  requiresDeliveryArea: boolean;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onRadiusChange: (value: string) => void;
};

export function StoreDeliveryLocationSection({
  latitudeText,
  longitudeText,
  radiusText,
  disabled = false,
  requiresDeliveryArea,
  onLatitudeChange,
  onLongitudeChange,
  onRadiusChange,
}: Props) {
  const [locating, setLocating] = useState(false);

  const handleUseCurrentLocation = useCallback(async () => {
    if (disabled) return;
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location permission',
          'Allow location access so we can pin your shop. You can still enter coordinates manually.'
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      onLatitudeChange(formatCoordinate(position.coords.latitude));
      onLongitudeChange(formatCoordinate(position.coords.longitude));
    } catch {
      Alert.alert('Location error', 'Could not read GPS. Enter latitude and longitude manually.');
    } finally {
      setLocating(false);
    }
  }, [disabled, onLatitudeChange, onLongitudeChange]);

  const selectedRadius = Number(radiusText);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Shop location & delivery area</Text>
      <Text style={styles.hint}>
        Customers see shops near their address. Pin your branch and set how far you deliver
        {requiresDeliveryArea ? '' : ' (optional for pickup-only stores)'}.
      </Text>

      <Pressable
        style={[styles.gpsBtn, (disabled || locating) && styles.gpsBtnDisabled]}
        onPress={handleUseCurrentLocation}
        disabled={disabled || locating}
      >
        {locating ? (
          <ActivityIndicator color={colors.primary[600]} />
        ) : (
          <Ionicons name="navigate" size={18} color={colors.primary[600]} />
        )}
        <Text style={styles.gpsBtnText}>
          {locating ? 'Getting location…' : 'Use current location (shop GPS)'}
        </Text>
      </Pressable>

      <View style={styles.coordRow}>
        <View style={styles.coordField}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            style={styles.input}
            value={latitudeText}
            onChangeText={onLatitudeChange}
            editable={!disabled}
            placeholder="27.71720"
            placeholderTextColor={colors.neutral[400]}
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'decimal-pad'}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.coordField}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            style={styles.input}
            value={longitudeText}
            onChangeText={onLongitudeChange}
            editable={!disabled}
            placeholder="85.32400"
            placeholderTextColor={colors.neutral[400]}
            keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'decimal-pad'}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {requiresDeliveryArea ? (
        <>
          <Text style={styles.label}>Delivery radius (km)</Text>
          <View style={styles.pillsRow}>
            {DELIVERY_RADIUS_PRESETS_KM.map((km) => {
              const active = selectedRadius === km || (!radiusText && km === 3);
              return (
                <Pressable
                  key={km}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => !disabled && onRadiusChange(String(km))}
                  disabled={disabled}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{km} km</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            value={radiusText}
            onChangeText={onRadiusChange}
            editable={!disabled}
            placeholder={`${COORDINATE_LIMITS.RADIUS_MIN_KM}–${COORDINATE_LIMITS.RADIUS_MAX_KM}`}
            placeholderTextColor={colors.neutral[400]}
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>
            Orders outside this distance from your shop will be blocked at checkout once radius
            checks are enabled platform-wide.
          </Text>
        </>
      ) : (
        <Text style={styles.hint}>
          Pickup-only: location still helps customers find your shop on the map.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg, marginBottom: spacing.md },
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
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
    marginBottom: spacing.md,
  },
  gpsBtnDisabled: { opacity: 0.6 },
  gpsBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary[700],
  },
  coordRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  coordField: { flex: 1 },
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
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillActive: { backgroundColor: colors.primary[50], borderColor: colors.primary[400] },
  pillText: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.neutral[600] },
  pillTextActive: { color: colors.primary[700] },
});
