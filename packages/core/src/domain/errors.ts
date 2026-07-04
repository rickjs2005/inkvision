/** Erros de domínio. A borda HTTP mapeia cada `code` para um status. */
export type DomainErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHENTICATED"
  | "CONFLICT";

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION", message, details);
  }
}
export class NotFoundError extends DomainError {
  constructor(entity: string) {
    super("NOT_FOUND", `${entity} não encontrado.`);
  }
}
export class ForbiddenError extends DomainError {
  constructor(message = "Você não tem permissão para esta ação.") {
    super("FORBIDDEN", message);
  }
}
export class UnauthenticatedError extends DomainError {
  constructor(message = "Autenticação necessária.") {
    super("UNAUTHENTICATED", message);
  }
}
export class ConflictError extends DomainError {
  constructor(message: string) {
    super("CONFLICT", message);
  }
}

/** Status HTTP por código — usado pela camada de apresentação. */
export const HTTP_STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
};
