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
  initialMessages,
  initialHasMore = false,
}: {
  orderId: string;
  studioId: string;
  currentUserId: string;
  roomToken: string;
  initialMessages: ChatMessage[];
  initialHasMore?: boolean;
}) {
  return (
    <ChatPanel
      currentUserId={currentUserId}
      studioId={studioId}
      roomToken={roomToken}
      initialMessages={initialMessages}
      initialHasMore={initialHasMore}
      onSend={(input: SendMessageInput) => sendClientMessageAction(orderId, input)}
      onMarkRead={() => markReadClientAction(orderId)}
      onLoadOlder={(beforeId) => loadOlderClientMessagesAction(orderId, beforeId)}
    />
  );
}
