import { create } from "zustand";

type ToastKind = "success" | "error" | "info";

interface ToastPayload {
  title: string;
  message?: string;
  kind?: ToastKind;
  duration?: number;
}

interface ToastState {
  toast: ToastPayload | null;
  show: (payload: ToastPayload) => void;
  hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (payload) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ toast: payload });
    hideTimer = setTimeout(() => {
      set({ toast: null });
      hideTimer = null;
    }, payload.duration ?? 2800);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    set({ toast: null });
  },
}));

/** Drop-in replacement for the old `react-native-toast-message` calls in stores. */
export function showToast(payload: ToastPayload) {
  useToastStore.getState().show(payload);
}
