import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { GoogleMap, useJsApiLoader, Marker, Circle } from "@react-google-maps/api";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../design-system/tokens/colors";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

interface MapPickerProps {
  initialLat: number;
  initialLon: number;
  accuracy?: number; // In meters
  onLocationSelect: (lat: number, lon: number) => void;
  isInteractive?: boolean;
}

export default function MapPicker({
  initialLat,
  initialLon,
  accuracy,
  onLocationSelect,
  isInteractive = true,
}: MapPickerProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPos, setMarkerPos] = useState({ lat: initialLat, lng: initialLon });

  // Update marker if initial props change significantly
  useEffect(() => {
    setMarkerPos({ lat: initialLat, lng: initialLon });
    if (map) {
      map.panTo({ lat: initialLat, lng: initialLon });
    }
  }, [initialLat, initialLon]);

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      mapInstance.panTo({ lat: initialLat, lng: initialLon });
    },
    [initialLat, initialLon]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!isInteractive || !e.latLng) return;
    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarkerPos(newPos);
    onLocationSelect(newPos.lat, newPos.lng);
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!isInteractive || !e.latLng) return;
    const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarkerPos(newPos);
    onLocationSelect(newPos.lat, newPos.lng);
  };

  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error loading Google Maps</Text>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={{ lat: initialLat, lng: initialLon }}
      zoom={16}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
      }}
    >
      <Marker
        position={markerPos}
        draggable={isInteractive}
        onDragEnd={handleMarkerDragEnd}
        animation={google.maps.Animation.DROP}
      />
      {accuracy && accuracy > 0 && (
        <Circle
          center={{ lat: initialLat, lng: initialLon }}
          radius={accuracy}
          options={{
            fillColor: colors.primary[500],
            fillOpacity: 0.15,
            strokeColor: colors.primary[500],
            strokeOpacity: 0.8,
            strokeWeight: 1,
            clickable: false,
          }}
        />
      )}
    </GoogleMap>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral[100],
  },
  errorText: {
    color: colors.error.main,
    fontSize: 16,
  },
});
