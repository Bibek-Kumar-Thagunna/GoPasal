import { create } from 'zustand';

interface CartState {
  itemCount: number;
  totalAmount: number;
  notifications: number;
  addItem: (price: number) => void;
  clearCart: () => void;
  addNotification: () => void;
  clearNotifications: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  itemCount: 0,
  totalAmount: 0,
  notifications: 1, // Initial reference UI demo state
  addItem: (price: number) => set((state) => ({ 
    itemCount: state.itemCount + 1,
    totalAmount: state.totalAmount + price
  })),
  clearCart: () => set({ itemCount: 0, totalAmount: 0 }),
  addNotification: () => set((state) => ({ notifications: state.notifications + 1 })),
  clearNotifications: () => set({ notifications: 0 }),
}));
