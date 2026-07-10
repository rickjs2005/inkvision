"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  closing?: boolean;
};

type Listener = (toasts: ToastItem[]) => void;

const DURATION = 4000;

// Estado de módulo — desacoplado da árvore React (sem context/provider obrigatório).
let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();
let nextId = 1;

function emit() {
  for (const listener of listeners) listener(toasts);
}

function removeToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

// Marca o toast como "saindo" para a animação CSS rodar antes da remoção.
function closeToast(id: number) {
  const item = toasts.find((t) => t.id === id);
  if (!item || item.closing) return;
  toasts = toasts.map((t) => (t.id === id ? { ...t, closing: true } : t));
  emit();
  window.setTimeout(() => removeToast(id), 200);
}

function addToast(message: string, variant: ToastVariant) {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  emit();
  if (typeof window !== "undefined") {
    window.setTimeout(() => closeToast(id), DURATION);
  }
}

type ToastFn = {
  (message: string, opts?: { variant?: ToastVariant }): void;
  success: (message: string) => void;
  error: (message: string) => void;
};

export const toast: ToastFn = (message, opts) => {
  addToast(message, opts?.variant ?? "default");
};
toast.success = (message: string) => addToast(message, "success");
toast.error = (message: string) => addToast(message, "error");

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  default: "border-l-4 border-l-border",
  success: "border-l-4 border-l-emerald-500 text-emerald-500",
  error: "border-l-4 border-l-destructive text-destructive",
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>(toasts);

  useEffect(() => {
    const listener: Listener = (next) => setItems([...next]);
    listeners.add(listener);
    // Sincroniza com toasts já emitidos antes da montagem.
    listener(toasts);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={cn(
            "pointer-events-auto max-w-sm rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg",
            "duration-200 ease-out",
            t.closing
              ? "animate-out fade-out slide-out-to-right-6 fill-mode-forwards"
              : "animate-in fade-in slide-in-from-right-6",
            VARIANT_ACCENT[t.variant]
          )}
        >
          <span className="text-foreground">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
