import { Resend } from "resend";
import type { EmailMessage, EmailService } from "@inkvision/core";

/**
 * Envio de e-mail real via Resend. Troque por MockEmailService no dev sem
 * tocar nos casos de uso.
 */
export class ResendEmailService implements EmailService {
  private readonly resend: Resend;
  private readonly from: string;

  constructor(apiKey = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM) {
    if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");
    this.resend = new Resend(apiKey);
    this.from = from ?? "InkVision <onboarding@resend.dev>";
  }

  async send(message: EmailMessage): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (error) throw new Error(`Falha ao enviar e-mail via Resend: ${error.message}`);
  }
}
