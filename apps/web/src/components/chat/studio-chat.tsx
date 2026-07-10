"use client";

import type { ChatMessage, SendMessageInput } from "@inkvision/core";
import {
  loadOlderStudioMessagesAction,
  markReadStudioAction,
  sendStudioMessageAction,
} from "@/server/actions/chat";
import { ChatPanel } from "./chat-panel";

export function StudioChat({
  orderId,
  studioId,
  currentUserId,
  roomToken,
  studioPhone,
  initialMessages,
  initialHasMore = false,
}: {
  orderId: string;
  studioId: string;
  currentUserId: string;
  roomToken: string;
  /** Telefone do estúdio — habilita o fallback pro WhatsApp no cabeçalho do chat. */
  studioPhone?: string | null;
  initialMessages: ChatMessage[];
  initialHasMore?: boolean;
}) {
  return (
    <ChatPanel
      currentUserId={currentUserId}
      studioId={studioId}
      roomToken={roomToken}
      studioPhone={studioPhone}
      initialMessages={initialMessages}
      initialHasMore={initialHasMore}
      onSend={(input: SendMessageInput) => sendStudioMessageAction(studioId, orderId, input)}
      onMarkRead={() => markReadStudioAction(studioId, orderId)}
      onLoadOlder={(beforeId) => loadOlderStudioMessagesAction(studioId, orderId, beforeId)}
    />
  );
}
