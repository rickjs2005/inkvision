"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQ_ITEMS } from "./faq-data";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <LazyMotion features={domAnimation}>
      <section className="mx-auto max-w-6xl px-6 py-24 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          {/* Cabeçalho editorial — sticky no desktop */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Dúvidas</span>
            </div>
            <h2 className="mt-6 font-display text-4xl font-light tracking-[-0.02em] sm:text-5xl">
              Perguntas
              <br />
              frequentes
            </h2>
            <p className="mt-6 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
              O essencial sobre simulação, pagamentos e como colocar seu estúdio no ar. Se ficar
              qualquer dúvida, a gente responde.
            </p>
            <Button variant="ink" asChild className="mt-8">
              <Link href="/cadastro">Falar com a gente</Link>
            </Button>
          </div>

          {/* Lista de perguntas — hairlines finas entre itens */}
          <div className="border-t border-border">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="group flex w-full items-start gap-5 py-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`flex-1 text-lg font-medium tracking-[-0.01em] transition-colors ${
                        isOpen ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
                      }`}
                    >
                      {item.q}
                    </span>
                    <Plus
                      className={`mt-1 size-5 shrink-0 text-muted-foreground transition-[transform,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-foreground ${
                        isOpen ? "rotate-[135deg] text-primary" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <m.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-lg pb-7 pl-10 text-[15px] leading-relaxed text-muted-foreground">
                          {item.a}
                        </p>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}
