import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Monta o link `wa.me` a partir do telefone livre cadastrado no estúdio
 * (pode ter parênteses/espaços/traços, com ou sem código do país).
 * Retorna `null` para números claramente inválidos/vazios.
 */
export function waLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  // Sem código do país (ex.: "11987654321", 11 dígitos) — assume Brasil.
  // Com 12-13 dígitos, assume que o código do país já está incluído.
  const withCountryCode = digits.length < 12 ? `55${digits}` : digits;
  return `https://wa.me/${withCountryCode}`;
}

/** Link discreto para WhatsApp — não renderiza nada se o telefone for inválido. */
export function WhatsAppLink({
  phone,
  label,
  className,
}: {
  phone: string;
  label: string;
  className?: string;
}) {
  const link = waLink(phone);
  if (!link) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className={cn("ink-link inline-flex items-center gap-1.5 text-foreground", className)}
    >
      <MessageCircle className="size-3.5" />
      {label}
    </a>
  );
}
