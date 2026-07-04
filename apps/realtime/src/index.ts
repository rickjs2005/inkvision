import { createServer } from "node:http";
import { Server } from "socket.io";
import { jwtVerify } from "jose";
import { RT, conversationRoom, userRoom } from "@inkvision/shared";

/**
 * Serviço de realtime (dev). Relay fino de Socket.IO:
 *  - Autoriza cada socket por um TOKEN DE SALA assinado (HS256, segredo do web).
 *    O token só é emitido pelo web após autorizar o acesso à conversa, então o
 *    realtime confia nas claims — sem tocar no banco.
 *  - Recebe eventos server-to-server em POST /emit (protegido por segredo) e
 *    transmite para a sala (é assim que `message:new` chega aos clientes).
 *  - Relaya eventos efêmeros (digitando, lido) entre os participantes.
 *
 * Reforço futuro: adapter Redis (@socket.io/redis-adapter) para múltiplas
 * instâncias — hoje é single-instance em memória, suficiente para o dev.
 */

const PORT = Number(process.env.REALTIME_PORT ?? 4000);
const SECRET = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me");
const EMIT_SECRET = process.env.REALTIME_EMIT_SECRET ?? "dev-emit-secret";
const CORS_ORIGIN = process.env.APP_URL ?? "http://localhost:3000";

interface RoomClaims {
  sub: string; // userId
  conv: string; // conversationId
}

const httpServer = createServer(async (req, res) => {
  // Endpoint server-to-server: o web publica mensagens já persistidas.
  if (req.method === "POST" && req.url === "/emit") {
    if (req.headers["x-emit-secret"] !== EMIT_SECRET) {
      res.writeHead(401).end();
      return;
    }
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try {
      const { room, event, payload } = JSON.parse(raw) as {
        room: string;
        event: string;
        payload: unknown;
      };
      io.to(room).emit(event, payload);
      res.writeHead(204).end();
    } catch {
      res.writeHead(400).end();
    }
    return;
  }
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404).end();
});

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, credentials: true },
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error("Token ausente"));
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const claims = payload as unknown as RoomClaims;
    if (!claims.sub || !claims.conv) return next(new Error("Token inválido"));
    socket.data.userId = claims.sub;
    socket.data.conversationId = claims.conv;
    next();
  } catch {
    next(new Error("Token inválido ou expirado"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId as string;
  const conversationId = socket.data.conversationId as string;

  // O token já prova o acesso à conversa: entra direto nas salas.
  void socket.join(conversationRoom(conversationId));
  void socket.join(userRoom(userId));

  socket.on(RT.TYPING, () => {
    socket.to(conversationRoom(conversationId)).emit(RT.TYPING, { userId });
  });

  socket.on(RT.MESSAGE_READ, () => {
    socket.to(conversationRoom(conversationId)).emit(RT.MESSAGE_READ, { userId });
  });
});

httpServer.listen(PORT, () => {
  console.log(`⚡ realtime ouvindo em :${PORT}`);
});
