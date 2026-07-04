import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

const TESTIMONIALS = [
  {
    quote:
      "Ver a tatuagem no meu braço antes de fechar foi surreal. Cheguei no estúdio com zero medo do resultado.",
    name: "Marina S.",
    role: "Cliente · São Paulo",
  },
  {
    quote:
      "Fechei três projetos numa semana. Os clientes já chegam decididos porque aprovaram a arte e a simulação antes.",
    name: "Rafa Costa",
    role: "Tatuador · Belo Horizonte",
  },
  {
    quote:
      "Organizou toda a agenda e os pagamentos do estúdio. Parei de perder cliente no WhatsApp.",
    name: "Estúdio Alma",
    role: "Dono de estúdio",
  },
];

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

export function Testimonials() {
  const [featured, ...rest] = TESTIMONIALS;
  if (!featured) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
      <Reveal className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Quem usa, recomenda</span>
      </Reveal>

      <div className="mt-12 grid gap-14 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        {/* Citação em destaque */}
        <Reveal delay={0.05} className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-2 -top-16 select-none font-display text-[11rem] leading-none text-primary/90"
          >
            &ldquo;
          </span>
          <blockquote className="relative">
            <p className="font-display text-3xl font-light italic leading-[1.25] tracking-[-0.01em] sm:text-[2.5rem] sm:leading-[1.2]">
              {featured.quote}
            </p>
            <footer className="mt-8 flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-card font-display text-lg text-foreground">
                {initial(featured.name)}
              </span>
              <div>
                <p className="font-medium">{featured.name}</p>
                <p className="eyebrow mt-0.5">{featured.role}</p>
              </div>
            </footer>
          </blockquote>
        </Reveal>

        {/* Depoimentos menores com hairline */}
        <RevealStagger className="flex flex-col">
          {rest.map((t, i) => (
            <RevealItem key={t.name}>
              <figure className={i > 0 ? "border-t border-border pt-8 mt-8" : ""}>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  <span className="font-display text-2xl leading-none text-primary">&ldquo;</span>
                  {t.quote}
                </p>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card font-display text-sm text-foreground">
                    {initial(t.name)}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="eyebrow mt-0.5">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
