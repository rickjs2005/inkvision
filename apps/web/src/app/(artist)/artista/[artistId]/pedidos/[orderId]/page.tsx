import Link from "next/link";
import { notFound } from "next/navigation";
import { canTransition, DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { repositories, useCases } from "@/server/container";
import { signRoomToken } from "@/server/realtime";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/order/status-badge";
import { NextStepHint } from "@/components/order/next-step-hint";
import { OrderTimeline } from "@/components/order/order-timeline";
import { StudioChat } from "@/components/chat/studio-chat";
import { WhatsAppLink } from "@/lib/whatsapp";
import { formatBRL } from "@/lib/format-currency";
import { QuoteForm } from "./quote-form";
import { SendDesignPanel } from "./send-design-panel";
import { SessionDoneButton } from "./session-done-button";

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
  const { order, conversation, messages, hasMoreMessages } = conv;
  const canQuote = canTransition(order.status, "QUOTED");
  const canDesign = DESIGNABLE.includes(order.status);
  const [roomToken, studio, latestDesign, availability] = await Promise.all([
    signRoomToken(actor.userId, conversation.id),
    repositories.studios.findById(artist.studioId),
    canDesign ? repositories.designs.getLatest(order.id) : null,
    // O cliente só consegue agendar se houver horários publicados — sem eles,
    // o passo trava em silêncio do lado de lá; aqui avisamos quem pode resolver.
    order.status === "SIMULATION_APPROVED" ? useCases.getAvailability.execute(actor, artistId) : null,
  ]);
  const missingAgenda = availability !== null && availability.length === 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href={`/artista/${artistId}/pedidos`}
        className="ink-link mb-6 inline-block font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
      >
        ← Pedidos
      </Link>

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
      {studio?.phone && (
        <WhatsAppLink
          phone={studio.phone}
          label="Falar com o cliente no WhatsApp"
          className="mt-3 inline-block text-sm"
        />
      )}
      <NextStepHint status={order.status} perspective="artist" />
      {missingAgenda && (
        <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Você ainda não publicou horários de atendimento — sem eles, o cliente não consegue
          agendar a sessão.{" "}
          <Link href={`/artista/${artistId}/agenda`} className="ink-link font-medium">
            Publicar agenda
          </Link>
        </div>
      )}

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

          {/* Sem orçamento possível nem valor definido, a seção não diz nada — some. */}
          {(canQuote || order.quoteAmountCents != null) && (
            <section className="mt-10 border-t border-border pt-8">
              <span className="eyebrow">
                {canQuote
                  ? order.quoteAmountCents != null
                    ? "Revisar orçamento"
                    : "Enviar orçamento"
                  : "Orçamento"}
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
                  <div className="flex flex-col gap-1">
                    <p className="font-mono text-3xl font-light tracking-tight">
                      {formatBRL(order.quoteAmountCents!)}
                    </p>
                    {order.depositCents != null && (
                      <p className="text-sm text-muted-foreground">
                        Sinal: <span className="font-mono text-foreground">{formatBRL(order.depositCents)}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {order.status === "SCHEDULED" && (
            <section className="mt-10 border-t border-border pt-8">
              <span className="eyebrow">Sessão</span>
              <div className="mt-4">
                <SessionDoneButton studioId={artist.studioId} orderId={order.id} artistId={artistId} />
              </div>
            </section>
          )}

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
                studioPhone={studio?.phone}
                initialMessages={messages}
                initialHasMore={hasMoreMessages}
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
