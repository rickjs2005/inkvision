/**
 * Limpa texto livre vindo do usuário: remove bytes nulos e caracteres de
 * controle (exceto quebra de linha e tab) e apara as bordas. Não é anti-XSS por
 * si só — o React escapa na renderização; isto é defesa em profundidade e evita
 * lixo binário no banco.
 */
// Controle: U+0000–08, U+000B–0C, U+000E–1F, U+007F. Mantém \t (09), \n (0A), \r (0D).
const CONTROL = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]", "g");

export function sanitizeText(input: string): string {
  return input.replace(CONTROL, "").trim();
}
