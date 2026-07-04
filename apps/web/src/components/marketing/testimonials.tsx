import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import { Card, CardContent } from "@/components/ui/card";

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

export function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal>
        <h2 className="text-center text-3xl font-bold tracking-tight">Quem usa, recomenda</h2>
      </Reveal>
      <RevealStagger className="mt-10 grid gap-4 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <RevealItem key={t.name}>
            <Card className="h-full">
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <p className="text-lg leading-relaxed">“{t.quote}”</p>
                <div className="mt-auto">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          </RevealItem>
        ))}
      </RevealStagger>
    </section>
  );
}
