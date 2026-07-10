import { Compass } from "lucide-react";
import type { OrderStatus } from "@inkvision/core";

/**
 * "O que acontece agora" — uma frase por status, na perspectiva de quem olha.
 * Sem isto, vários status deixavam a tela muda: o cliente não sabia que estava
 * esperando o tatuador (e vice-versa), e cada lado culpava o próprio passo.
 * Status cuja seção da página já orienta (ex.: fase de simulação no cliente)
 * ficam de fora para não duplicar a mensagem.
 */
const CLIENT_HINT: Partial<Record<OrderStatus, string>> = {
  SUBMITTED:
    "Pedido enviado — o tatuador vai revisar o briefing e mandar o orçamento. Você será avisado aqui e nas notificações.",
  QUOTED: "Orçamento recebido — revise os valores abaixo e aceite para dar o próximo passo.",
  DEPOSIT_PENDING: "Orçamento aceito — pague o sinal para o tatuador começar a arte.",
  DEPOSIT_PAID: "Sinal confirmado — o tatuador vai começar a desenhar sua arte.",
  IN_DESIGN:
    "O tatuador está desenhando sua arte. Você será avisado quando a primeira versão chegar.",
  CHANGES_REQUESTED: "O tatuador está ajustando a arte com base no seu feedback.",
  SCHEDULED: "Sessão agendada — qualquer imprevisto, combine pelo chat.",
  SESSION_DONE: "Sessão realizada — pague o valor final para concluir o pedido.",
  COMPLETED: "Tudo pronto — conte como foi: sua avaliação ajuda o tatuador.",
};

const ARTIST_HINT: Partial<Record<OrderStatus, string>> = {
  SUBMITTED: "Novo pedido — revise o briefing e envie o orçamento abaixo.",
  QUOTED: "Orçamento enviado — aguardando o cliente aceitar.",
  DEPOSIT_PENDING: "O cliente aceitou — aguardando o pagamento do sinal para começar a arte.",
  DEPOSIT_PAID: "Sinal pago — comece a arte e envie a primeira versão abaixo.",
  IN_DESIGN: "Envie a arte quando estiver pronta — o cliente será avisado na hora.",
  DESIGN_REVIEW: "Aguardando o cliente aprovar a arte.",
  CHANGES_REQUESTED: "O cliente pediu ajustes — veja o feedback e envie a nova versão.",
  DESIGN_APPROVED:
    "Arte aprovada — aguardando o cliente enviar a foto do corpo para a simulação.",
  AWAITING_BODY_PHOTO:
    "Aguardando o cliente enviar a foto do corpo para posicionar e simular a arte.",
  SIMULATING: "A IA está gerando a simulação para o cliente — nada a fazer por enquanto.",
  SIMULATION_REVIEW: "Aguardando o cliente aprovar a simulação.",
  SIMULATION_APPROVED:
    "Simulação aprovada — o cliente vai escolher um horário da sua agenda para a sessão.",
  SCHEDULED: "Sessão agendada — depois de atender, marque como realizada abaixo.",
  SESSION_DONE: "Sessão realizada — aguardando o pagamento final do cliente.",
  COMPLETED: "Pedido concluído — aguardando a avaliação do cliente.",
  REVIEWED: "Pedido finalizado e avaliado. Nada a fazer.",
};

export function NextStepHint({
  status,
  perspective,
}: {
  status: OrderStatus;
  perspective: "client" | "artist";
}) {
  const hint = (perspective === "client" ? CLIENT_HINT : ARTIST_HINT)[status];
  if (!hint) return null;

  return (
    <div className="mt-6 flex items-start gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
      <Compass aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
      <p className="text-sm leading-relaxed text-foreground/90">{hint}</p>
    </div>
  );
}
