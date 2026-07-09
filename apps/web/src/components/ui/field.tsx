"use client";

import { useState } from "react";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const baseInput =
  "peer w-full rounded-md border border-input bg-background/40 text-sm outline-none transition-[border-color,box-shadow,background-color] hover:border-foreground/25 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/12";

const floatLabel = (active: boolean) =>
  cn(
    "pointer-events-none absolute origin-left transition-all",
    active ? "top-2 text-[11px] font-medium text-muted-foreground" : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70",
  );

/**
 * Campo premium com label flutuante, foco elegante (glow vermelhão), ícone
 * opcional e validação em tempo real (check verde). Uncontrolled: funciona com
 * FormData (name) e com defaultValue (edição). Padrão de qualidade do login.
 */
export function FloatingInput({
  id,
  name,
  label,
  type = "text",
  icon: Icon,
  validate,
  defaultValue,
  className,
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  icon?: LucideIcon;
  validate?: (v: string) => boolean;
  defaultValue?: string | number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "type" | "defaultValue">) {
  const [val, setVal] = useState(defaultValue != null ? String(defaultValue) : "");
  const [focused, setFocused] = useState(false);
  const valid = val.length > 0 && (validate ? validate(val) : false);
  const active = focused || val.length > 0;

  return (
    <div className="relative">
      {Icon && (
        <Icon className={cn("pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors", focused ? "text-primary" : "text-muted-foreground/70")} />
      )}
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder=" "
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(baseInput, "h-14 px-3.5 pt-4", Icon && "pl-10", valid && "pr-10", className)}
        // Extensões de navegador (gerenciadores de senha, autofill) costumam
        // injetar atributos/estilos no <input> antes da hidratação do React,
        // gerando um warning de mismatch que não tem relação com nosso código.
        suppressHydrationWarning
        {...rest}
      />
      <label htmlFor={id} className={cn(floatLabel(active), Icon ? "left-10" : "left-3.5")}>
        {label}
      </label>
      {valid && <Check className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-emerald-500" strokeWidth={2.5} />}
    </div>
  );
}

/** Textarea premium com label flutuante. */
export function FloatingTextarea({
  id,
  name,
  label,
  defaultValue,
  rows = 4,
  className,
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "name" | "defaultValue">) {
  const [val, setVal] = useState(defaultValue ?? "");
  const [focused, setFocused] = useState(false);
  const active = focused || val.length > 0;

  return (
    <div className="relative">
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder=" "
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(baseInput, "resize-none px-3.5 pb-3 pt-6", className)}
        // Ver comentário em FloatingInput: evita warning de hidratação vindo
        // de atributos/estilos injetados por extensões do navegador.
        suppressHydrationWarning
        {...rest}
      />
      <label htmlFor={id} className={cn("pointer-events-none absolute left-3.5 transition-all", active ? "top-2 text-[11px] font-medium text-muted-foreground" : "top-4 text-sm text-muted-foreground/70")}>
        {label}
      </label>
    </div>
  );
}
