/**
 * Compõe a foto do corpo + a arte do tatuador num único bitmap (canvas), na
 * posição/escala/rotação escolhidas no editor — mesma técnica já usada no
 * simulador público (`/simular`). É essa imagem, e não a foto crua, que deve
 * ir para o provider de IA: um modelo de image-to-image não busca URLs citadas
 * em texto, então a arte só chega ao modelo se já estiver nos pixels enviados.
 */

export interface TattooPlacement {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

/** Largura base da arte, em % da largura da foto — casa com o editor de posicionamento. */
const BASE_WIDTH_PERCENT = 28;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível carregar a imagem"));
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const r = Math.max(w / img.width, h / img.height);
  const dw = img.width * r;
  const dh = img.height * r;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/** Compõe body photo + arte na posição escolhida; retorna um Blob JPEG pronto para upload. */
export async function composeTattooImage(
  bodyPhotoUrl: string,
  designUrl: string,
  placement: TattooPlacement,
): Promise<Blob> {
  const [body, art] = await Promise.all([loadImage(bodyPhotoUrl), loadImage(designUrl)]);

  const width = 900;
  const height = Math.round((width * body.height) / body.width);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador");

  drawCover(ctx, body, width, height);

  const designWidth = (BASE_WIDTH_PERCENT / 100) * width * placement.scale;
  const designHeight = (designWidth * art.height) / art.width;
  ctx.globalCompositeOperation = "multiply";
  ctx.save();
  ctx.translate(placement.x * width, placement.y * height);
  ctx.rotate((placement.rotation * Math.PI) / 180);
  ctx.drawImage(art, -designWidth / 2, -designHeight / 2, designWidth, designHeight);
  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao compor a imagem"))),
      "image/jpeg",
      0.9,
    );
  });
}
