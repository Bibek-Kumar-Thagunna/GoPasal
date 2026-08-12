"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastFn = {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastFn | null>(null);

let idSeq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const show = useCallback((message: string, tone: ToastTone = "info") => {
    const id = `t-${Date.now()}-${idSeq++}`;
    setItems((xs) => [...xs.slice(-5), { id, message, tone }]);
    window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 4000);
  }, [dismiss]);

  const value = useMemo(
    (): ToastFn => ({
      show,
      success: (m) => show(m, "success"),
      error: (m) => show(m, "error"),
      dismiss,
    }),
    [dismiss, show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[120] flex w-[min(384px,calc(100vw-3rem))] flex-col gap-2"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-white/[0.1] bg-[#12142e]/96 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <div className="mt-0.5 shrink-0">
              {t.tone === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
              ) : t.tone === "error" ? (
                <XCircle className="h-5 w-5 text-rose-400" aria-hidden />
              ) : (
                <Info className="h-5 w-5 text-sky-400" aria-hidden />
              )}
            </div>
            <p className="flex-1 text-[13px] leading-snug text-white/90">{t.message}</p>
            <button
              type="button"
              aria-label="Dismiss"
              className="shrink-0 rounded-lg p-1 text-white/40 transition hover:bg-white/[0.08] hover:text-white"
              onClick={() => dismiss(t.id)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast requires ToastProvider");
  return ctx;
}
