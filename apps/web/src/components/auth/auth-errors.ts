/**
 * Traduz erros do better-auth (código/status HTTP) pra mensagens em pt-BR.
 * Usado nas páginas de login, cadastro e recuperação de senha pra nunca
 * mostrar "User already exists" / "Too many requests" cru na UI.
 */
export interface AuthErrorLike {
  code?: string | null;
  status?: number;
  message?: string | null;
}

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha inválidos.",
  USER_ALREADY_EXISTS: "Esse e-mail já está cadastrado. Tente entrar ou use outro e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Esse e-mail já está cadastrado. Tente entrar ou use outro e-mail.",
  INVALID_EMAIL: "Digite um e-mail válido.",
  INVALID_PASSWORD: "Senha inválida.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "Senha muito longa.",
  INVALID_TOKEN: "Link inválido ou expirado. Peça um novo.",
  TOKEN_EXPIRED: "Link expirado. Peça um novo.",
  RESET_PASSWORD_DISABLED: "Redefinição de senha indisponível no momento.",
};

const RATE_LIMIT_MESSAGE = "Muitas tentativas. Aguarde um minuto e tente de novo.";
const SERVER_ERROR_MESSAGE = "Erro no servidor. Tente novamente em instantes.";

/**
 * `fallback` cobre tudo que não reconhecemos (erro de rede, código novo do
 * better-auth, etc.) — cada chamador escolhe uma mensagem genérica adequada
 * ao contexto (login, cadastro, recuperação de senha...).
 */
export function mapAuthError(error: AuthErrorLike | null | undefined, fallback: string): string {
  if (!error) return fallback;
  if (error.status === 429) return RATE_LIMIT_MESSAGE;
  const mapped = error.code ? MESSAGES[error.code] : undefined;
  if (mapped) return mapped;
  if (error.status === 401) return MESSAGES.INVALID_EMAIL_OR_PASSWORD ?? fallback;
  if (typeof error.status === "number" && error.status >= 500) return SERVER_ERROR_MESSAGE;
  return fallback;
}
