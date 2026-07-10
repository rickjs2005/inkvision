"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { io, type Socket } from "socket.io-client";
import { AlertCircle, ArrowDown, Check, CheckCheck, Loader2, Paperclip, Send } from "lucide-react";
import type { ChatMessage, SendMessageInput } from "@inkvision/core";
import { RT } from "@inkvision/shared";
import { uploadFile } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { WhatsAppLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import type { ActionResult } from "@/server/action-result";

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000";

function kindFromMime(mime: string): SendMessageInput["kind"] {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime.startsWith("video/")) return "VIDEO";
  return "PDF";
}

/** Horário curto para o carimbo em monoespaçado. */
function formatTime(value: Date): string {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Inicial do remetente para o avatar do outro lado. */
function initial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

const dayFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Rótulo do separador de dia — "Hoje", "Ontem" ou a data curta. */
function dayLabel(value: Date): string {
  const d = new Date(value);
  const now = new Date();
  if (sameDay(d, now)) return "Hoje";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return "Ontem";
  return dayFmt.format(d);
}

/** Mensagens do mesmo remetente com menos de 5 min entre si formam um grupo. */
const GROUP_GAP_MS = 5 * 60_000;

function sameGroup(a: ChatMessage | undefined, b: ChatMessage): boolean {
  if (!a) return false;
  const da = new Date(a.createdAt);
  const db = new Date(b.createdAt);
  return a.senderId === b.senderId && sameDay(da, db) && db.getTime() - da.getTime() < GROUP_GAP_MS;
}

// Split com grupo de captura: índices ímpares são as URLs.
const URL_RE = /(https?:\/\/[^\s<>"']+)/g;

/** Torna URLs http(s) clicáveis dentro do texto da bolha. */
function linkify(body: string, mine: boolean) {
  const parts = body.split(URL_RE);
  if (parts.length === 1) return body;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          "underline underline-offset-2 break-all",
          mine ? "text-primary-foreground" : "text-primary",
        )}
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

/** Eco local de uma mensagem ainda não confirmada pelo servidor (ou que falhou). */
type LocalMessage = ChatMessage & { pending?: boolean; failed?: boolean };

export function ChatPanel({
  currentUserId,
  studioId,
  roomToken,
  studioPhone,
  initialMessages,
  initialHasMore = false,
  onSend,
  onMarkRead,
  onLoadOlder,
}: {
  currentUserId: string;
  studioId: string;
  roomToken: string;
  /** Telefone do estúdio — habilita o link de fallback pro WhatsApp. */
  studioPhone?: string | null;
  initialMessages: ChatMessage[];
  /** Há mensagens mais antigas que a primeira página. */
  initialHasMore?: boolean;
  onSend: (input: SendMessageInput) => Promise<ActionResult<ChatMessage>>;
  onMarkRead: () => Promise<{ ok: boolean }>;
  /** Pagina para trás a partir da mensagem mais antiga em tela. */
  onLoadOlder?: (
    beforeId: string,
  ) => Promise<ActionResult<{ items: ChatMessage[]; hasMore: boolean }>>;
}) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [unseenBelow, setUnseenBelow] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const flowRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  // Ao PREPENDER histórico, o auto-scroll pro fim deve ficar quieto.
  const skipAutoScroll = useRef(false);
  // Primeira rolagem (montagem com histórico existente) é instantânea; as seguintes, suaves.
  const didMountScroll = useRef(false);
  const seen = useRef(new Set(initialMessages.map((m) => m.id)));
  const lastTypingEmit = useRef(0);

  /** O leitor está (quase) no fim do fluxo? Decide se o auto-scroll pode agir. */
  function nearBottom(): boolean {
    const flow = flowRef.current;
    if (!flow) return true;
    return flow.scrollHeight - flow.scrollTop - flow.clientHeight < 120;
  }

  function append(m: ChatMessage) {
    if (seen.current.has(m.id)) return;
    seen.current.add(m.id);
    setMessages((prev) => [...prev, m]);
  }

  async function loadOlder() {
    const first = messages[0];
    if (!onLoadOlder || !first || loadingOlder) return;
    setLoadingOlder(true);
    const flow = flowRef.current;
    const prevHeight = flow?.scrollHeight ?? 0;
    try {
      const res = await onLoadOlder(first.id);
      if (!res.ok) return;
      const fresh = res.data.items.filter((m) => !seen.current.has(m.id));
      fresh.forEach((m) => seen.current.add(m.id));
      skipAutoScroll.current = true;
      setMessages((prev) => [...fresh, ...prev]);
      setHasMore(res.data.hasMore);
      // Mantém o usuário olhando para a mesma mensagem após o prepend.
      requestAnimationFrame(() => {
        if (flow) flow.scrollTop += flow.scrollHeight - prevHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }

  useEffect(() => {
    const socket = io(REALTIME_URL, { auth: { token: roomToken }, transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on(RT.MESSAGE_NEW, (m: ChatMessage) => append(m));
    let t: ReturnType<typeof setTimeout>;
    socket.on(RT.TYPING, () => {
      setPeerTyping(true);
      clearTimeout(t);
      t = setTimeout(() => setPeerTyping(false), 1800);
    });

    void onMarkRead();
    return () => {
      clearTimeout(t);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomToken]);

  useEffect(() => {
    if (skipAutoScroll.current) {
      skipAutoScroll.current = false;
      return;
    }
    const flow = flowRef.current;
    if (!flow) return;
    const last = messages[messages.length - 1];
    const lastIsMine = last?.senderId === currentUserId;
    // Só rola sozinho se o leitor está no fim (ou se a mensagem é dele) —
    // antes, qualquer mensagem nova puxava a tela mesmo com o usuário lendo
    // o histórico lá em cima. Fora do fim, acende o aviso de novas mensagens.
    if (!didMountScroll.current || lastIsMine || nearBottom()) {
      const behavior: ScrollBehavior = didMountScroll.current ? "smooth" : "auto";
      didMountScroll.current = true;
      flow.scrollTo({ top: flow.scrollHeight, behavior });
      setUnseenBelow(false);
    } else {
      setUnseenBelow(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, peerTyping]);

  function jumpToLatest() {
    flowRef.current?.scrollTo({ top: flowRef.current.scrollHeight, behavior: "smooth" });
    setUnseenBelow(false);
  }

  /**
   * Ecoa a mensagem na hora (sem esperar a ida e volta do servidor) e depois
   * reconcilia com a versão persistida — ou marca como falha. Antes disso, a
   * bolha só aparecia após o `await onSend(...)` resolver, então qualquer
   * lentidão (rede, rate limit, etc.) dava a impressão de que a mensagem
   * tinha se perdido, mesmo já persistida no banco.
   */
  async function submit(input: SendMessageInput) {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: LocalMessage = {
      id: tempId,
      conversationId: "",
      senderId: currentUserId,
      senderName: "",
      kind: input.kind,
      body: input.body ?? null,
      attachmentUrl: input.attachmentUrl ?? null,
      attachmentMeta: input.attachmentMeta ?? null,
      deliveredAt: null,
      readAt: null,
      createdAt: new Date(),
      pending: true,
    };
    seen.current.add(tempId);
    setMessages((prev) => [...prev, optimistic]);
    setBusy(true);
    try {
      const res = await onSend(input);
      if (res.ok) {
        seen.current.add(res.data.id);
        setMessages((prev) => prev.map((m) => (m.id === tempId ? res.data : m)));
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)),
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m)),
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendText(e?: React.FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    if (composerRef.current) composerRef.current.style.height = "auto";
    await submit({ kind: "TEXT", body });
  }

  /** Reenvia uma mensagem que falhou — sem redigitar nada. */
  function resend(m: LocalMessage) {
    // Falha só acontece em mensagem enviada pelo usuário — nunca SYSTEM.
    if (m.kind === "SYSTEM") return;
    seen.current.delete(m.id);
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
    void submit({
      kind: m.kind,
      body: m.body ?? undefined,
      attachmentUrl: m.attachmentUrl ?? undefined,
      attachmentMeta: m.attachmentMeta ?? undefined,
    });
  }

  function discard(m: LocalMessage) {
    seen.current.delete(m.id);
    setMessages((prev) => prev.filter((x) => x.id !== m.id));
  }

  async function uploadAndSend(file: File) {
    setBusy(true);
    setUploading(true);
    try {
      const up = await uploadFile(file, "chat", studioId);
      await submit({ kind: kindFromMime(file.type), attachmentUrl: up.publicUrl });
    } catch (err) {
      // Sem isto o anexo sumia sem rastro — o usuário achava que enviou.
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível enviar o arquivo. Tente de novo.",
      );
    } finally {
      setBusy(false);
      setUploading(false);
    }
  }

  function sendFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void uploadAndSend(file);
  }

  /** Colar imagem direto no composer (print de referência, etc.). */
  function onPaste(e: React.ClipboardEvent) {
    const file = Array.from(e.clipboardData.files)[0];
    if (file && file.type.startsWith("image/")) {
      e.preventDefault();
      void uploadAndSend(file);
    }
  }

  function typing() {
    // Throttle — sem isso, cada tecla vira um emit no socket.
    const now = Date.now();
    if (now - lastTypingEmit.current < 800) return;
    lastTypingEmit.current = now;
    socketRef.current?.emit(RT.TYPING);
  }

  return (
    <div className="flex h-[min(70vh,38rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-ink)]">
      {/* Cabeçalho — identificação da conversa, estado da conexão e fallback de WhatsApp */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <span className="inline-flex items-center gap-2 eyebrow">
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              connected ? "animate-pulse bg-primary" : "bg-muted-foreground/50",
            )}
          />
          Conversa do pedido
          {!connected && (
            <span className="font-mono text-[10px] normal-case tracking-normal text-muted-foreground">
              · conectando…
            </span>
          )}
        </span>
        <div className="flex items-center gap-3">
          {peerTyping && (
            <span className="font-mono text-[11px] text-primary" role="status">
              digitando…
            </span>
          )}
          {studioPhone && (
            <WhatsAppLink
              phone={studioPhone}
              label="Prefere falar por WhatsApp?"
              className="text-[11px]"
            />
          )}
        </div>
      </div>

      {/* Fluxo de mensagens */}
      <div ref={flowRef} className="flex-1 overflow-y-auto px-4 py-5" aria-live="polite">
        {hasMore && onLoadOlder && (
          <div className="mb-4 flex justify-center">
            <button
              type="button"
              onClick={loadOlder}
              disabled={loadingOlder}
              className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-60"
            >
              {loadingOlder ? "Carregando…" : "Carregar mensagens anteriores"}
            </button>
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.senderId === currentUserId;
          const prev = messages[i - 1];
          const next = messages[i + 1];
          const newDay = !prev || !sameDay(new Date(prev.createdAt), new Date(m.createdAt));
          // Mensagens seguidas do mesmo remetente formam um grupo: avatar/nome
          // só na primeira, horário/recibo só na última — menos ruído por bolha.
          const groupStart = newDay || !sameGroup(prev, m);
          const groupEnd = !next || !sameGroup(m, next) || m.failed;
          return (
            <div key={m.id}>
              {newDay && (
                <div className="my-4 flex items-center gap-3" role="separator">
                  <span className="h-px flex-1 bg-border" aria-hidden />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {dayLabel(m.createdAt)}
                  </span>
                  <span className="h-px flex-1 bg-border" aria-hidden />
                </div>
              )}
              <div
                className={cn(
                  "flex gap-2.5",
                  mine ? "justify-end" : "justify-start",
                  groupStart && !newDay ? "mt-4" : !newDay ? "mt-1" : undefined,
                )}
              >
                {!mine &&
                  (groupEnd ? (
                    <span
                      aria-hidden
                      className="mt-auto flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-medium text-secondary-foreground"
                    >
                      {initial(m.senderName)}
                    </span>
                  ) : (
                    <span className="size-8 shrink-0" aria-hidden />
                  ))}

                <div className={cn("flex max-w-[78%] flex-col gap-1", mine ? "items-end" : "items-start")}>
                  {!mine && groupStart && (
                    <span className="eyebrow text-[10px] leading-none">{m.senderName}</span>
                  )}

                  <div
                    className={cn(
                      "px-4 py-2.5 text-sm leading-relaxed shadow-[var(--shadow-ink)]",
                      mine
                        ? "rounded-2xl rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-2xl rounded-bl-sm bg-muted text-foreground",
                      m.pending && "opacity-60",
                      m.failed && "opacity-80 ring-1 ring-destructive",
                    )}
                  >
                    {m.kind === "TEXT" && m.body && (
                      <p className="whitespace-pre-wrap">{linkify(m.body, mine)}</p>
                    )}
                    {m.kind === "IMAGE" && m.attachmentUrl && (
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Abrir imagem em tamanho real"
                      >
                        <Image
                          src={m.attachmentUrl}
                          alt="Imagem enviada na conversa"
                          width={220}
                          height={220}
                          className="rounded-lg transition-opacity hover:opacity-90"
                        />
                      </a>
                    )}
                    {m.kind === "AUDIO" && m.attachmentUrl && (
                      <audio controls src={m.attachmentUrl} className="max-w-[220px]" />
                    )}
                    {m.kind === "VIDEO" && m.attachmentUrl && (
                      <video controls src={m.attachmentUrl} className="max-w-[240px] rounded-lg" />
                    )}
                    {m.kind === "PDF" && m.attachmentUrl && (
                      <a
                        href={m.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn("ink-link", mine ? "text-primary-foreground" : "text-foreground")}
                      >
                        Abrir PDF
                      </a>
                    )}
                  </div>

                  {/* Meta — só no fim do grupo: horário, recibo, ou ações de falha */}
                  {m.failed ? (
                    <div className="flex items-center gap-2 px-1 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1 text-destructive">
                        <AlertCircle className="size-3.5" aria-hidden />
                        Falha ao enviar
                      </span>
                      <button
                        type="button"
                        onClick={() => resend(m)}
                        className="ink-link uppercase tracking-wider text-foreground"
                      >
                        Reenviar
                      </button>
                      <button
                        type="button"
                        onClick={() => discard(m)}
                        className="ink-link uppercase tracking-wider text-muted-foreground"
                      >
                        Descartar
                      </button>
                    </div>
                  ) : (
                    groupEnd && (
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-1 font-mono text-[11px] text-muted-foreground",
                          mine ? "flex-row-reverse" : "flex-row",
                        )}
                      >
                        <span>{formatTime(m.createdAt)}</span>
                        {mine &&
                          !m.pending &&
                          (m.readAt ? (
                            <CheckCheck className="size-3.5 text-primary" aria-label="Lido" />
                          ) : (
                            <Check className="size-3.5" aria-label="Enviado" />
                          ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {peerTyping && (
          <div className="mt-4 flex justify-start gap-2.5">
            <span className="mt-auto size-8 shrink-0 rounded-full bg-secondary" aria-hidden />
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Aviso de novas mensagens quando o leitor está no histórico */}
      <div className="relative">
        {unseenBelow && (
          <button
            type="button"
            onClick={jumpToLatest}
            className="absolute -top-11 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-primary shadow-[var(--shadow-lift)] transition-colors hover:bg-muted"
          >
            <ArrowDown className="size-3.5" aria-hidden />
            Novas mensagens
          </button>
        )}
        {uploading && (
          <p
            role="status"
            className="absolute -top-9 left-3 inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground"
          >
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Enviando anexo…
          </p>
        )}
      </div>

      {/* Barra de composição — textarea auto-ajustável: Enter envia, Shift+Enter quebra linha */}
      <form
        onSubmit={sendText}
        className="flex items-end gap-2 border-t border-border bg-background/40 px-3 py-3"
      >
        <label
          className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
          aria-label="Anexar arquivo"
        >
          <Paperclip className="size-5" />
          <input
            type="file"
            className="hidden"
            accept="image/*,audio/*,video/mp4,application/pdf"
            onChange={sendFile}
          />
        </label>
        <textarea
          ref={composerRef}
          value={text}
          rows={1}
          onChange={(e) => {
            setText(e.target.value);
            // Auto-ajuste de altura até ~5 linhas; além disso, rola por dentro.
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 130)}px`;
            typing();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendText();
            }
          }}
          onPaste={onPaste}
          placeholder="Escreva uma mensagem…"
          aria-label="Mensagem"
          className="max-h-[130px] min-h-10 flex-1 resize-none rounded-md border border-input bg-background/40 px-3.5 py-2 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 hover:border-foreground/25 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/12"
        />
        <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Enviar mensagem">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
