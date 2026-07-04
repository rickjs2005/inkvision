export interface AuditEntry {
  studioId?: string | null;
  userId?: string | null;
  action: string; // ex.: "studio.created", "studio.suspended"
  entity: string; // ex.: "Studio"
  entityId: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

export interface AuditLogger {
  log(entry: AuditEntry): Promise<void>;
}
