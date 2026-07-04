/** Dados da FAQ — módulo puro (sem "use client") para poder ser lido no server. */
export const FAQ_ITEMS = [
  {
    q: "Como funciona a simulação da tatuagem por IA?",
    a: "Você envia uma foto da parte do corpo e o desenho aprovado. A IA detecta a pele, ajusta perspectiva, escala e sombras, e mostra a tatuagem aplicada de forma realista — em tamanhos P, M e G.",
  },
  {
    q: "Preciso pagar para ver a simulação?",
    a: "Você conversa com o tatuador, recebe o orçamento e paga apenas o sinal para iniciar o projeto. A simulação faz parte do fluxo antes de agendar a sessão.",
  },
  {
    q: "Sou tatuador. Como coloco meu estúdio na InkVision?",
    a: "Crie sua conta e fale com a gente para ativar o estúdio. Você cadastra seus tatuadores, monta o portfólio e passa a receber pedidos, chat e pagamentos num só lugar.",
  },
  {
    q: "Os pagamentos são seguros?",
    a: "Sim. Os pagamentos são processados pelo Stripe, com o valor indo direto para a conta do estúdio e a plataforma retendo apenas a taxa de serviço.",
  },
] as const;
