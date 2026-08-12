import { create } from 'zustand';

type ConfirmDialogOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  destructive?: boolean;
};

type ConfirmDialogState = ConfirmDialogOptions & {
  visible: boolean;
  loading: boolean;
  show: (options: ConfirmDialogOptions) => void;
  hide: () => void;
  setLoading: (loading: boolean) => void;
};

const initialState = {
  visible: false,
  loading: false,
  title: '',
  message: '',
  confirmLabel: '',
  cancelLabel: '',
  onConfirm: () => {},
  destructive: false,
};

export const useConfirmDialogStore = create<ConfirmDialogState>((set) => ({
  ...initialState,
  show: (options) =>
    set({
      ...options,
      visible: true,
      loading: false,
    }),
  hide: () => set({ ...initialState }),
  setLoading: (loading) => set({ loading }),
}));
