/**
 * Fundo decorativo do ateliê — parede de flash old school em traço fine-line:
 * âncora, andorinha, raio e estrelas náuticas, como os desenhos clássicos
 * pregados na parede do estúdio. Fixo atrás de TODO o conteúdo (z negativo);
 * painéis com bg sólido simplesmente o cobrem. Opacidade baixíssima para
 * nunca competir com texto; cores via currentColor/tokens, então adapta a
 * claro/escuro sozinho.
 */
export function InkBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden text-foreground"
    >
      {/* ── Âncora — canto inferior esquerdo, levemente inclinada ── */}
      <svg
        viewBox="0 0 100 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute -bottom-[8vh] -left-8 h-[56vh] w-auto -rotate-[10deg] opacity-[0.05]"
      >
        <circle cx="50" cy="18" r="8" />
        <path d="M50 26 L50 92" />
        <path d="M34 40 H66" />
        <path d="M50 92 C34 92 22 80 20 66 M20 66 L12 74 M20 66 L30 70" />
        <path d="M50 92 C66 92 78 80 80 66 M80 66 L88 74 M80 66 L70 70" />
      </svg>

      {/* ── Andorinha — topo direito, em voo ── */}
      <svg
        viewBox="0 0 140 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute right-[5vw] top-[7vh] h-[24vh] w-auto opacity-[0.05]"
      >
        <path d="M70 40 C58 26 40 20 18 24 C36 32 46 40 52 52" />
        <path d="M70 40 C82 26 100 20 122 24 C104 32 94 40 88 52" />
        <path d="M52 52 C58 62 62 72 60 86 L70 72 L80 86 C78 72 82 62 88 52" />
        <circle cx="70" cy="36" r="1.2" fill="currentColor" stroke="none" />
      </svg>

      {/* ── Raio — vermelhão, meia altura à direita ── */}
      <svg
        viewBox="0 0 60 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute -right-2 top-[52vh] h-[22vh] w-auto rotate-[8deg] text-primary opacity-[0.06]"
      >
        <path d="M36 8 L20 46 H32 L18 88 L44 40 H30 L44 8 Z" />
      </svg>

      {/* ── Estrela náutica — centro-direita baixa ── */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute bottom-[16vh] right-[24vw] h-[18vh] w-auto opacity-[0.045]"
      >
        <path d="M50 6 L58 42 L94 50 L58 58 L50 94 L42 58 L6 50 L42 42 Z" />
        <path d="M50 6 L50 94 M6 50 H94" strokeDasharray="1 7" />
      </svg>

      {/* ── Estrela menor — topo esquerdo, quase imperceptível ── */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-[22vw] top-[9vh] h-[8vh] w-auto rotate-12 opacity-[0.04]"
      >
        <path d="M50 6 L58 42 L94 50 L58 58 L50 94 L42 58 L6 50 L42 42 Z" />
      </svg>

      {/* ── Pontilhismo esparso — textura de sombreamento entre os desenhos ── */}
      <svg
        viewBox="0 0 400 400"
        className="absolute left-[36vw] top-[40vh] h-[32vh] w-auto opacity-[0.035]"
        fill="currentColor"
        stroke="none"
      >
        <circle cx="60" cy="80" r="1.4" />
        <circle cx="120" cy="50" r="1" />
        <circle cx="200" cy="110" r="1.6" />
        <circle cx="280" cy="70" r="1.1" />
        <circle cx="340" cy="140" r="1.3" />
        <circle cx="90" cy="200" r="1.2" />
        <circle cx="180" cy="240" r="1" />
        <circle cx="300" cy="220" r="1.5" />
        <circle cx="240" cy="320" r="1.2" />
        <circle cx="120" cy="330" r="1.4" />
      </svg>
    </div>
  );
}
