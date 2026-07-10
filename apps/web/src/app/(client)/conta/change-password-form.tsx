"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { changePassword } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

/* Mesmo critério de força usado no cadastro (ver auth-ui.tsx: score/STRENGTH). */
function passwordScore(pw: string): 0 | 1 | 2 | 3 | 4 {
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

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  withStrength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  withStrength?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const active = focused || value.length > 0;
  const s = passwordScore(value);

  return (
    <div>
      <div className="relative">
        <Lock
          className={cn(
            "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors",
            focused ? "text-primary" : "text-muted-foreground/70",
          )}
        />
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          required
          minLength={8}
          autoComplete={autoComplete}
          placeholder=" "
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="peer h-14 w-full rounded-md border border-input bg-background/40 px-3.5 pl-10 pr-11 pt-4 text-sm outline-none transition-[border-color,box-shadow,background-color] hover:border-foreground/25 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/12"
        />
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-10 origin-left transition-all",
            active ? "top-2 text-[11px] font-medium text-muted-foreground" : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70",
          )}
        >
          {label}
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

      {withStrength && value.length > 0 && (
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

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (newPassword.length < 8) {
      setFormError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    startTransition(async () => {
      const { error } = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) {
        toast.error("Senha atual incorreta ou dados inválidos.");
        return;
      }
      toast.success("Senha alterada com sucesso.");
      reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <PasswordInput
        id="currentPassword"
        label="Senha atual"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordInput
          id="newPassword"
          label="Nova senha"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          withStrength
        />
        <PasswordInput
          id="confirmPassword"
          label="Confirmar nova senha"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />
      </div>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Alterando…" : "Alterar senha"}
        </Button>
      </div>
    </form>
  );
}
