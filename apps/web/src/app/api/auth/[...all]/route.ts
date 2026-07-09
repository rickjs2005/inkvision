import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth);

/**
 * Sem isso, uma exceção não tratada dentro do handler do better-auth (ex.:
 * uma falha transitória de conexão com o Postgres) sobe crua até o Next e
 * vira um 500 com corpo vazio — o client não tem como distinguir isso de
 * "servidor fora do ar" e a UI acaba sem mensagem nenhuma pro usuário.
 */
function withErrorHandling(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      console.error("[api/auth] erro não tratado:", error);
      return Response.json(
        { message: "Erro no servidor. Tente novamente em instantes.", code: "INTERNAL_SERVER_ERROR" },
        { status: 500 },
      );
    }
  };
}

export const GET = withErrorHandling(handlers.GET);
export const POST = withErrorHandling(handlers.POST);
