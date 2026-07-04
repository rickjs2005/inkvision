import type { StudioRepository } from "../../ports/studio-repository";
import type { UserRepository } from "../../ports/user-repository";
import type { AuditLogger } from "../../ports/audit-logger";

/** Dependências injetadas nos casos de uso de estúdio (composição no app). */
export interface StudioUseCaseDeps {
  studios: StudioRepository;
  users: UserRepository;
  audit: AuditLogger;
}
