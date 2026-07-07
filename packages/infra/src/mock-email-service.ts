import type { EmailMessage, EmailService } from "@inkvision/core";

/**
 * Adapter de e-mail para desenvolvimento. Não envia nada de verdade — só loga
 * no console. Troque por ResendEmailService em prod sem tocar nos casos de uso.
 */
export class MockEmailService implements EmailService {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email:mock] para=${message.to} assunto="${message.subject}"`);
  }
}
