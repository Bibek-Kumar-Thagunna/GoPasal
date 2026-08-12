import React from "react";
import { Image, ImageStyle } from "react-native";

export function GoPasalLogo({ size = 34, style, color }: { size?: number; style?: ImageStyle; color?: string }) {
  return (
    <Image
      source={{ uri: "/logo.png" }}
      style={[{ width: size, height: size, borderRadius: Math.round(size * 0.22) }, style]}
      resizeMode="contain"
    />
  );
}

export const LogoIcon = GoPasalLogo;
