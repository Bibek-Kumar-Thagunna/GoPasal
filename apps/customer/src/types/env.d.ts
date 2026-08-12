/// <reference types="react" />

// Fix React 18 + React Native JSX type clash
// This is a well-known issue where @types/react@18.3 JSX namespace
// conflicts with React Native's class-based components.
// See: https://github.com/facebook/react-native/issues/38dependencies

import 'react';

declare module 'react' {
  // Augment JSX.Element to accept RN component class types
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface IntrinsicAttributes extends React.Attributes {}
  }
}

// expo-router re-exports
declare module 'expo-router' {
  export { useRouter, useLocalSearchParams, useSegments, usePathname, Link, Redirect, Slot, Stack, Tabs, ErrorBoundary } from 'expo-router';
}

// Expo env variables
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_API_BASE_URL: string;
    EXPO_PUBLIC_ASSETS_BASE_URL: string;
    EXPO_PUBLIC_REGION_DEFAULT: string;
    EXPO_PUBLIC_CURRENCY: string;
    EXPO_PUBLIC_CURRENCY_SYMBOL: string;
  }
}
