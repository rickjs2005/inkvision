import Link from "next/link";
import { notFound } from "next/navigation";
import { canTransition, DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { repositories, useCases } from "@/server/container";
import { signRoomToken } from "@/server/realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/order/status-badge";
import { OrderTimeline } from "@/components/order/order-timeline";
import { ClientChat } from "@/components/chat/client-chat";
import { ClientSimulationSection } from "@/components/simulation/client-simulation-section";
import { BookingSection } from "@/components/schedule/booking-section";
import { ReviewSection } from "@/components/review/review-section";
import { OrderClientActions } from "./client-actions";
import { PayButton } from "./pay-button";

const FLOW_STATUSES = [
  "DESIGN_REVIEW",
  "DESIGN_APPROVED",
  "AWAITING_BODY_PHOTO",
  "SIMULATING",
  "SIMULATION_REVIEW",
  "SIMULATION_APPROVED",
] as const;

export default async function ClientOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const actor = await requireActor();

  let conv;
  try {
    conv = await useCases.openClientConversation.execute(actor, orderId);
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
  const { order, conversation, messages } = conv;
  const roomToken = await signRoomToken(actor.userId, conversation.id);

  const inFlow = (FLOW_STATUSES as readonly string[]).includes(order.status);
  const [latestDesign, latestSim] = inFlow
    ? await Promise.all([
        repositories.designs.getLatest(order.id),
        repositories.simulations.getLatestForOrder(order.id),
      ])
    : [null, null];

  const canBook = order.status === "SIMULATION_APPROVED" || order.status === "SCHEDULED";
  const slots = canBook
    ? (await useCases.getOrderSlots.execute(actor, order.id)).map((s) => s.startsAt.toISOString())
    : [];
  const appointment =
    order.status === "SCHEDULED"
      ? await repositories.schedule.getAppointmentForOrder(order.studioId, order.id)
      : null;
  const canReview = order.status === "COMPLETED" || order.status === "REVIEWED";
  const review = canReview
    ? await repositories.reviews.getForOrder(order.studioId, order.id)
    : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Pedido</p>
          <h1 className="text-2xl font-bold">
            <Link href={`/t/${order.artistId}`} className="hover:underline">
              {order.artistName}
            </Link>
          </h1>
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
              <p><span className="text-muted-foreground">Parte do corpo:</span> {order.bodyPart}</p>
              {order.approxSizeCm && (
                <p><span className="text-muted-foreground">Tamanho:</span> ~{order.approxSizeCm} cm</p>
              )}
              <p className="whitespace-pre-wrap">{order.briefing}</p>
              {order.references.length > 0 && (
                <div>
                  <p className="mb-2 text-muted-foreground">Referências:</p>
                  <div className="flex flex-wrap gap-2">
                    {order.references.map((r) => (
                      <a
                        key={r.id}
                        href={r.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        anexo
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {order.quoteAmountCents != null && (
            <Card>
              <CardHeader>
                <CardTitle>Orçamento</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <p className="text-2xl font-bold">R$ {(order.quoteAmountCents / 100).toFixed(2)}</p>
                {order.depositCents != null && (
                  <p className="text-muted-foreground">
                    Sinal para iniciar: R$ {(order.depositCents / 100).toFixed(2)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <OrderClientActions
            orderId={order.id}
            canAccept={order.status === "QUOTED"}
            canCancel={canTransition(order.status, "CANCELLED")}
          />

          {order.status === "DEPOSIT_PENDING" && (
            <PayButton orderId={order.id} kind="DEPOSIT" label="Pagar sinal" />
          )}
          {order.status === "SCHEDULED" && (
            <PayButton orderId={order.id} kind="FINAL" label="Pagar valor final" />
          )}

          {canBook && (
            <Card>
              <CardHeader>
                <CardTitle>Agendamento</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingSection
                  orderId={order.id}
                  status={order.status as "SIMULATION_APPROVED" | "SCHEDULED"}
                  slots={slots}
                  appointmentStartsAt={appointment ? appointment.startsAt.toISOString() : null}
                />
              </CardContent>
            </Card>
          )}

          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>Avaliação</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewSection
                  orderId={order.id}
                  existing={review ? { rating: review.rating, comment: review.comment } : null}
                />
              </CardContent>
            </Card>
          )}

          {inFlow && (
            <Card>
              <CardHeader>
                <CardTitle>Arte & simulação</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientSimulationSection
                  orderId={order.id}
                  studioId={order.studioId}
                  status={order.status}
                  roomToken={roomToken}
                  design={latestDesign ? { imageUrl: latestDesign.imageUrl, feedback: latestDesign.feedback } : null}
                  simulation={
                    latestSim
                      ? {
                          bodyPhotoUrl: latestSim.bodyPhotoUrl,
                          designUrl: latestSim.designUrl,
                          placement: latestSim.placement,
                          status: latestSim.status,
                        }
                      : null
                  }
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Conversa com {order.artistName}</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientChat
                orderId={order.id}
                studioId={order.studioId}
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
