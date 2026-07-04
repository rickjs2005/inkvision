/** As 9 categorias de estilo da plataforma. Alimenta o seed de `Style`. */
export const TATTOO_STYLES = [
  { slug: "fine-line", name: "Fine Line" },
  { slug: "blackwork", name: "Blackwork" },
  { slug: "old-school", name: "Old School" },
  { slug: "realismo", name: "Realismo" },
  { slug: "oriental", name: "Oriental" },
  { slug: "geometrica", name: "Geométrica" },
  { slug: "minimalista", name: "Minimalista" },
  { slug: "tribal", name: "Tribal" },
  { slug: "aquarela", name: "Aquarela" },
] as const;

export type TattooStyleSlug = (typeof TATTOO_STYLES)[number]["slug"];
