"use client";

import { useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "./faq-data";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <LazyMotion features={domAnimation}>
    <section className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-center text-3xl font-bold tracking-tight">Perguntas frequentes</h2>
      <div className="mt-10 flex flex-col gap-3">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className="rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium"
                aria-expanded={isOpen}
              >
                {item.q}
                <ChevronDown
                  className={`size-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-muted-foreground">{item.a}</p>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
    </LazyMotion>
  );
}
