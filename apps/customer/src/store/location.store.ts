import { create } from 'zustand';
import type { GeoLocation } from '../types';

interface LocationState {
  location: GeoLocation | null;
  addressLabel: string;
  deliveryTime: string;
  hasPermission: boolean | null;
  isLoading: boolean;
  setLocation: (location: GeoLocation) => void;
  setPermission: (hasPermission: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  location: null,
  addressLabel: 'Set delivery location',
  deliveryTime: '30 minutes',
  hasPermission: null,
  isLoading: false,

  setLocation: (location) =>
    set({
      location,
      addressLabel: location.formattedAddress || location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      deliveryTime: '30 minutes',
      isLoading: false,
    }),

  setPermission: (hasPermission) =>
    set({ hasPermission }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  clear: () =>
    set({ location: null, hasPermission: null, addressLabel: '', deliveryTime: '' }),
}));
