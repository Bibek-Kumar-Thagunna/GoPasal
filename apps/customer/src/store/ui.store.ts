import { create } from 'zustand';

export interface ToastOptions {
  message: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface UIState {
  searchQuery: string;
  isSearchFocused: boolean;
  activeTab: string;
  cartToastVisible: boolean;
  genericToast: ToastOptions | null;
  setSearchQuery: (query: string) => void;
  setSearchFocused: (focused: boolean) => void;
  setActiveTab: (tab: string) => void;
  showCartToast: () => void;
  hideCartToast: () => void;
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  searchQuery: '',
  isSearchFocused: false,
  activeTab: 'home',
  cartToastVisible: false,
  genericToast: null,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchFocused: (isSearchFocused) => set({ isSearchFocused }),
  setActiveTab: (activeTab) => set({ activeTab }),
  showCartToast: () => set({ cartToastVisible: true }),
  hideCartToast: () => set({ cartToastVisible: false }),
  showToast: (options) => set({ genericToast: options }),
  hideToast: () => set({ genericToast: null }),
}));

