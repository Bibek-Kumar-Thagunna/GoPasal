import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  FlatList,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { GText } from "../src/design-system/primitives/GText";
import { Button } from "../src/design-system/primitives/Button";
import { colors } from "../src/design-system/tokens/colors";
import { spacing } from "../src/design-system/tokens/spacing";
import { useLocationStore } from "../src/store/location.store";
import { useTranslation } from "../src/i18n";
import MapPicker from "../src/components/MapPicker";
import {
  searchPlacesGoogle,
  reverseGeocodeGoogle,
  getPlaceDetails,
  GooglePlace,
  hasValidGoogleMapsKey
} from "../src/utils/google-maps";

export default function LocationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const setLocation = useLocationStore((s) => s.setLocation);
  const setPermission = useLocationStore((s) => s.setPermission);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map State
  const [showMap, setShowMap] = useState(false);
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | undefined>(undefined);
  const [formattedAddress, setFormattedAddress] = useState<string>("Loading address...");
  const [placeId, setPlaceId] = useState<string | undefined>();
  const [city, setCity] = useState<string>("Nepal");
  const [isLowAccuracy, setIsLowAccuracy] = useState(false);

  // Search State
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<GooglePlace[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const goBackOrHome = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/" as any);
  };

  const handleUseCurrentLocation = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let lat: number, lon: number, acc: number | undefined;

      try {
        if (Platform.OS === "web") {
          if (typeof navigator === "undefined" || !navigator.geolocation) {
            throw new Error("Geolocation unsupported");
          }
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          acc = pos.coords.accuracy;
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setPermission(false);
            throw new Error("Permission denied");
          }
          setPermission(true);
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });
          lat = position.coords.latitude;
          lon = position.coords.longitude;
          acc = position.coords.accuracy || undefined;
        }
      } catch (locationErr: any) {
        console.warn("Hardware location failed, attempting IP fallback:", locationErr);
        try {
          const ipRes = await fetch("https://ipapi.co/json/");
          const ipData = await ipRes.json();
          if (ipData && ipData.latitude && ipData.longitude) {
            lat = ipData.latitude;
            lon = ipData.longitude;
            acc = 5000; // Low accuracy indicator for IP-based location
          } else {
            throw locationErr;
          }
        } catch (ipErr) {
          throw locationErr;
        }
      }

      setAccuracy(acc);
      setMapCoords({ lat, lng: lon });

      // Reverse geocode immediately
      const geoResult = await reverseGeocodeGoogle(lat, lon);
      if (geoResult) {
        setFormattedAddress(geoResult.formattedAddress);
        setPlaceId(geoResult.placeId);
        setCity(geoResult.city);
      } else {
        setFormattedAddress(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      }

      // If we don't have a Google Maps API Key on Android, the native MapView will crash or show an error
      // So we should just save immediately and bypass the map screen entirely for a clean "free" fallback
      const shouldSkipMap = Platform.OS === 'android' && !hasValidGoogleMapsKey();
      
      if (shouldSkipMap) {
        saveAndComplete(lat, lon, geoResult?.formattedAddress, geoResult?.placeId, geoResult?.city, acc);
        return;
      }

      // ACCURACY RULES
      if (acc !== undefined) {
        if (acc <= 30) {
          // Rule 1: High Accuracy <= 30m -> Auto Select
          saveAndComplete(lat, lon, geoResult?.formattedAddress, geoResult?.placeId, geoResult?.city, acc);
          return;
        } else if (acc <= 100) {
          // Rule 2: Medium Accuracy 30-100m -> Show map to confirm
          setIsLowAccuracy(false);
          setShowMap(true);
        } else {
          // Rule 3: Low Accuracy > 100m -> Show warning and force manual pin
          setIsLowAccuracy(true);
          setShowMap(true);
        }
      } else {
        // Unknown accuracy -> Show map
        setIsLowAccuracy(true);
        setShowMap(true);
      }
    } catch (err: any) {
      console.warn("Location error:", err);
      if (err.message === "Permission denied" || err.code === 1) {
        setError(t("location.errBlocked") || "Location permission denied. Please search your area manually.");
      } else if (err.code === 3) {
        setError("Location request timed out. Please try again or search manually.");
      } else {
        setError(t("location.errUnavailable") || "Unable to determine location.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapLocationSelect = async (lat: number, lon: number) => {
    setMapCoords({ lat, lng: lon });
    setFormattedAddress("Fetching address...");
    const geoResult = await reverseGeocodeGoogle(lat, lon);
    if (geoResult) {
      setFormattedAddress(geoResult.formattedAddress);
      setPlaceId(geoResult.placeId);
      setCity(geoResult.city);
    } else {
      setFormattedAddress(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    }
  };

  const saveAndComplete = (
    lat: number,
    lon: number,
    addressStr?: string,
    pId?: string,
    cityStr?: string,
    acc?: number
  ) => {
    setLocation({
      latitude: lat,
      longitude: lon,
      address: addressStr || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
      formattedAddress: addressStr,
      placeId: pId,
      city: cityStr || "Nepal",
      accuracy: acc,
    });
    goBackOrHome();
  };

  const confirmMapLocation = () => {
    if (mapCoords) {
      saveAndComplete(
        mapCoords.lat,
        mapCoords.lng,
        formattedAddress,
        placeId,
        city,
        accuracy
      );
    }
  };

  // Search logic
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const id = setTimeout(async () => {
      try {
        const hits = await searchPlacesGoogle(q);
        if (!cancelled) {
          setResults(hits);
        }
      } catch (err) {
        console.error("Search error", err);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  const pickSearchResult = async (hit: GooglePlace) => {
    setQuery(hit.description);
    setShowSearch(false);
    setIsLoading(true);
    const details = await getPlaceDetails(hit.placeId);
    setIsLoading(false);
    
    if (details) {
      const shouldSkipMap = isDevAndroid || Platform.OS === 'android' && !hasValidGoogleMapsKey();
      
      if (shouldSkipMap) {
        saveAndComplete(details.latitude, details.longitude, details.formattedAddress, details.placeId, details.city, undefined);
      } else {
        setMapCoords({ lat: details.latitude, lng: details.longitude });
        setFormattedAddress(details.formattedAddress);
        setPlaceId(details.placeId);
        setCity(details.city);
        setAccuracy(undefined); // Manually picked, hide accuracy circle
        setShowMap(true);
        setIsLowAccuracy(false); // Reset warning if any
      }
    }
  };

  // Instead of relying purely on the runtime key, if we are in dev/expo go on Android, we should be extremely careful
  // We'll use a more aggressive skip map to avoid the hard crash.
  const isDevAndroid = Platform.OS === 'android' && __DEV__;
  const shouldSkipMap = isDevAndroid || Platform.OS === 'android' && !hasValidGoogleMapsKey();

  if (showMap && mapCoords) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.neutral[100] }}>
        {!shouldSkipMap ? (
          <MapPicker
            initialLat={mapCoords.lat}
            initialLon={mapCoords.lng}
            accuracy={accuracy}
            onLocationSelect={handleMapLocationSelect}
            isInteractive={true}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
            <Ionicons name="map-outline" size={64} color={colors.neutral[300]} />
            <GText variant="body" color={colors.neutral[500]} align="center" style={{ marginTop: spacing.md }}>
              Map preview is unavailable without a valid API key.
            </GText>
            <GText variant="caption" color={colors.neutral[400]} align="center" style={{ marginTop: spacing.xs }}>
              Please use the search bar above to find your location.
            </GText>
          </View>
        )}

        <SafeAreaView style={styles.mapOverlayTop} edges={["top"]}>
          <View style={styles.mapHeaderRow}>
            <Pressable
              onPress={() => setShowMap(false)}
              style={styles.mapBackBtn}
            >
              <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
            </Pressable>
            <View style={styles.mapSearchContainer}>
              <Pressable
                style={styles.mapFakeInput}
                onPress={() => setShowSearch(true)}
              >
                <Ionicons name="search" size={20} color={colors.neutral[500]} />
                <GText variant="bodySm" color={colors.neutral[500]}>
                  Search delivery location...
                </GText>
              </Pressable>
            </View>
          </View>
          {isLowAccuracy && (
            <Animated.View entering={FadeInUp} style={styles.warningBanner}>
              <Ionicons name="warning" size={20} color={colors.warning.main} />
              <GText variant="caption" color={colors.warning.dark} style={{ flex: 1 }}>
                Approximate location detected. Please move the map pin to your exact building for accurate delivery.
              </GText>
            </Animated.View>
          )}
        </SafeAreaView>

        <SafeAreaView style={styles.mapOverlayBottom} edges={["bottom"]}>
          <View style={styles.addressCard}>
            <GText variant="caption" color={colors.neutral[500]} weight="semibold">
              DELIVERY LOCATION
            </GText>
            <GText
              variant="body"
              weight="medium"
              color={colors.neutral[900]}
              style={{ marginVertical: spacing.xs }}
              numberOfLines={2}
            >
              {formattedAddress}
            </GText>
            <Button
              label="Confirm Location"
              onPress={confirmMapLocation}
              fullWidth
              size="lg"
            />
          </View>
        </SafeAreaView>


      </View>
    );
  }

  // Initial Screen
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={goBackOrHome} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.neutral[700]} />
        </Pressable>
      </View>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.center}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={40} color={colors.primary[500]} />
          </View>
          <GText variant="h2" align="center" color={colors.neutral[900]}>
            {t("location.title")}
          </GText>
          <GText variant="body" align="center" color={colors.neutral[500]}>
            {t("location.subtitle")}
          </GText>
        </Animated.View>

        {error ? (
          <GText variant="bodySm" align="center" color={colors.error.main}>
            {error}
          </GText>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.actions}>
          <Button
            label="Search delivery location"
            variant="outline"
            size="lg"
            fullWidth
            icon={<Ionicons name="search" size={20} color={colors.primary[600]} />}
            onPress={() => {
              setShowSearch(true);
            }}
          />
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <GText variant="caption" color={colors.neutral[400]}>OR</GText>
            <View style={styles.dividerLine} />
          </View>
          <Button
            label={isLoading ? t("location.gettingLocation") : t("location.useCurrentLocation")}
            fullWidth
            size="lg"
            loading={isLoading}
            icon={
              isLoading ? undefined : (
                <Ionicons name="navigate" size={20} color="#FFF" />
              )
            }
            onPress={handleUseCurrentLocation}
          />
        </Animated.View>
      </View>

      {/* Search Overlay extracted from Map View */}
      {showSearch && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface.background, zIndex: 100 }]}>
          <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
            <View style={styles.searchHeader}>
              <Pressable onPress={() => setShowSearch(false)} style={styles.mapBackBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
              </Pressable>
              <TextInput
                autoFocus
                value={query}
                onChangeText={setQuery}
                placeholder="Search for your area or landmark"
                style={styles.realSearchInput}
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
            {searching ? (
              <ActivityIndicator style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item) => item.placeId}
                contentContainerStyle={{ padding: spacing.md }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.searchResultItem}
                    onPress={() => pickSearchResult(item)}
                  >
                    <View style={styles.searchResultIcon}>
                      <Ionicons name="location-outline" size={20} color={colors.neutral[500]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <GText variant="bodySm" weight="semibold">
                        {item.mainText}
                      </GText>
                      {!!item.secondaryText && (
                        <GText variant="caption" color={colors.neutral[500]}>
                          {item.secondaryText}
                        </GText>
                      )}
                    </View>
                  </Pressable>
                )}
              />
            )}
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  header: { alignItems: "flex-end", paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, paddingHorizontal: spacing["2xl"], gap: spacing.lg },
  center: { alignItems: "center", gap: spacing.lg, marginTop: spacing.xl },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.mint[100],
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { gap: spacing.md, marginTop: "auto", paddingBottom: spacing["2xl"] },
  divider: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginVertical: spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.neutral[200] },

  // Map Styles
  mapOverlayTop: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: spacing.md },
  mapHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  mapBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapSearchContainer: { flex: 1 },
  mapFakeInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface.card,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warning.light,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning.main,
  },
  mapOverlayBottom: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, padding: spacing.md },
  addressCard: {
    backgroundColor: colors.surface.card,
    padding: spacing.lg,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  
  // Search Overlay
  searchOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.surface.background, zIndex: 20 },
  searchHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.neutral[200] },
  realSearchInput: { 
    flex: 1, 
    height: 44, 
    fontSize: 16, 
    color: colors.neutral[900],
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' })
  } as any,
  searchResultItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.neutral[100] },
  searchResultIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.neutral[100], alignItems: "center", justifyContent: "center" },
});
