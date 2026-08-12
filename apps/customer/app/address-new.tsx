import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../src/design-system/primitives/GText';
import { Button } from '../src/design-system/primitives/Button';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import { useCreateAddress } from '../src/services/hooks';
import { useLocationStore } from '../src/store/location.store';
import { useTranslation, type TranslationKey } from '../src/i18n';
import { WebPageShell } from '../src/components/WebPageShell';
import { reverseGeocodeGoogle } from '../src/utils/google-maps';

export default function AddressNewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const createAddress = useCreateAddress();
  const { user } = require('../src/store/auth.store').useAuthStore();
  const [label, setLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Kathmandu');
  const [landmark, setLandmark] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone?.startsWith('guest_') ? '' : (user?.phone || ''));
  const [buildingName, setBuildingName] = useState('');
  const [floor, setFloor] = useState('');
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const fetchCurrentLocation = async () => {
    setIsLocating(true);
    setError('');
    try {
      let lat: number = 27.7172;
      let lon: number = 85.3240;

      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 60000,
              });
            });
            lat = pos.coords.latitude;
            lon = pos.coords.longitude;
          } catch (geoErr) {
            console.warn("Browser GPS unavailable or denied, attempting IP location fallback:", geoErr);
            try {
              const ipRes = await fetch("https://ipapi.co/json/");
              const ipData = await ipRes.json();
              if (ipData && ipData.latitude && ipData.longitude) {
                lat = ipData.latitude;
                lon = ipData.longitude;
              }
            } catch {}
          }
        }
      } else {
        const Location = require('expo-location');
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;
        }
      }

      // Reverse geocode via Google / Photon OSM
      const geoResult = await reverseGeocodeGoogle(lat, lon);
      if (geoResult) {
        setAddressLine(geoResult.formattedAddress || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        setCity(geoResult.city || 'Kathmandu');
        if ((geoResult as any).mainText && !buildingName) {
          setBuildingName((geoResult as any).mainText);
        }
      } else {
        setAddressLine(`Location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        setCity('Kathmandu');
      }

      useLocationStore.getState().setLocation({
        latitude: lat,
        longitude: lon,
        address: geoResult?.formattedAddress || 'Current Location',
      });
    } catch (e: any) {
      console.warn("Location error:", e);
      setError('Could not detect exact location. Please enter your street / area.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSave = () => {
    if (!addressLine.trim() || addressLine.trim().length < 5) {
      setError(t('addressNew.errFull'));
      return;
    }
    setError('');
    createAddress.mutate(
      {
        label: label.trim() || 'Home',
        addressLine: addressLine.trim(),
        city: city.trim() || 'Kathmandu',
        landmark: landmark.trim() || undefined,
        contactName: contactName.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        buildingName: buildingName.trim() || undefined,
        floor: floor.trim() || undefined,
        latitude: useLocationStore.getState().location?.latitude ?? 27.7172,
        longitude: useLocationStore.getState().location?.longitude ?? 85.324,
        isDefault: true,
      },
      {
        onSuccess: () => router.back(),
        onError: () => setError(t('addressNew.errSave')),
      }
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <WebPageShell>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/' as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText variant="h2" color={colors.neutral[900]}>{t('addressNew.title')}</GText>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.chipRow}>
          {([
            { value: 'Home', labelKey: 'addressNew.home' },
            { value: 'Work', labelKey: 'addressNew.work' },
            { value: 'Other', labelKey: 'addressNew.other' },
          ] as const).map((l) => (
            <Pressable
              key={l.value}
              onPress={() => setLabel(l.value)}
              style={[styles.chip, label === l.value && styles.chipOn]}
            >
              <GText variant="bodySm" weight={label === l.value ? 'semibold' : 'regular'}>
                {t(l.labelKey as TranslationKey)}
              </GText>
            </Pressable>
          ))}
        </View>
        <Button 
          label={isLocating ? 'Detecting Location...' : (t('addressNew.useCurrentLocation' as any) !== 'addressNew.useCurrentLocation' ? t('addressNew.useCurrentLocation' as any) : 'Use Current Location')} 
          variant="outline" 
          loading={isLocating}
          onPress={fetchCurrentLocation} 
          style={{ marginBottom: spacing.md }} 
        />

        <GText variant="caption" color={colors.neutral[500]}>{(t('checkout.contactName' as any) !== 'checkout.contactName' ? t('checkout.contactName' as any) : 'Contact Name')}</GText>
        <TextInput
          style={styles.input}
          value={contactName}
          onChangeText={setContactName}
          placeholder="e.g. John Doe"
          placeholderTextColor={colors.neutral[400]}
        />

        <GText variant="caption" color={colors.neutral[500]}>{(t('checkout.contactPhone' as any) !== 'checkout.contactPhone' ? t('checkout.contactPhone' as any) : 'Contact Phone')}</GText>
        <TextInput
          style={styles.input}
          value={contactPhone}
          onChangeText={setContactPhone}
          placeholder="e.g. 98XXXXXXXX"
          keyboardType="phone-pad"
          placeholderTextColor={colors.neutral[400]}
        />

        <GText variant="caption" color={colors.neutral[500]}>{t('addressNew.streetArea')}</GText>
        <TextInput
          style={styles.input}
          value={addressLine}
          onChangeText={setAddressLine}
          placeholder={t('addressNew.streetPlaceholder')}
          placeholderTextColor={colors.neutral[400]}
        />
        
        <GText variant="caption" color={colors.neutral[500]}>{(t('checkout.buildingName' as any) !== 'checkout.buildingName' ? t('checkout.buildingName' as any) : 'Building / Block Name')}</GText>
        <TextInput
          style={styles.input}
          value={buildingName}
          onChangeText={setBuildingName}
          placeholder="e.g. Block A"
          placeholderTextColor={colors.neutral[400]}
        />

        <GText variant="caption" color={colors.neutral[500]}>{(t('checkout.floor' as any) !== 'checkout.floor' ? t('checkout.floor' as any) : 'Floor')}</GText>
        <TextInput
          style={styles.input}
          value={floor}
          onChangeText={setFloor}
          placeholder="e.g. 2nd Floor"
          placeholderTextColor={colors.neutral[400]}
        />

        <GText variant="caption" color={colors.neutral[500]}>{t('addressNew.city')}</GText>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholderTextColor={colors.neutral[400]}
        />
        <GText variant="caption" color={colors.neutral[500]}>{t('addressNew.landmark')}</GText>
        <TextInput
          style={styles.input}
          value={landmark}
          onChangeText={setLandmark}
          placeholderTextColor={colors.neutral[400]}
        />
        {error ? (
          <GText variant="bodySm" color={colors.error.main}>
            {error}
          </GText>
        ) : null}
        <Button
          label={t('addressNew.save')}
          fullWidth
          size="lg"
          loading={createAddress.isPending}
          onPress={handleSave}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
      </WebPageShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing.lg, gap: spacing.md },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
  },
  chipOn: { backgroundColor: colors.primary[100] },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[0],
  },
});
