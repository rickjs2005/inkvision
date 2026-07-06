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

      {/* ── Rosa — canto inferior direito, botão em espiral + folhas ── */}
      <svg
        viewBox="0 0 100 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute -bottom-[6vh] right-[3vw] h-[36vh] w-auto rotate-[8deg] opacity-[0.05]"
      >
        {/* miolo em espiral */}
        <path d="M50 38 C46 33 52 29 56 33 C60 39 52 46 45 42 C38 36 45 25 55 26" />
        {/* pétalas */}
        <path d="M33 42 C29 30 38 20 50 20 C62 20 71 30 67 42" />
        <path d="M33 42 C30 55 38 64 50 64 C62 64 70 55 67 42" />
        <path d="M28 38 C20 42 18 52 26 58 M72 38 C80 42 82 52 74 58" />
        {/* caule e folhas */}
        <path d="M50 64 C50 80 50 96 50 114" />
        <path d="M50 84 C41 80 35 72 34 63 C42 67 48 74 50 82" />
        <path d="M50 98 C59 94 65 86 66 77 C58 81 52 88 50 96" />
        <circle cx="43" cy="52" r="1.1" fill="currentColor" stroke="none" />
      </svg>

      {/* ── Punhal — centro-topo, lâmina para baixo ── */}
      <svg
        viewBox="0 0 60 140"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute -top-[3vh] left-[54vw] h-[30vh] w-auto -rotate-6 opacity-[0.045]"
      >
        <circle cx="30" cy="12" r="5" />
        <path d="M30 17 L30 34" />
        <path d="M24 22 H36 M24 28 H36" strokeWidth="1" />
        <path d="M14 38 H46 M14 38 C14 34 18 34 18 38 M46 38 C46 34 42 34 42 38" />
        <path d="M24 38 L30 118 L36 38" />
        <path d="M30 44 L30 100" strokeWidth="0.9" strokeDasharray="1 5" />
      </svg>

      {/* ── Borboleta — baixo, entre a âncora e a estrela ── */}
      <svg
        viewBox="0 0 120 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute bottom-[7vh] left-[28vw] h-[20vh] w-auto -rotate-6 opacity-[0.045]"
      >
        <path d="M60 32 L60 72" />
        <path d="M60 32 C56 24 52 19 46 15 M60 32 C64 24 68 19 74 15" />
        <circle cx="45" cy="13" r="1" fill="currentColor" stroke="none" />
        <circle cx="75" cy="13" r="1" fill="currentColor" stroke="none" />
        {/* asas superiores */}
        <path d="M60 42 C42 26 20 30 18 46 C17 60 42 62 58 52" />
        <path d="M60 42 C78 26 100 30 102 46 C103 60 78 62 62 52" />
        {/* asas inferiores */}
        <path d="M60 56 C46 54 35 62 37 73 C39 83 54 80 60 68" />
        <path d="M60 56 C74 54 85 62 83 73 C81 83 66 80 60 68" />
        {/* pintas das asas */}
        <circle cx="36" cy="44" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="84" cy="44" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="48" cy="70" r="1" fill="currentColor" stroke="none" />
        <circle cx="72" cy="70" r="1" fill="currentColor" stroke="none" />
      </svg>

      {/* ── Relógio de bolso — lateral esquerda, meia altura, com corrente ── */}
      <svg
        viewBox="0 0 120 170"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute -left-4 top-[27vh] h-[27vh] w-auto rotate-6 opacity-[0.05]"
      >
        {/* coroa + argola */}
        <path d="M54 22 H66 M56 22 V16 H64 V22" />
        <circle cx="60" cy="11" r="4" />
        {/* corrente */}
        <path d="M60 7 C44 -2 24 2 14 16" strokeDasharray="2 6" />
        {/* caixa e mostrador */}
        <circle cx="60" cy="86" r="52" />
        <circle cx="60" cy="86" r="45" strokeWidth="1" />
        {/* marcações de hora */}
        <path d="M60 45 V52 M60 120 V127 M19 86 H26 M94 86 H101
                 M31 57 L36 62 M89 110 L84 105 M31 115 L36 110 M89 62 L84 67" strokeWidth="1" />
        {/* ponteiros — 10h10, o clássico de mostruário */}
        <path d="M60 86 L38 68 M60 86 L78 64" strokeWidth="1.5" />
        <circle cx="60" cy="86" r="2" fill="currentColor" stroke="none" />
      </svg>

      {/* ── Leão — juba densa em duas camadas, olhar sério ── */}
      <svg
        viewBox="0 0 160 160"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute right-[9vw] top-[28vh] h-[27vh] w-auto -rotate-3 opacity-[0.05]"
      >
        {/* juba — camada externa (labaredas longas radiais) */}
        <path d="M80 6 C77 15 78 24 80 31" />
        <path d="M106 10 C101 18 100 26 101 33 M54 10 C59 18 60 26 59 33" />
        <path d="M128 24 C121 29 117 36 116 43 M32 24 C39 29 43 36 44 43" />
        <path d="M143 46 C135 48 130 54 128 60 M17 46 C25 48 30 54 32 60" />
        <path d="M150 74 C141 73 135 77 132 82 M10 74 C19 73 25 77 28 82" />
        <path d="M147 102 C139 99 133 101 129 105 M13 102 C21 99 27 101 31 105" />
        <path d="M134 126 C128 121 122 121 117 124 M26 126 C32 121 38 121 43 124" />
        <path d="M113 142 C109 135 104 132 99 132 M47 142 C51 135 56 132 61 132" />
        <path d="M80 148 C78 140 78 134 80 128" />
        {/* juba — camada interna (tufos curtos) */}
        <path d="M80 36 C78 42 78 48 80 53" strokeWidth="1" />
        <path d="M100 38 C96 44 95 50 96 55 M60 38 C64 44 65 50 64 55" strokeWidth="1" />
        <path d="M116 52 C110 56 107 61 107 66 M44 52 C50 56 53 61 53 66" strokeWidth="1" />
        <path d="M124 76 C117 77 113 81 112 86 M36 76 C43 77 47 81 48 86" strokeWidth="1" />
        <path d="M118 102 C112 101 108 104 106 108 M42 102 C48 101 52 104 54 108" strokeWidth="1" />
        {/* orelhas dentro da juba */}
        <path d="M56 38 C52 30 60 24 66 30 M104 38 C108 30 100 24 94 30" />
        {/* testa e maçãs com tufos de pelo */}
        <path d="M58 60 C62 46 74 40 80 40 C86 40 98 46 102 60" />
        <path d="M52 78 C50 88 52 98 58 106 L54 112 L62 112 C66 118 72 122 80 123" />
        <path d="M108 78 C110 88 108 98 102 106 L106 112 L98 112 C94 118 88 122 80 123" />
        {/* sobrancelhas franzidas */}
        <path d="M58 60 C64 55 72 54 77 57 M102 60 C96 55 88 54 83 57" strokeWidth="1.4" />
        {/* olhos estreitados */}
        <path d="M60 68 C65 64 71 64 75 68 M62 69 C66 71 71 71 74 69" />
        <path d="M120 68 C115 64 109 64 105 68 M118 69 C114 71 109 71 106 69" />
        <circle cx="67" cy="67" r="1" fill="currentColor" stroke="none" />
        <circle cx="113" cy="67" r="1" fill="currentColor" stroke="none" />
        {/* cano do focinho */}
        <path d="M77 60 C78 70 77 80 75 88 M103 60 C102 70 103 80 105 88" strokeWidth="1" />
        {/* nariz, filtro e mandíbulas */}
        <path d="M72 90 H88 L83 100 H77 Z" />
        <path d="M80 100 V106" />
        <path d="M80 106 C72 114 62 114 56 108 M80 106 C88 114 98 114 104 108" />
        {/* queixo */}
        <path d="M72 120 C76 126 84 126 88 120" strokeWidth="1" />
        {/* bigodes */}
        <circle cx="64" cy="110" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="58" cy="113" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="96" cy="110" r="0.8" fill="currentColor" stroke="none" />
        <circle cx="102" cy="113" r="0.8" fill="currentColor" stroke="none" />
      </svg>

      {/* ── 刺青 (irezumi, "tatuagem") — kanji vertical, centro-baixo ── */}
      <svg
        viewBox="0 0 80 200"
        className="absolute bottom-[3vh] left-[47vw] h-[24vh] w-auto rotate-2 opacity-[0.055]"
      >
        <text
          x="40"
          y="72"
          textAnchor="middle"
          fontSize="64"
          fontFamily='"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", "Noto Serif CJK JP", serif'
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          刺
        </text>
        <text
          x="40"
          y="150"
          textAnchor="middle"
          fontSize="64"
          fontFamily='"Yu Mincho", "Hiragino Mincho ProN", "Noto Serif JP", "Noto Serif CJK JP", serif'
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          青
        </text>
        {/* selo vermelho, como assinatura de gravura */}
        <rect x="30" y="168" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary" opacity="0.9" />
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
