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

/**
 * Margem extra da máscara em torno da arte (1 = mesmo tamanho da arte). Um
 * pouco maior que a arte dá à IA espaço pra sombra/blend na borda sem abrir
 * mão de manter o resto da foto intocado.
 */
const MASK_PADDING = 1.3;

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

/**
 * Gera a máscara de inpainting: branco na área da arte (com uma margem),
 * preto no resto — mesma posição/escala/rotação usadas em `composeTattooImage`.
 * É essa máscara que restringe a IA a só repintar o desenho, preservando o
 * resto da foto (roupa, rosto, outras tatuagens) por arquitetura, não só por
 * instrução de prompt.
 */
export async function composeTattooMask(
  bodyPhotoUrl: string,
  designUrl: string,
  placement: TattooPlacement,
): Promise<Blob> {
  const [body, art] = await Promise.all([loadImage(bodyPhotoUrl), loadImage(designUrl)]);

  const width = 900;
  const height = Math.round((width * body.height) / body.width);

  const designWidth = (BASE_WIDTH_PERCENT / 100) * width * placement.scale * MASK_PADDING;
  const designHeight = (designWidth * art.height) / art.width;

  // Desenha a arte isolada (só a silhueta importa) e substitui seus pixels
  // opacos por branco puro, preservando a forma real do traço (via alpha) —
  // ou, se a arte não tiver transparência (ex.: JPEG), vira um retângulo
  // branco na área dela, o que ainda restringe a IA à região certa.
  const shapeCanvas = document.createElement("canvas");
  shapeCanvas.width = width;
  shapeCanvas.height = height;
  const shapeCtx = shapeCanvas.getContext("2d");
  if (!shapeCtx) throw new Error("Canvas indisponível neste navegador");

  shapeCtx.save();
  shapeCtx.translate(placement.x * width, placement.y * height);
  shapeCtx.rotate((placement.rotation * Math.PI) / 180);
  shapeCtx.drawImage(art, -designWidth / 2, -designHeight / 2, designWidth, designHeight);
  shapeCtx.restore();

  shapeCtx.globalCompositeOperation = "source-in";
  shapeCtx.fillStyle = "#fff";
  shapeCtx.fillRect(0, 0, width, height);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d");
  if (!maskCtx) throw new Error("Canvas indisponível neste navegador");
  maskCtx.fillStyle = "#000";
  maskCtx.fillRect(0, 0, width, height);
  maskCtx.drawImage(shapeCanvas, 0, 0);

  return new Promise((resolve, reject) => {
    maskCanvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao compor a máscara"))),
      "image/png",
    );
  });
}
