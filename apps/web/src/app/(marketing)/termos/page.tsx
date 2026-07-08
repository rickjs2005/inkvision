import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso da InkVision.",
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Legal</span>
      </div>
      <h1 className="mt-5 font-display text-4xl font-light leading-[0.95] tracking-[-0.025em] sm:text-5xl">
        Termos de Uso
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">Última atualização: 8 de julho de 2026.</p>

      <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-foreground/90">
        <p>
          Estes Termos regem o uso da InkVision — plataforma que conecta clientes a estúdios e
          tatuadores para descoberta, orçamento, chat, simulação de tatuagem por inteligência
          artificial, agendamento e pagamento. Ao criar uma conta ou usar o simulador público, você
          concorda com estes Termos e com a nossa{" "}
          <a href="/privacidade" className="ink-link">
            Política de Privacidade
          </a>
          .
        </p>

        <section>
          <h2 className="font-display text-xl font-normal">1. O que a InkVision é e não é</h2>
          <p className="mt-2">
            A InkVision é um intermediário tecnológico. Estúdios e tatuadores são profissionais
            independentes, responsáveis pela qualidade, segurança e execução do serviço de tatuagem.
            A InkVision não realiza tatuagens e não é parte no contrato de prestação de serviço entre
            você e o estúdio.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">2. A simulação por IA é ilustrativa</h2>
          <p className="mt-2">
            A prévia gerada por inteligência artificial — tanto no simulador público quanto dentro de
            um pedido — é uma <strong>aproximação visual</strong>, não uma garantia do resultado final
            na pele. Fatores como técnica do tatuador, cicatrização, tom de pele e textura real não
            são totalmente reproduzidos pela simulação. A decisão de tatuar é sua; use a simulação
            como referência, não como promessa de resultado.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">3. Conteúdo enviado por você</h2>
          <p className="mt-2">
            Você é responsável pelas fotos, mensagens e arquivos que envia. Não envie conteúdo que
            viole direitos de terceiros, contenha nudez não relacionada à tatuagem, ou envolva
            menores de idade. Fotos do corpo enviadas para simulação são processadas conforme descrito
            na nossa Política de Privacidade, incluindo o envio a um provedor de inteligência
            artificial para geração da prévia.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">4. Pagamentos</h2>
          <p className="mt-2">
            Pagamentos de sinal e valor final são processados por um provedor de pagamentos externo.
            A InkVision retém uma taxa de plataforma sobre cada transação. Políticas de reembolso e
            cancelamento de sessão são acordadas diretamente com o estúdio; a InkVision pode
            intermediar disputas, mas não garante reembolso.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">5. Conta e elegibilidade</h2>
          <p className="mt-2">
            Você precisa ter 18 anos ou mais (ou consentimento de um responsável legal, quando
            aplicável pela legislação local) para criar uma conta e agendar uma tatuagem.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">6. Seus direitos sobre os dados</h2>
          <p className="mt-2">
            Você pode exportar ou excluir seus dados a qualquer momento em{" "}
            <a href="/conta" className="ink-link">
              Minha conta
            </a>
            . Detalhes sobre o que é excluído estão na{" "}
            <a href="/privacidade" className="ink-link">
              Política de Privacidade
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-normal">7. Alterações</h2>
          <p className="mt-2">
            Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas por e-mail ou aviso
            na plataforma antes de entrarem em vigor.
          </p>
        </section>

        <p className="border-t border-border pt-6 text-xs text-muted-foreground">
          Este texto descreve as práticas reais da plataforma de forma direta, mas não substitui
          aconselhamento jurídico. Dúvidas: contato@inkvision.app.
        </p>
      </div>
    </div>
  );
}
