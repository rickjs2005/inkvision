const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Formata um valor em centavos como moeda pt-BR (ex.: 45000 → "R$ 450,00").
 */
export function formatBRL(cents: number): string {
  return brlFormatter.format(cents / 100);
}
