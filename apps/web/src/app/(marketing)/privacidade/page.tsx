import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a InkVision trata seus dados pessoais, incluindo fotos processadas por IA.",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Legal</span>
      </div>
      <h1 className="mt-5 font-display text-4xl font-light leading-[0.95] tracking-[-0.025em] sm:text-5xl">
        Política de Privacidade
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">Última atualização: 8 de julho de 2026.</p>

      <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-foreground/90">
        <p>
          Esta política explica quais dados a InkVision coleta, para quê, com quem compartilha e
          quais direitos você tem sobre eles, em conformidade com a Lei Geral de Proteção de Dados
          (LGPD).
        </p>

        <section>
          <h2 className="font-display text-xl font-normal">
            1. Fotos do corpo e a simulação por IA — leia isto primeiro
          </h2>
          <p className="mt-2">
            Para gerar a prévia de uma tatuagem, você pode enviar uma foto de uma parte do seu corpo.
            Essa foto pode ser considerada <strong>dado pessoal sensível</strong> pela LGPD (pode
            revelar, por exemplo, condições de pele ou cicatrizes). Ao enviar uma foto real (não uma
            pele sintética de demonstração), você concorda que:
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              a foto é enviada a um provedor de inteligência artificial de terceiro (atualmente,{" "}
              <a href="https://fal.ai" target="_blank" rel="noreferrer" className="ink-link">
                Fal.ai
              </a>
              ) para gerar a imagem da simulação;
            </li>
            <li>essa foto é usada exclusivamente para gerar a prévia solicitada por você;</li>
            <li>
              no simulador público (sem login), a foto não é vinculada a uma conta ou pedido — mas
              ainda assim trafega até o provedor de IA para o processamento;
            </li>
            <li>
              dentro de um pedido (com login), a foto fica associada ao seu pedido e pode ser vista
              pelo estúdio/tatuador responsável, para dar continuidade ao serviço.
            </li>
          </ul>
          <p className="mt-2">
            Se você não concorda com o envio a um provedor de IA de terceiro, use as peles sintéticas
            de demonstração no simulador público em vez de enviar sua própria foto.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">2. Outros dados que coletamos</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>Cadastro: nome, e-mail, telefone (opcional), senha (com hash).</li>
            <li>Uso da plataforma: pedidos, mensagens de chat, avaliações, favoritos.</li>
            <li>Pagamento: processado pelo Stripe — não armazenamos número de cartão.</li>
            <li>Técnicos: endereço IP e identificadores de sessão, para segurança e limite de uso.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">3. Com quem compartilhamos</h2>
          <p className="mt-2">Compartilhamos dados apenas com prestadores que operam a plataforma:</p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              <strong>Fal.ai</strong> — processamento de imagem por IA (fotos enviadas para
              simulação).
            </li>
            <li>
              <strong>Stripe</strong> — processamento de pagamentos.
            </li>
            <li>
              <strong>Cloudflare (R2)</strong> — armazenamento de fotos, artes e anexos.
            </li>
            <li>
              <strong>Resend</strong> — envio de e-mails transacionais (orçamento, agendamento,
              lembretes).
            </li>
            <li>
              <strong>Google</strong> — se você entrar com "Continuar com Google", recebemos seu
              nome, e-mail e foto de perfil do Google para criar sua conta.
            </li>
            <li>O estúdio/tatuador com quem você tem um pedido em andamento.</li>
          </ul>
          <p className="mt-2">Não vendemos dados pessoais a terceiros.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">4. Cookies</h2>
          <p className="mt-2">
            Usamos cookies essenciais para manter sua sessão autenticada (login) e para limitar
            abuso (rate limiting). Não usamos cookies de rastreamento publicitário de terceiros.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">5. Retenção</h2>
          <p className="mt-2">
            Mantemos seus dados enquanto sua conta estiver ativa. Ao solicitar a exclusão da conta
            (veja abaixo), anonimizamos seus dados de cadastro e apagamos as fotos, artes e anexos
            associados a você do armazenamento — não apenas o vínculo no banco de dados.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">6. Seus direitos</h2>
          <p className="mt-2">
            Em{" "}
            <a href="/conta" className="ink-link">
              Minha conta
            </a>
            , você pode a qualquer momento:
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
            <li>
              <strong>Exportar</strong> uma cópia dos seus dados (pedidos, avaliações, mensagens,
              referências e simulações).
            </li>
            <li>
              <strong>Excluir</strong> sua conta — anonimiza seu cadastro, remove sessões e
              notificações, e apaga do armazenamento as fotos/artes vinculadas a você.
            </li>
          </ul>
          <p className="mt-2">
            Pedidos e avaliações associados a estúdios permanecem, sem identificação pessoal, para
            preservar o histórico de integridade do estúdio.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">7. Contato</h2>
          <p className="mt-2">Dúvidas sobre privacidade: contato@inkvision.app.</p>
        </section>
      </div>
    </div>
  );
}
