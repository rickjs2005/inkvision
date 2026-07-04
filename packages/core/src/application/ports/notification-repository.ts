export interface NotificationData {
  userId: string;
  type: string; // ex.: "order.quoted", "order.submitted"
  payload: Record<string, unknown>;
}

export interface Notification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationRepository {
  create(data: NotificationData): Promise<void>;
  createMany(data: NotificationData[]): Promise<void>;
  listForUser(userId: string, opts?: { unreadOnly?: boolean; take?: number }): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markRead(userId: string, ids?: string[]): Promise<void>;
}
