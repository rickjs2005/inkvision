import { notFound } from "next/navigation";
import { canTransition, DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { repositories, useCases } from "@/server/container";
import { signRoomToken } from "@/server/realtime";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/order/status-badge";
import { OrderTimeline } from "@/components/order/order-timeline";
import { StudioChat } from "@/components/chat/studio-chat";
import { QuoteForm } from "./quote-form";
import { SendDesignPanel } from "./send-design-panel";

const DESIGNABLE = ["DEPOSIT_PAID", "IN_DESIGN", "DESIGN_REVIEW", "CHANGES_REQUESTED"];

export default async function ArtistOrderDetailPage({
  params,
}: {
  params: Promise<{ artistId: string; orderId: string }>;
}) {
  const { artistId, orderId } = await params;
  const actor = await requireActor();

  let artist;
  try {
    artist = await useCases.getArtist.execute(artistId, actor);
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") notFound();
    throw e;
  }

  let conv;
  try {
    conv = await useCases.openStudioConversation.execute(actor, artist.studioId, orderId);
  } catch (e) {
    if (e instanceof DomainError) notFound();
    throw e;
  }
  const { order, conversation, messages } = conv;
  const roomToken = await signRoomToken(actor.userId, conversation.id);
  const canQuote = canTransition(order.status, "QUOTED");
  const canDesign = DESIGNABLE.includes(order.status);
  const latestDesign = canDesign ? await repositories.designs.getLatest(order.id) : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Cabeçalho editorial — cliente / peça / status */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Pedido · {order.clientName}</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-light leading-[0.95] tracking-[-0.025em] sm:text-5xl">
          {order.bodyPart}
        </h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-10 grid gap-x-12 gap-y-12 md:grid-cols-[1.7fr_1fr]">
        <div className="flex flex-col">
          <section>
            <span className="eyebrow">Briefing</span>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {order.briefing}
            </p>
            {order.references.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                {order.references.map((r, i) => (
                  <a
                    key={r.id}
                    href={r.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ink-link font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
                  >
                    ref {String(i + 1).padStart(2, "0")}
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10 border-t border-border pt-8">
            <span className="eyebrow">
              {order.quoteAmountCents != null ? "Revisar orçamento" : "Enviar orçamento"}
            </span>
            <div className="mt-4">
              {canQuote ? (
                <QuoteForm
                  studioId={artist.studioId}
                  orderId={order.id}
                  artistId={artistId}
                  defaultQuote={order.quoteAmountCents ? order.quoteAmountCents / 100 : undefined}
                  defaultDeposit={order.depositCents ? order.depositCents / 100 : undefined}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  O orçamento não pode ser alterado neste estágio do pedido.
                </p>
              )}
            </div>
          </section>

          {canDesign && (
            <section className="mt-10 border-t border-border pt-8">
              <span className="eyebrow">Arte</span>
              <div className="mt-4 flex flex-col gap-4">
                {latestDesign && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                        v{String(latestDesign.version).padStart(2, "0")}
                      </span>
                      <Badge variant={latestDesign.status === "CHANGES_REQUESTED" ? "warning" : "neutral"}>
                        {latestDesign.status === "APPROVED"
                          ? "Aprovada"
                          : latestDesign.status === "CHANGES_REQUESTED"
                            ? "Ajustes pedidos"
                            : "Aguardando"}
                      </Badge>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={latestDesign.imageUrl}
                      alt="Arte"
                      className="max-w-xs rounded-md border border-border shadow-[var(--shadow-ink)]"
                    />
                    {latestDesign.feedback && (
                      <p className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
                        “{latestDesign.feedback}”
                      </p>
                    )}
                  </div>
                )}
                {order.status !== "DESIGN_REVIEW" && (
                  <SendDesignPanel studioId={artist.studioId} orderId={order.id} artistId={artistId} />
                )}
                {order.status === "DESIGN_REVIEW" && (
                  <p className="text-sm text-muted-foreground">Aguardando o cliente aprovar a arte.</p>
                )}
              </div>
            </section>
          )}

          <section className="mt-10 border-t border-border pt-8">
            <span className="eyebrow">Conversa com {order.clientName}</span>
            <div className="mt-4">
              <StudioChat
                orderId={order.id}
                studioId={artist.studioId}
                currentUserId={actor.userId}
                roomToken={roomToken}
                initialMessages={messages}
              />
            </div>
          </section>
        </div>

        <aside className="h-fit md:border-l md:border-border md:pl-10">
          <span className="eyebrow">Histórico</span>
          <div className="mt-4">
            <OrderTimeline events={order.events} />
          </div>
        </aside>
      </div>
    </div>
  );
}
