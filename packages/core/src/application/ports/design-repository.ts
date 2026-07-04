export type DesignStatus = "PENDING" | "APPROVED" | "CHANGES_REQUESTED";

export interface DesignVersion {
  id: string;
  orderId: string;
  version: number;
  imageUrl: string;
  notes: string | null;
  status: DesignStatus;
  feedback: string | null;
  createdAt: Date;
}

/** DesignVersion pertence ao pedido (sem studioId; acesso autorizado via pedido). */
export interface DesignRepository {
  create(orderId: string, imageUrl: string, notes: string | null): Promise<DesignVersion>;
  getLatest(orderId: string): Promise<DesignVersion | null>;
  getLatestApproved(orderId: string): Promise<DesignVersion | null>;
  listForOrder(orderId: string): Promise<DesignVersion[]>;
  setStatus(id: string, status: DesignStatus, feedback: string | null): Promise<DesignVersion>;
}
