"use client";

import type { ChatMessage, SendMessageInput } from "@inkvision/core";
import { sendClientMessageAction, markReadClientAction } from "@/server/actions/chat";
import { ChatPanel } from "./chat-panel";

export function ClientChat({
  orderId,
  studioId,
  currentUserId,
  roomToken,
  initialMessages,
}: {
  orderId: string;
  studioId: string;
  currentUserId: string;
  roomToken: string;
  initialMessages: ChatMessage[];
}) {
  return (
    <ChatPanel
      currentUserId={currentUserId}
      studioId={studioId}
      roomToken={roomToken}
      initialMessages={initialMessages}
      onSend={(input: SendMessageInput) => sendClientMessageAction(orderId, input)}
      onMarkRead={() => markReadClientAction(orderId)}
    />
  );
}
