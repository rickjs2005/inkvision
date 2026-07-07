import type { EmailMessage } from "../ports/email-service";

const BRAND = "#8b1e2e"; // Vermilion (Ateliê de Tinta)

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);

// Escapa os 5 caracteres HTML-sensíveis. Necessário porque clientName/artistName vêm de
// User.name (definido pelo próprio usuário no cadastro, sem sanitização de HTML) e são
// interpolados direto em templates de e-mail — sem isto, um nome malicioso vira XSS
// armazenado no inbox de outro usuário.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// `startsAt` vem de uma coluna sem fuso — o valor já é o horário local desejado,
// então formatamos em UTC para não deslocar (ver migration 1_appointment_no_overlap).
const dateTime = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" }).format(d);

function layout(title: string, bodyHtml: string, ctaUrl: string, ctaLabel: string): string {
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:0;background:#f5f3f0;font-family:Georgia,serif;color:#1a1a1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:32px 24px;">
<tr><td>
  <p style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND};margin:0 0 24px;">Ateliê de Tinta · InkVision</p>
  <h1 style="font-size:22px;margin:0 0 16px;">${title}</h1>
  <div style="font-size:15px;line-height:1.6;color:#333;">${bodyHtml}</div>
  <p style="margin:28px 0;">
    <a href="${ctaUrl}" style="background:${BRAND};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;display:inline-block;">${ctaLabel}</a>
  </p>
</td></tr>
</table>
</body></html>`;
}

export function quoteReadyEmail(data: {
  to: string;
  clientName: string;
  quoteAmountCents: number;
  currency: string;
  orderUrl: string;
}): EmailMessage {
  const subject = "Seu orçamento chegou";
  const body = `<p>Olá, ${escapeHtml(data.clientName)}!</p><p>O orçamento da sua tatuagem ficou pronto: <strong>${money(data.quoteAmountCents, data.currency)}</strong>.</p><p>Acesse o pedido para revisar e confirmar.</p>`;
  return { to: data.to, subject, html: layout(subject, body, data.orderUrl, "Ver orçamento") };
}

export function sessionScheduledEmail(data: {
  to: string;
  clientName: string;
  artistName?: string;
  startsAt: Date;
  orderUrl: string;
}): EmailMessage {
  const subject = "Sessão agendada";
  const body = `<p>Olá, ${escapeHtml(data.clientName)}!</p><p>Sua sessão${data.artistName ? ` com ${escapeHtml(data.artistName)}` : ""} foi agendada para <strong>${dateTime(data.startsAt)}</strong>.</p>`;
  return { to: data.to, subject, html: layout(subject, body, data.orderUrl, "Ver pedido") };
}

export function sessionRescheduledEmail(data: {
  to: string;
  clientName: string;
  artistName?: string;
  startsAt: Date;
  orderUrl: string;
}): EmailMessage {
  const subject = "Sessão reagendada";
  const body = `<p>Olá, ${escapeHtml(data.clientName)}!</p><p>Sua sessão${data.artistName ? ` com ${escapeHtml(data.artistName)}` : ""} foi remarcada para <strong>${dateTime(data.startsAt)}</strong>.</p>`;
  return { to: data.to, subject, html: layout(subject, body, data.orderUrl, "Ver pedido") };
}

export function sessionReminderEmail(data: {
  to: string;
  clientName: string;
  artistName?: string;
  startsAt: Date;
  orderUrl: string;
}): EmailMessage {
  const subject = "Sua sessão é amanhã";
  const body = `<p>Olá, ${escapeHtml(data.clientName)}!</p><p>Passando para lembrar: sua sessão${data.artistName ? ` com ${escapeHtml(data.artistName)}` : ""} é em <strong>${dateTime(data.startsAt)}</strong>.</p>`;
  return { to: data.to, subject, html: layout(subject, body, data.orderUrl, "Ver pedido") };
}
