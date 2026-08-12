import React, { createContext, useContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated as RNAnimated,
  Platform,
} from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idSeq = 0;

const TONE_COLORS: Record<ToastTone, { bg: string; text: string; icon: string }> = {
  success: { bg: '#DCFCE7', text: '#166534', icon: '✓' },
  error: { bg: '#FEE2E2', text: '#991B1B', icon: '✕' },
  info: { bg: '#DBEAFE', text: '#1E40AF', icon: 'ℹ' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = `t-${Date.now()}-${idSeq++}`;
    setItems((xs) => [...xs.slice(-3), { id, message, tone }]);
    setTimeout(() => dismiss(id), tone === 'error' ? 5000 : 3500);
  }, [dismiss]);

  const value = useMemo(() => ({
    show,
    success: (m: string) => show(m, 'success'),
    error: (m: string) => show(m, 'error'),
    info: (m: string) => show(m, 'info'),
  }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {items.map((t) => {
          const c = TONE_COLORS[t.tone];
          return (
            <Animated.View
              key={t.id}
              entering={FadeInUp.duration(300)}
              exiting={FadeOutDown.duration(200)}
              style={[styles.toast, { backgroundColor: c.bg }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: c.text }]}>
                <Text style={styles.iconText}>{c.icon}</Text>
              </View>
              <Text style={[styles.message, { color: c.text }]}>{t.message}</Text>
              <Pressable onPress={() => dismiss(t.id)} style={styles.dismissBtn}>
                <Text style={[styles.dismissText, { color: c.text }]}>✕</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast requires <ToastProvider>');
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.select({ ios: 100, default: 80 }),
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    gap: 10,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  dismissBtn: {
    padding: 4,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
  },
});
