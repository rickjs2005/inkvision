import { notFound } from "next/navigation";
import { canTransition, DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { repositories, useCases } from "@/server/container";
import { signRoomToken } from "@/server/realtime";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Pedido de {order.clientName}</p>
          <h1 className="text-2xl font-bold">{order.bodyPart}</h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Briefing</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <p className="whitespace-pre-wrap">{order.briefing}</p>
              {order.references.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {order.references.map((r) => (
                    <a key={r.id} href={r.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                      referência
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{order.quoteAmountCents != null ? "Revisar orçamento" : "Enviar orçamento"}</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {canDesign && (
            <Card>
              <CardHeader>
                <CardTitle>Arte</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {latestDesign && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Última versão (v{latestDesign.version}):</span>
                      <Badge variant={latestDesign.status === "CHANGES_REQUESTED" ? "warning" : "neutral"}>
                        {latestDesign.status === "APPROVED"
                          ? "Aprovada"
                          : latestDesign.status === "CHANGES_REQUESTED"
                            ? "Ajustes pedidos"
                            : "Aguardando"}
                      </Badge>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={latestDesign.imageUrl} alt="Arte" className="max-w-xs rounded-lg border border-border" />
                    {latestDesign.feedback && (
                      <p className="text-sm text-muted-foreground">Feedback: “{latestDesign.feedback}”</p>
                    )}
                  </div>
                )}
                {order.status !== "DESIGN_REVIEW" && (
                  <SendDesignPanel studioId={artist.studioId} orderId={order.id} artistId={artistId} />
                )}
                {order.status === "DESIGN_REVIEW" && (
                  <p className="text-sm text-muted-foreground">Aguardando o cliente aprovar a arte.</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Conversa com {order.clientName}</CardTitle>
            </CardHeader>
            <CardContent>
              <StudioChat
                orderId={order.id}
                studioId={artist.studioId}
                currentUserId={actor.userId}
                roomToken={roomToken}
                initialMessages={messages}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline events={order.events} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
