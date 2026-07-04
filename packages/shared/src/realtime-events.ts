/** Contrato único de eventos WebSocket, compartilhado por web e realtime. */
export const RT = {
  // chat
  MESSAGE_NEW: "message:new",
  MESSAGE_READ: "message:read",
  TYPING: "conversation:typing",
  // pedidos
  ORDER_UPDATED: "order:updated",
  // simulação IA
  SIMULATION_PROGRESS: "simulation:progress",
  SIMULATION_DONE: "simulation:done",
  SIMULATION_FAILED: "simulation:failed",
  // notificações
  NOTIFICATION_NEW: "notification:new",
} as const;

export type RealtimeEvent = (typeof RT)[keyof typeof RT];

/** Nome da sala por conversa. Isola tráfego de chat por pedido. */
export const conversationRoom = (conversationId: string) => `conv:${conversationId}`;
/** Sala por usuário para notificações direcionadas. */
export const userRoom = (userId: string) => `user:${userId}`;
/** Sala por tenant para broadcasts do estúdio. */
export const studioRoom = (studioId: string) => `studio:${studioId}`;
