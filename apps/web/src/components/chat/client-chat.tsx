"use client";

import type { ChatMessage, SendMessageInput } from "@inkvision/core";
import {
  loadOlderClientMessagesAction,
  markReadClientAction,
  sendClientMessageAction,
} from "@/server/actions/chat";
import { ChatPanel } from "./chat-panel";

export function ClientChat({
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
      onSend={(input: SendMessageInput) => sendClientMessageAction(orderId, input)}
      onMarkRead={() => markReadClientAction(orderId)}
      onLoadOlder={(beforeId) => loadOlderClientMessagesAction(orderId, beforeId)}
    />
  );
}
