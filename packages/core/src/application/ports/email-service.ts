export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  /** Alternativa em texto puro. Opcional — provedores geram um fallback razoável sem ela. */
  text?: string;
}

/**
 * Abstração de envio de e-mail transacional. Provedor concreto (Resend em
 * produção, mock no dev/CI) é injetado — trocar não afeta os casos de uso.
 */
export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}
