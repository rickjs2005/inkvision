"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error";

export type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
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

function addToast(message: string, variant: ToastVariant) {
  const id = nextId++;
  toasts = [...toasts, { id, message, variant }];
  emit();
  if (typeof window !== "undefined") {
    window.setTimeout(() => removeToast(id), DURATION);
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
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, x: 24, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={cn(
              "pointer-events-auto max-w-sm rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg",
              VARIANT_ACCENT[t.variant]
            )}
          >
            <span className="text-foreground">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
