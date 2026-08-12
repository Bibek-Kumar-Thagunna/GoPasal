import { storage } from './storage';
import type { OnboardingStep } from '../store/registration-flow.store';

const STORAGE_KEY = 'gp_seller_registration_flow';

export type PersistedRegistration = {
  completedStep: OnboardingStep;
  name: string;
  email: string;
  phone: string;
  otpVerified: boolean;
  category: string | null;
  businessName: string;
  businessAddress: string;
  panVat: string;
  businessRegDoc: string;
  storeLicense: string;
  storePhotos: string[];
};

export async function loadPersistedRegistration(): Promise<PersistedRegistration | null> {
  try {
    const raw = await storage.getItemAsync(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedRegistration;
  } catch {
    return null;
  }
}

export async function savePersistedRegistration(snapshot: PersistedRegistration): Promise<void> {
  await storage.setItemAsync(STORAGE_KEY, JSON.stringify(snapshot));
}

export async function clearPersistedRegistration(): Promise<void> {
  await storage.deleteItemAsync(STORAGE_KEY);
}
