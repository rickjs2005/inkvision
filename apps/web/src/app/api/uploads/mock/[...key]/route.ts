import { NextResponse } from "next/server";

/**
 * Sink de upload do MockStorageService: recebe o PUT e descarta os bytes.
 * Em produção o cliente envia direto para o R2 via presigned URL — esta rota
 * não existe nesse caminho.
 */
export async function PUT() {
  return new NextResponse(null, { status: 204 });
}

export async function POST() {
  return new NextResponse(null, { status: 204 });
}
