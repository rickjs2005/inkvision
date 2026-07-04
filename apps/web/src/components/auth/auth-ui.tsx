"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Lock, type LucideIcon } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

/* ── Campo com label flutuante + validação em tempo real (check verde) ── */
export function Field({
  id,
  name,
  type = "text",
  label,
  icon: Icon,
  autoComplete,
  validate,
}: {
  id: string;
  name: string;
  type?: string;
  label: string;
  icon: LucideIcon;
  autoComplete?: string;
  validate?: (v: string) => boolean;
}) {
  const [v, setV] = useState("");
  const [focused, setFocused] = useState(false);
  const valid = v.length > 0 && (validate ? validate(v) : false);
  const active = focused || v.length > 0;

  return (
    <div className="relative">
      <Icon
        className={cn(
          "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors",
          focused ? "text-primary" : "text-muted-foreground/70",
        )}
      />
      <input
        id={id}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder=" "
        value={v}
        onChange={(e) => setV(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="peer h-14 w-full rounded-md border border-input bg-background/40 px-3.5 pl-10 pt-4 text-sm outline-none transition-[border-color,box-shadow,background-color] hover:border-foreground/25 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/12"
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-10 origin-left transition-all",
          active
            ? "top-2 text-[11px] font-medium text-muted-foreground"
            : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70",
        )}
      >
        {label}
      </label>
      {valid && <Check className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-emerald-500" strokeWidth={2.5} />}
    </div>
  );
}

/* ── Senha: label flutuante + mostrar/ocultar + barra de força ── */
export function PasswordField({
  withStrength = false,
  autoComplete = "current-password",
}: {
  withStrength?: boolean;
  autoComplete?: string;
}) {
  const [v, setV] = useState("");
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const active = focused || v.length > 0;
  const s = score(v);

  return (
    <div>
      <div className="relative">
        <Lock className={cn("pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors", focused ? "text-primary" : "text-muted-foreground/70")} />
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          placeholder=" "
          value={v}
          onChange={(e) => setV(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="peer h-14 w-full rounded-md border border-input bg-background/40 px-3.5 pl-10 pr-11 pt-4 text-sm outline-none transition-[border-color,box-shadow,background-color] hover:border-foreground/25 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/12"
        />
        <label htmlFor="password" className={cn("pointer-events-none absolute left-10 origin-left transition-all", active ? "top-2 text-[11px] font-medium text-muted-foreground" : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70")}>
          Senha
        </label>
        <button
          type="button"
          onClick={() => setShow((x) => !x)}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {withStrength && v.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < s ? STRENGTH[s].bar : "bg-border")} />
            ))}
          </div>
          <span className={cn("font-mono text-[10px] uppercase tracking-wider", STRENGTH[s].text)}>{STRENGTH[s].label}</span>
        </div>
      )}
    </div>
  );
}

function score(pw: string): 0 | 1 | 2 | 3 | 4 {
  let n = 0;
  if (pw.length >= 8) n++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) n++;
  if (/\d/.test(pw)) n++;
  if (/[^A-Za-z0-9]/.test(pw)) n++;
  return n as 0 | 1 | 2 | 3 | 4;
}
const STRENGTH = [
  { label: "fraca", bar: "bg-destructive", text: "text-destructive" },
  { label: "fraca", bar: "bg-destructive", text: "text-destructive" },
  { label: "média", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { label: "boa", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  { label: "forte", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
] as const;

/* ── Login social (Google/Apple) ── */
export function SocialButtons() {
  async function social(provider: "google" | "apple", nome: string) {
    try {
      const res = (await signIn.social({
        provider,
        callbackURL: "/painel",
      } as Parameters<typeof signIn.social>[0])) as { error?: unknown } | undefined;
      if (res?.error) throw new Error();
    } catch {
      toast.error(`Login com ${nome} chega em breve. Use e-mail por enquanto.`);
    }
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={() => social("google", "Google")} className="btn-social">
        <GoogleIcon /> Google
      </button>
      <button type="button" onClick={() => social("apple", "Apple")} className="btn-social">
        <AppleIcon /> Apple
      </button>
      <style>{`.btn-social{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;height:2.75rem;border-radius:var(--radius);border:1px solid var(--border);font-size:.875rem;font-weight:500;transition:background-color .2s,border-color .2s,transform .2s}.btn-social:hover{background:color-mix(in oklab,var(--foreground) 4%,transparent);border-color:color-mix(in oklab,var(--foreground) 30%,transparent);transform:translateY(-1px)}`}</style>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="flex items-center gap-4">
      <span className="rule flex-1" />
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">ou</span>
      <span className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
    </div>
  );
}

export function AuthProof() {
  return (
    <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
      <div className="inline-flex items-center gap-1.5">
        <span className="text-primary">★★★★★</span> 4.9
      </div>
      <span className="h-3 w-px bg-border" />
      <div><span className="font-display text-sm normal-case tracking-normal text-foreground">12.000+</span> simulações</div>
      <span className="h-3 w-px bg-border" />
      <div><span className="font-display text-sm normal-case tracking-normal text-foreground">120</span> estúdios</div>
    </dl>
  );
}

export function Benefits() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {["Simulação IA", "Chat", "Aprovação da arte", "Agenda"].map((f) => (
        <li key={f} className="inline-flex items-center gap-1.5 text-sm text-foreground/80">
          <Check className="size-3.5 text-primary" strokeWidth={2.5} />
          {f}
        </li>
      ))}
    </ul>
  );
}

/* ícones de marca (inline — lucide não traz logos) */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M17.05 12.7c-.03-2.5 2.04-3.7 2.13-3.76-1.16-1.7-2.97-1.93-3.61-1.96-1.54-.15-3 .9-3.78.9-.78 0-1.98-.88-3.25-.86-1.67.03-3.21.97-4.07 2.47-1.73 3-.44 7.45 1.24 9.88.82 1.19 1.8 2.53 3.08 2.48 1.24-.05 1.71-.8 3.21-.8 1.49 0 1.92.8 3.23.77 1.33-.02 2.18-1.21 3-2.41.94-1.38 1.33-2.72 1.35-2.79-.03-.01-2.6-1-2.63-3.96ZM14.6 4.9c.69-.83 1.15-1.99 1.02-3.15-.99.04-2.19.66-2.9 1.49-.64.73-1.2 1.9-1.05 3.02 1.1.09 2.24-.56 2.93-1.36Z" />
    </svg>
  );
}
