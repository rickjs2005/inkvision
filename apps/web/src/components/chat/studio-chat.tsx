"use client";

import type { ChatMessage, SendMessageInput } from "@inkvision/core";
import { sendStudioMessageAction, markReadStudioAction } from "@/server/actions/chat";
import { ChatPanel } from "./chat-panel";

export function StudioChat({
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
      onSend={(input: SendMessageInput) => sendStudioMessageAction(studioId, orderId, input)}
      onMarkRead={() => markReadStudioAction(studioId, orderId)}
    />
  );
}
