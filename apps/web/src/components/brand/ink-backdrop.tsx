/**
 * Fundo decorativo do ateliê — traços fine-line, pontilhismo e respingos de
 * tinta na mesma linguagem dos desenhos do simulador. Fixo atrás de TODO o
 * conteúdo (z negativo), enxergável só onde o fundo aparece; painéis com bg
 * sólido simplesmente o cobrem. Opacidade baixíssima para nunca competir com
 * texto; cores via currentColor/tokens, então adapta a claro/escuro sozinho.
 */
export function InkBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden text-foreground"
    >
      {/* ── Traço longo de agulha — canto superior esquerdo, desce a lateral ── */}
      <svg
        viewBox="0 0 320 900"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        className="absolute -left-10 top-0 h-[90vh] w-auto opacity-[0.05]"
      >
        <path d="M120 -20 C60 140 190 260 110 420 C40 560 150 700 90 920" strokeWidth="1.5" />
        <path d="M150 -20 C95 150 215 270 140 430 C75 565 180 705 125 920" strokeWidth="1" opacity="0.7" />
        {/* pontilhismo acompanhando o traço */}
        <g fill="currentColor" stroke="none" opacity="0.8">
          <circle cx="95" cy="180" r="1.6" />
          <circle cx="108" cy="210" r="1.1" />
          <circle cx="88" cy="238" r="1.3" />
          <circle cx="152" cy="480" r="1.5" />
          <circle cx="138" cy="512" r="1" />
          <circle cx="122" cy="545" r="1.3" />
        </g>
      </svg>

      {/* ── Ramo botânico fantasma — lateral direita ── */}
      <svg
        viewBox="0 0 100 130"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute -right-16 top-[16vh] h-[62vh] w-auto rotate-[14deg] opacity-[0.045]"
      >
        <path d="M50 124 C50 100 50 74 50 48 C50 34 50 22 50 10" />
        <path d="M50 100 C37 95 29 84 27 70 M50 100 C63 95 71 84 73 70" />
        <path d="M50 80 C40 76 34 67 33 56 M50 80 C60 76 66 67 67 56" />
        <path d="M50 60 C43 57 39 50 38 42 M50 60 C57 57 61 50 62 42" />
        <path d="M50 10 C43 14 40 22 46 28 C49 31 51 31 54 28 C60 22 57 14 50 10 Z" />
      </svg>

      {/* ── Curva de serpente — rodapé esquerdo ── */}
      <svg
        viewBox="0 0 100 130"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        className="absolute -bottom-20 left-[6vw] h-[52vh] w-auto -rotate-12 opacity-[0.04]"
      >
        <path d="M50 18 C34 26 34 44 50 52 C66 60 66 78 50 86 C36 93 36 108 50 116" />
        <path d="M44 40 h12 M44 46 h12 M44 72 h12 M44 78 h12" strokeWidth="0.8" opacity="0.7" />
      </svg>

      {/* ── Respingo de tinta — vermelhão, canto inferior direito ── */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -bottom-10 right-[4vw] h-[34vh] w-auto text-primary opacity-[0.06]"
        fill="currentColor"
        stroke="none"
      >
        <circle cx="100" cy="104" r="7" />
        <circle cx="128" cy="86" r="3.4" />
        <circle cx="76" cy="126" r="2.6" />
        <circle cx="142" cy="118" r="1.8" />
        <circle cx="88" cy="76" r="1.5" />
        <circle cx="118" cy="140" r="1.2" />
        <circle cx="62" cy="96" r="1" />
        <path d="M104 96 C118 78 134 66 152 58 C136 72 124 88 112 104 Z" opacity="0.8" />
        <path d="M92 112 C80 128 72 142 68 158 C78 144 88 132 98 120 Z" opacity="0.6" />
      </svg>

      {/* ── Respingo menor — topo direito, foreground ── */}
      <svg
        viewBox="0 0 120 120"
        className="absolute right-[16vw] top-[6vh] h-[10vh] w-auto opacity-[0.05]"
        fill="currentColor"
        stroke="none"
      >
        <circle cx="60" cy="60" r="3.4" />
        <circle cx="78" cy="48" r="1.6" />
        <circle cx="44" cy="72" r="1.3" />
        <circle cx="86" cy="70" r="1" />
        <path d="M63 54 C72 44 82 37 94 32 C84 41 76 50 68 60 Z" opacity="0.7" />
      </svg>

      {/* ── Pontilhismo esparso — meio da tela, quase imperceptível ── */}
      <svg
        viewBox="0 0 400 400"
        className="absolute left-[38vw] top-[42vh] h-[30vh] w-auto opacity-[0.035]"
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
