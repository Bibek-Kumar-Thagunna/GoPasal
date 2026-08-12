import React from "react";
import { Image, ImageStyle } from "react-native";

export function GoPasalBrandLogo({ size = 36, style }: { size?: number; style?: ImageStyle }) {
  return (
    <Image
      source={{ uri: "/logo.png" }}
      style={[{ width: size, height: size, borderRadius: Math.round(size * 0.22) }, style]}
      resizeMode="contain"
    />
  );
}
