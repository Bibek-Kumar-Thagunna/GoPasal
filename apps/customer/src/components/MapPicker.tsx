import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { colors } from "../design-system/tokens/colors";

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
  const [markerPos, setMarkerPos] = useState({
    latitude: initialLat,
    longitude: initialLon,
  });

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    setMarkerPos({ latitude: initialLat, longitude: initialLon });
    mapRef.current?.animateToRegion({
      latitude: initialLat,
      longitude: initialLon,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  }, [initialLat, initialLon]);

  const handleMapPress = (e: any) => {
    if (!isInteractive) return;
    const { coordinate } = e.nativeEvent;
    setMarkerPos(coordinate);
    onLocationSelect(coordinate.latitude, coordinate.longitude);
  };

  const handleMarkerDragEnd = (e: any) => {
    if (!isInteractive) return;
    const { coordinate } = e.nativeEvent;
    setMarkerPos(coordinate);
    onLocationSelect(coordinate.latitude, coordinate.longitude);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: initialLat,
          longitude: initialLon,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={markerPos}
          draggable={isInteractive}
          onDragEnd={handleMarkerDragEnd}
        />
        {accuracy && accuracy > 0 && (
          <Circle
            center={{ latitude: initialLat, longitude: initialLon }}
            radius={accuracy}
            fillColor="rgba(20, 184, 166, 0.15)" // colors.primary[500] with opacity
            strokeColor={colors.primary[500]}
            strokeWidth={1}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
