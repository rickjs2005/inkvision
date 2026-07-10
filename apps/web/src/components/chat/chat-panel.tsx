"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { io, type Socket } from "socket.io-client";
import { AlertCircle, Check, CheckCheck, Paperclip, Send } from "lucide-react";
import type { ChatMessage, SendMessageInput } from "@inkvision/core";
import { RT } from "@inkvision/shared";
import { uploadFile } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { WhatsAppLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [peerTyping, setPeerTyping] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const flowRef = useRef<HTMLDivElement | null>(null);
  // Ao PREPENDER histórico, o auto-scroll pro fim deve ficar quieto.
  const skipAutoScroll = useRef(false);
  // Primeira rolagem (montagem com histórico existente) é instantânea; as seguintes, suaves.
  const didMountScroll = useRef(false);
  const seen = useRef(new Set(initialMessages.map((m) => m.id)));

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
    // Rola apenas o contêiner do chat — nunca a janela. Na montagem (histórico já
    // existente) o salto é instantâneo; mensagens novas depois disso animam suavemente.
    const behavior: ScrollBehavior = didMountScroll.current ? "smooth" : "auto";
    didMountScroll.current = true;
    flow.scrollTo({ top: flow.scrollHeight, behavior });
  }, [messages.length, peerTyping]);

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

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    await submit({ kind: "TEXT", body });
  }

  async function sendFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
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
    }
  }

  function typing() {
    socketRef.current?.emit(RT.TYPING);
  }

  return (
    <div className="flex h-[min(60vh,32rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-ink)]">
      {/* Cabeçalho — identificação da conversa + fallback de WhatsApp */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <span className="inline-flex items-center gap-2 eyebrow">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
          Conversa do pedido
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
      <div ref={flowRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
        {hasMore && onLoadOlder && (
          <div className="flex justify-center">
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
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={cn("flex gap-2.5", mine ? "justify-end" : "justify-start")}>
              {!mine && (
                <span
                  aria-hidden
                  className="mt-auto flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-secondary font-mono text-[11px] font-medium text-secondary-foreground"
                >
                  {initial(m.senderName)}
                </span>
              )}

              <div className={cn("flex max-w-[78%] flex-col gap-1", mine ? "items-end" : "items-start")}>
                {!mine && <span className="eyebrow text-[10px] leading-none">{m.senderName}</span>}

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
                  {m.kind === "TEXT" && <p className="whitespace-pre-wrap">{m.body}</p>}
                  {m.kind === "IMAGE" && m.attachmentUrl && (
                    <Image
                      src={m.attachmentUrl}
                      alt="anexo"
                      width={220}
                      height={220}
                      className="rounded-lg"
                    />
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

                {/* Meta — horário e recibo de leitura */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-1 font-mono text-[11px] text-muted-foreground",
                    mine ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <span>{formatTime(m.createdAt)}</span>
                  {mine && m.failed && (
                    <span className="inline-flex items-center gap-1 text-destructive">
                      <AlertCircle className="size-3.5" aria-hidden />
                      Falha ao enviar
                    </span>
                  )}
                  {mine && !m.failed && !m.pending && (
                    m.readAt ? (
                      <CheckCheck className="size-3.5 text-primary" aria-label="Lido" />
                    ) : (
                      <Check className="size-3.5" aria-label="Enviado" />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {peerTyping && (
          <div className="flex justify-start gap-2.5">
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

      {/* Barra de composição */}
      <form
        onSubmit={sendText}
        className="flex items-center gap-2 border-t border-border bg-background/40 px-3 py-3"
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
        <Input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            typing();
          }}
          placeholder="Escreva uma mensagem…"
          aria-label="Mensagem"
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={busy} aria-label="Enviar mensagem">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
