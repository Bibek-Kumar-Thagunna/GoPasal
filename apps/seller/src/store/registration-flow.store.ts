import { create } from 'zustand';

/**
 * Holds all registration data in memory across screens.
 * NO data is saved to the database until the final "Submit for Review" step.
 */

export type OnboardingStep = 'register' | 'otp-verified' | 'category' | 'verification' | 'submitted';

import {
  clearPersistedRegistration,
  savePersistedRegistration,
  loadPersistedRegistration,
  type PersistedRegistration,
} from '../utils/registration-persist';

function persistSnapshot(state: RegistrationFlowState) {
  const snapshot: PersistedRegistration = {
    completedStep: state.completedStep,
    name: state.name,
    email: state.email,
    phone: state.phone,
    otpVerified: state.otpVerified,
    category: state.category,
    businessName: state.businessName,
    businessAddress: state.businessAddress,
    panVat: state.panVat,
    businessRegDoc: state.businessRegDoc,
    storeLicense: state.storeLicense,
    storePhotos: state.storePhotos,
  };
  void savePersistedRegistration(snapshot);
}

export function clearRegistrationFlowPersistence(): void {
  void clearPersistedRegistration();
}

export async function hydrateRegistrationFlow(): Promise<void> {
  const saved = await loadPersistedRegistration();
  if (!saved) return;
  useRegistrationFlowStore.setState({
    completedStep: saved.completedStep,
    name: saved.name,
    email: saved.email,
    phone: saved.phone,
    otpVerified: saved.otpVerified,
    category: saved.category,
    businessName: saved.businessName,
    businessAddress: saved.businessAddress,
    panVat: saved.panVat,
    businessRegDoc: saved.businessRegDoc,
    storeLicense: saved.storeLicense,
    storePhotos: saved.storePhotos,
  });
}

interface RegistrationFlowState {
  completedStep: OnboardingStep;
  name: string;
  email: string;
  phone: string;
  password: string;
  otp: string;
  otpVerified: boolean;
  category: string | null;
  businessName: string;
  businessAddress: string;
  panVat: string;
  businessRegDoc: string;
  storeLicense: string;
  storePhotos: string[];
  setRegistrationData: (data: { name: string; email: string; phone: string; password: string }) => void;
  markOtpVerified: () => void;
  setCategory: (id: string) => void;
  setBusinessInfo: (data: { businessName: string; businessAddress: string; panVat: string }) => void;
  setDocuments: (data: { businessRegDoc: string; storeLicense: string; storePhotos: string[] }) => void;
  markSubmitted: () => void;
  canAccess: (step: OnboardingStep) => boolean;
  reset: () => void;
}

const STEP_ORDER: OnboardingStep[] = ['register', 'otp-verified', 'category', 'verification', 'submitted'];

const initialState = {
  completedStep: 'register' as OnboardingStep,
  name: '',
  email: '',
  phone: '',
  password: '',
  otp: '',
  otpVerified: false,
  category: null as string | null,
  businessName: '',
  businessAddress: '',
  panVat: '',
  businessRegDoc: '',
  storeLicense: '',
  storePhotos: [] as string[],
};

export const useRegistrationFlowStore = create<RegistrationFlowState>((set, get) => ({
  ...initialState,

  setRegistrationData: (data) => {
    set({ ...data, completedStep: 'register' });
    persistSnapshot({ ...get(), ...data, completedStep: 'register' });
  },

  markOtpVerified: () => {
    set({ otpVerified: true, completedStep: 'otp-verified' });
    persistSnapshot({ ...get(), otpVerified: true, completedStep: 'otp-verified' });
  },

  setCategory: (id) => {
    set({ category: id, completedStep: 'category' });
    persistSnapshot({ ...get(), category: id, completedStep: 'category' });
  },

  setBusinessInfo: (data) => {
    set({ ...data });
    persistSnapshot({ ...get(), ...data });
  },

  setDocuments: (data) => {
    set({ ...data, completedStep: 'verification' });
    persistSnapshot({ ...get(), ...data, completedStep: 'verification' });
  },

  markSubmitted: () => {
    set({ completedStep: 'submitted' });
    persistSnapshot({ ...get(), completedStep: 'submitted' });
    clearRegistrationFlowPersistence();
  },

  canAccess: (step) => {
    const state = get();
    if (step === 'verification' && state.otpVerified && state.category && state.phone) {
      return true;
    }
    const currentIdx = STEP_ORDER.indexOf(state.completedStep);
    const requestedIdx = STEP_ORDER.indexOf(step);
    return requestedIdx <= currentIdx + 1;
  },

  reset: () => {
    clearRegistrationFlowPersistence();
    set({
      completedStep: 'register',
      name: '',
      email: '',
      phone: '',
      password: '',
      otp: '',
      otpVerified: false,
      category: null,
      businessName: '',
      businessAddress: '',
      panVat: '',
      businessRegDoc: '',
      storeLicense: '',
      storePhotos: [],
    });
  },
}));
