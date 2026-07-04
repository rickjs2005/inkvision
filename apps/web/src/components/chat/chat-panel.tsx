"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { io, type Socket } from "socket.io-client";
import { Paperclip, Send } from "lucide-react";
import type { ChatMessage, SendMessageInput } from "@inkvision/core";
import { RT } from "@inkvision/shared";
import { uploadFile } from "@/lib/upload";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/server/action-result";

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000";

function kindFromMime(mime: string): SendMessageInput["kind"] {
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (mime.startsWith("video/")) return "VIDEO";
  return "PDF";
}

export function ChatPanel({
  currentUserId,
  studioId,
  roomToken,
  initialMessages,
  onSend,
  onMarkRead,
}: {
  currentUserId: string;
  studioId: string;
  roomToken: string;
  initialMessages: ChatMessage[];
  onSend: (input: SendMessageInput) => Promise<ActionResult<ChatMessage>>;
  onMarkRead: () => Promise<{ ok: boolean }>;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const seen = useRef(new Set(initialMessages.map((m) => m.id)));

  function append(m: ChatMessage) {
    if (seen.current.has(m.id)) return;
    seen.current.add(m.id);
    setMessages((prev) => [...prev, m]);
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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, peerTyping]);

  async function submit(input: SendMessageInput) {
    setBusy(true);
    try {
      const res = await onSend(input);
      if (res.ok) append(res.data);
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
    } catch {
      /* erro de upload ignorado no dev */
    } finally {
      setBusy(false);
    }
  }

  function typing() {
    socketRef.current?.emit(RT.TYPING);
  }

  return (
    <div className="flex h-[520px] flex-col rounded-xl border border-border">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                  mine ? "bg-primary text-primary-foreground" : "bg-muted",
                )}
              >
                {!mine && <p className="mb-0.5 text-xs opacity-70">{m.senderName}</p>}
                {m.kind === "TEXT" && <p className="whitespace-pre-wrap">{m.body}</p>}
                {m.kind === "IMAGE" && m.attachmentUrl && (
                  <Image src={m.attachmentUrl} alt="anexo" width={220} height={220} className="rounded-lg" />
                )}
                {m.kind === "AUDIO" && m.attachmentUrl && (
                  <audio controls src={m.attachmentUrl} className="max-w-[220px]" />
                )}
                {m.kind === "VIDEO" && m.attachmentUrl && (
                  <video controls src={m.attachmentUrl} className="max-w-[240px] rounded-lg" />
                )}
                {m.kind === "PDF" && m.attachmentUrl && (
                  <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="underline">
                    Abrir PDF
                  </a>
                )}
                {mine && (
                  <span className="mt-0.5 block text-right text-[10px] opacity-70">
                    {m.readAt ? "✓✓ lido" : "✓ enviado"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {peerTyping && <p className="text-xs text-muted-foreground">digitando…</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendText} className="flex items-center gap-2 border-t border-border p-3">
        <label className="cursor-pointer text-muted-foreground hover:text-foreground">
          <Paperclip className="size-5" />
          <input type="file" className="hidden" accept="image/*,audio/*,video/mp4,application/pdf" onChange={sendFile} />
        </label>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            typing();
          }}
          placeholder="Escreva uma mensagem…"
          className="h-10 flex-1 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="icon" disabled={busy}>
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
