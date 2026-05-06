import { create } from 'zustand';

export type ToastKind = 'info' | 'success' | 'error';

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
  durationMs: number;
};

type ToastsState = {
  toasts: Toast[];
  show: (input: { message: string; kind?: ToastKind; durationMs?: number }) => void;
  dismiss: (id: number) => void;
  clear: () => void;
};

let counter = 0;

export const useToastsStore = create<ToastsState>((set, get) => ({
  toasts: [],
  show({ message, kind = 'info', durationMs = 3000 }) {
    counter += 1;
    const id = counter;
    set((state) => ({ toasts: [...state.toasts, { id, kind, message, durationMs }] }));
    setTimeout(() => get().dismiss(id), durationMs);
  },
  dismiss(id) {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  clear() {
    set({ toasts: [] });
  },
}));

export function showToast(message: string, kind: ToastKind = 'info', durationMs = 3000): void {
  useToastsStore.getState().show({ message, kind, durationMs });
}
