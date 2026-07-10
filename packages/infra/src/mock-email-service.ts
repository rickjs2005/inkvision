import type { EmailMessage, EmailService } from "@inkvision/core";

/**
 * Adapter de e-mail para desenvolvimento. Não envia nada de verdade — só loga
 * no console. Troque por ResendEmailService em prod sem tocar nos casos de uso.
 */
export class MockEmailService implements EmailService {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email:mock] para=${message.to} assunto="${message.subject}"`);

    // Sem RESEND_API_KEY (dev/staging) este é o único jeito de acessar o
    // conteúdo do e-mail — sem logar o corpo/link, fluxos como "esqueci minha
    // senha" ficam silenciosamente impossíveis de completar. Só nesse mock.
    const urls = message.html.match(/https?:\/\/[^\s"'<>]+/g);
    if (urls?.length) {
      for (const url of urls) {
        console.log("[MockEmailService] link:", url);
      }
    } else {
      console.log(`[email:mock] corpo:\n${message.text ?? message.html}`);
    }
  }
}
