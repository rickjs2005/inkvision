-- Máscara binária (branco = área a repintar, preto = preservar) na mesma
-- posição/escala/rotação da arte composta. Habilita inpainting: a IA só pode
-- alterar pixels dentro da máscara — o resto da foto (roupa, rosto, outras
-- tatuagens) fica preservado por arquitetura, não só por instrução de prompt.
ALTER TABLE "Simulation" ADD COLUMN "composedMaskUrl" TEXT;
