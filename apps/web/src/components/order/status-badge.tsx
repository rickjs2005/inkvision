import type { OrderStatus } from "@inkvision/core";
import { ORDER_STATUS_LABEL } from "@inkvision/core";
import { Badge } from "@/components/ui/badge";

// Mapa de status → estilo do Badge quadrado, agrupado por fase do fluxo:
//  neutral   — estado de repouso / recém-enviado
//  default   — em andamento no ateliê (vermelhão de atenção)
//  warning   — aguardando uma ação (do cliente ou do estúdio)
//  success   — etapa concluída / aprovada
//  destructive — encerrado sem conclusão
const VARIANT: Record<OrderStatus, "default" | "neutral" | "success" | "warning" | "destructive"> = {
  // Entrada
  SUBMITTED: "neutral",
  QUOTED: "default",
  // Pagamento do sinal
  DEPOSIT_PENDING: "warning",
  DEPOSIT_PAID: "success",
  // Arte
  IN_DESIGN: "default",
  DESIGN_REVIEW: "warning",
  CHANGES_REQUESTED: "warning",
  DESIGN_APPROVED: "success",
  // Simulação
  AWAITING_BODY_PHOTO: "warning",
  SIMULATING: "default",
  SIMULATION_REVIEW: "warning",
  SIMULATION_APPROVED: "success",
  // Sessão
  SCHEDULED: "default",
  COMPLETED: "success",
  REVIEWED: "success",
  // Encerramento
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant={VARIANT[status]} className="uppercase tracking-[0.14em]">
      {ORDER_STATUS_LABEL[status]}
    </Badge>
  );
}
