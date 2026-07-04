import type { OrderStatus } from "@inkvision/core";
import { ORDER_STATUS_LABEL } from "@inkvision/core";
import { Badge } from "@/components/ui/badge";

const VARIANT: Record<OrderStatus, "default" | "neutral" | "success" | "warning" | "destructive"> = {
  SUBMITTED: "warning",
  QUOTED: "default",
  DEPOSIT_PENDING: "warning",
  DEPOSIT_PAID: "success",
  IN_DESIGN: "default",
  DESIGN_REVIEW: "warning",
  CHANGES_REQUESTED: "warning",
  DESIGN_APPROVED: "success",
  AWAITING_BODY_PHOTO: "warning",
  SIMULATING: "default",
  SIMULATION_REVIEW: "warning",
  SIMULATION_APPROVED: "success",
  SCHEDULED: "default",
  COMPLETED: "success",
  REVIEWED: "success",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]}>{ORDER_STATUS_LABEL[status]}</Badge>;
}
