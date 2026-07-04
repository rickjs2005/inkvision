"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Heart, MessageCircle } from "lucide-react";
import type { PortfolioItem } from "@inkvision/core";
import {
  addCommentAction,
  getCommentsAction,
  toggleLikeAction,
} from "@/server/actions/portfolio";
import { cn } from "@/lib/utils";

type Comment = { id: string; authorName: string; body: string };

function Item({ item, isAuthed }: { item: PortfolioItem; isAuthed: boolean }) {
  const [liked, setLiked] = useState(!!item.likedByViewer);
  const [count, setCount] = useState(item.likesCount);
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

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Image
        src={src}
        alt={item.description ?? "Trabalho"}
        width={500}
        height={500}
        className="aspect-square w-full object-cover"
      />
      <div className="flex flex-col gap-2 p-3">
        {item.description && <p className="text-sm">{item.description}</p>}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <span key={t} className="text-xs text-muted-foreground">
                #{t}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={like}
            disabled={!isAuthed || pending}
            className={cn("flex items-center gap-1", liked ? "text-primary" : "text-muted-foreground")}
            title={isAuthed ? "Curtir" : "Entre para curtir"}
          >
            <Heart className={cn("size-4", liked && "fill-current")} />
            {count}
          </button>
          <button
            type="button"
            onClick={openComments}
            className="flex items-center gap-1 text-muted-foreground"
          >
            <MessageCircle className="size-4" />
            Comentários
          </button>
        </div>

        {open && (
          <div className="flex flex-col gap-2 border-t border-border pt-2">
            {comments?.map((c) => (
              <p key={c.id} className="text-sm">
                <span className="font-medium">{c.authorName}:</span> {c.body}
              </p>
            ))}
            {comments?.length === 0 && (
              <p className="text-xs text-muted-foreground">Seja o primeiro a comentar.</p>
            )}
            {isAuthed && (
              <form onSubmit={submitComment} className="flex gap-2">
                <input
                  name="body"
                  placeholder="Escreva um comentário…"
                  className="h-9 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
                />
                <button type="submit" className="text-sm text-primary">
                  Enviar
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function PortfolioGallery({
  items,
  isAuthed,
}: {
  items: PortfolioItem[];
  isAuthed: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">Este tatuador ainda não publicou trabalhos.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <Item key={it.id} item={it} isAuthed={isAuthed} />
      ))}
    </div>
  );
}
