import { NextResponse } from "next/server";
import type { PaymentKind } from "@inkvision/core";
import { parseStripeWebhook } from "@inkvision/infra";
import { useCases } from "@/server/container";
import { logError } from "@/lib/logger";

// O corpo cru é necessário para verificar a assinatura — não deixe o Next parsear.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook do Stripe — a ÚNICA fonte confiável de confirmação de pagamento.
 * Verifica a assinatura e confirma o pedido em contexto de sistema (idempotente).
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });

  let event;
  try {
    const rawBody = await req.text();
    event = parseStripeWebhook(rawBody, signature);
  } catch (e) {
    logError(e, { scope: "stripe_webhook", stage: "verify" });
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
      const obj = event.data.object as { metadata?: Record<string, string> | null };
      const md = obj.metadata ?? {};
      const orderId = md.orderId;
      const studioId = md.studioId;
      const kind = md.kind as PaymentKind | undefined;
      if (orderId && studioId && (kind === "DEPOSIT" || kind === "FINAL")) {
        await useCases.confirmPaymentByReference.execute({ orderId, studioId, kind });
      }
    }
    // TODO: checkout.session.completed (mode subscription) → confirmar assinatura.
    return NextResponse.json({ received: true });
  } catch (e) {
    logError(e, { scope: "stripe_webhook", stage: "process", type: event.type });
    // 500 faz o Stripe reenviar (idempotência garante segurança do retry).
    return NextResponse.json({ error: "Falha ao processar" }, { status: 500 });
  }
}
