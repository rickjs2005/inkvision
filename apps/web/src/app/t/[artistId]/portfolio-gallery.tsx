"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import type { PortfolioItem } from "@inkvision/core";
import {
  addCommentAction,
  getCommentsAction,
  getViewerPortfolioStateAction,
  toggleLikeAction,
} from "@/server/actions/portfolio";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Comment = { id: string; authorName: string; body: string };

// Ritmo assimétrico do mosaico — alturas variam por posição para evitar a
// grade uniforme. object-cover garante enquadramento consistente.
const RATIOS = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-square", "aspect-[4/5]", "aspect-[3/4]"];

function Item({
  item,
  index,
  isAuthed,
  initiallyLiked,
}: {
  item: PortfolioItem;
  index: number;
  isAuthed: boolean;
  initiallyLiked: boolean;
}) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(item.likesCount);
  // A página é estática — o estado do viewer chega depois, via hidratação.
  useEffect(() => setLiked(initiallyLiked), [initiallyLiked]);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [pending, startTransition] = useTransition();

  function like() {
    startTransition(async () => {
      const res = await toggleLikeAction(item.id);
      if (res.ok) {
        setLiked(res.data.liked);
        setCount(res.data.likesCount);
      }
    });
  }

  async function openComments() {
    setOpen((v) => !v);
    if (comments === null) setComments(await getCommentsAction(item.id));
  }

  async function submitComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("body") as HTMLInputElement;
    const body = input.value.trim();
    if (!body) return;
    const res = await addCommentAction(item.id, body);
    if (res.ok) {
      setComments((prev) => [...(prev ?? []), res.data]);
      input.value = "";
    }
  }

  const src = item.type === "BEFORE_AFTER" ? item.afterUrl! : item.mediaUrl;
  const ratio = RATIOS[index % RATIOS.length];

  return (
    <div className="mb-4 break-inside-avoid overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className={cn("group relative overflow-hidden", ratio)}>
        <Image
          src={src}
          alt={item.description ?? "Trabalho de tatuagem"}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {item.type === "BEFORE_AFTER" && (
          <span className="absolute left-3 top-3 rounded-[4px] border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary backdrop-blur-sm">
            Antes · Depois
          </span>
        )}
        {(item.description || item.tags.length > 0) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-background/90 via-background/40 to-transparent p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            {item.description && (
              <p className="text-sm leading-snug text-foreground">{item.description}</p>
            )}
            {item.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Régua de ações */}
      <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={like}
          disabled={!isAuthed || pending}
          aria-pressed={liked}
          title={isAuthed ? "Curtir" : "Entre para curtir"}
          className={cn("gap-1.5", liked ? "text-primary" : "text-muted-foreground")}
        >
          <Heart className={cn("size-4", liked && "fill-current")} />
          <span className="font-mono text-xs tabular-nums">{count}</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openComments}
          aria-expanded={open}
          className="gap-1.5 text-muted-foreground"
        >
          <MessageCircle className="size-4" />
          <span className="font-mono text-xs">Comentar</span>
        </Button>
      </div>

      {open && (
        <div className="flex flex-col gap-2.5 border-t border-border px-4 py-3">
          {comments?.map((c) => (
            <p key={c.id} className="text-sm leading-snug">
              <span className="font-medium">{c.authorName}</span>{" "}
              <span className="text-muted-foreground">{c.body}</span>
            </p>
          ))}
          {comments?.length === 0 && (
            <p className="font-mono text-xs text-muted-foreground">Seja o primeiro a comentar.</p>
          )}
          {isAuthed && (
            <form onSubmit={submitComment} className="mt-1 flex items-center gap-2">
              <input
                name="body"
                placeholder="Escreva um comentário…"
                aria-label="Comentário"
                className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors focus:border-primary"
              />
              <Button type="submit" size="icon" variant="ghost" aria-label="Enviar comentário">
                <Send className="size-4 text-primary" />
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function PortfolioGallery({
  items,
  artistId,
}: {
  items: PortfolioItem[];
  artistId: string;
}) {
  // A página /t é estática (ISR) — sessão e likes do viewer são carregados
  // aqui no cliente, depois da hidratação.
  const [isAuthed, setIsAuthed] = useState(false);
  const [likedIds, setLikedIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let alive = true;
    getViewerPortfolioStateAction(artistId)
      .then((state) => {
        if (!alive) return;
        setIsAuthed(state.isAuthed);
        setLikedIds(new Set(state.likedIds));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [artistId]);

  if (items.length === 0) {
    return (
      <p className="font-display text-2xl text-muted-foreground">
        Este tatuador ainda não publicou trabalhos.
      </p>
    );
  }
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {items.map((it, i) => (
        <Item key={it.id} item={it} index={i} isAuthed={isAuthed} initiallyLiked={likedIds.has(it.id)} />
      ))}
    </div>
  );
}
