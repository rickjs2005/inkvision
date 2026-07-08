import Link from "next/link";
import { notFound } from "next/navigation";
import { canTransition, DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { signRoomToken } from "@/server/realtime";
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

  let detail;
  try {
    detail = await useCases.getClientOrderDetail.execute(actor, orderId);
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") notFound();
    throw e;
  }
  const {
    order,
    conversation,
    messages,
    hasMoreMessages,
    latestDesign,
    latestSimulation: latestSim,
    appointment,
    review,
  } = detail;
  const roomToken = await signRoomToken(actor.userId, conversation.id);

  const inFlow = (FLOW_STATUSES as readonly string[]).includes(order.status);
  const canBook = order.status === "SIMULATION_APPROVED" || order.status === "SCHEDULED";
  const slots = detail.slots.map((s) => s.toISOString());
  const canReview = order.status === "COMPLETED" || order.status === "REVIEWED";

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Pedido</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-light leading-[0.95] tracking-[-0.025em] sm:text-5xl">
          <Link href={`/t/${order.artistId}`} className="ink-link">
            {order.artistName}
          </Link>
        </h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-12">
          <section className="border-t border-border pt-6">
            <p className="eyebrow mb-4">Briefing</p>
            <div className="flex flex-col gap-3 text-sm">
              <p>
                <span className="text-muted-foreground">Parte do corpo:</span> {order.bodyPart}
              </p>
              {order.approxSizeCm && (
                <p>
                  <span className="text-muted-foreground">Tamanho:</span> ~{order.approxSizeCm} cm
                </p>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{order.briefing}</p>
              {order.references.length > 0 && (
                <div>
                  <p className="mb-2 text-muted-foreground">Referências:</p>
                  <div className="flex flex-wrap gap-3">
                    {order.references.map((r) => (
                      <a
                        key={r.id}
                        href={r.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ink-link text-sm text-foreground"
                      >
                        anexo
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {order.quoteAmountCents != null && (
            <section className="border-t border-border pt-6">
              <p className="eyebrow mb-4">Orçamento</p>
              <p className="font-mono text-4xl font-light tracking-tight text-foreground">
                R$ {(order.quoteAmountCents / 100).toFixed(2)}
              </p>
              {order.depositCents != null && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Sinal para iniciar:{" "}
                  <span className="font-mono text-foreground">
                    R$ {(order.depositCents / 100).toFixed(2)}
                  </span>
                </p>
              )}
            </section>
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
            <section className="border-t border-border pt-6">
              <p className="eyebrow mb-4">Agendamento</p>
              <BookingSection
                orderId={order.id}
                status={order.status as "SIMULATION_APPROVED" | "SCHEDULED"}
                slots={slots}
                appointmentStartsAt={appointment ? appointment.startsAt.toISOString() : null}
              />
            </section>
          )}

          {canReview && (
            <section className="border-t border-border pt-6">
              <p className="eyebrow mb-4">Avaliação</p>
              <ReviewSection
                orderId={order.id}
                existing={review ? { rating: review.rating, comment: review.comment } : null}
              />
            </section>
          )}

          {inFlow && (
            <section className="border-t border-border pt-6">
              <p className="eyebrow mb-4">Arte & simulação</p>
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
                        errorMessage: latestSim.errorMessage,
                        variants: latestSim.variants,
                      }
                    : null
                }
              />
            </section>
          )}

          <section className="border-t border-border pt-6">
            <p className="eyebrow mb-4">Conversa com {order.artistName}</p>
            <ClientChat
              orderId={order.id}
              studioId={order.studioId}
              currentUserId={actor.userId}
              roomToken={roomToken}
              initialMessages={messages}
              initialHasMore={hasMoreMessages}
            />
          </section>
        </div>

        <aside className="h-fit border-t border-border pt-6">
          <p className="eyebrow mb-4">Histórico</p>
          <OrderTimeline events={order.events} />
        </aside>
      </div>
    </div>
  );
}
