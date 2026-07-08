-- Guarda a foto do corpo + a arte já compostas num único bitmap (canvas), na
-- posição escolhida pelo cliente. É essa imagem que vai para o provider de IA
-- (antes, só a foto crua ia como imagem e a arte era referenciada por URL no
-- prompt de texto — um modelo img2img não busca a URL, então a arte real nunca
-- chegava ao modelo). Nullable: simulações antigas não têm esse campo.
ALTER TABLE "Simulation" ADD COLUMN "composedImageUrl" TEXT;
