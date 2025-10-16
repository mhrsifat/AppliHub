// filepath: src/features/chat/hooks/useTyping.js
import { useCallback, useRef } from "react";
import chatService from "../services/chatService";

export const useTyping = (conversationId, userName) => {
  const typingTimeoutRef = useRef(null);
  const lastTypingTimeRef = useRef(0);

  const sendTypingIndicator = useCallback(() => {
    if (!conversationId) return;

    const now = Date.now();
    // Throttle: only send typing indicator every 3 seconds
    if (now - lastTypingTimeRef.current < 3000) return;

    lastTypingTimeRef.current = now;

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing event. If server returns 404 for a UUID, try to fetch
    // the conversation (to get numeric id) and retry.
    chatService.sendTyping(conversationId, userName).catch(async (err) => {
      // If 404 and conversationId looks like a UUID, attempt fallback
      const isUuid =
        typeof conversationId === "string" &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
          conversationId
        );
      if (err?.response?.status === 404 && isUuid) {
        try {
          const res = await chatService.getConversation(conversationId);
          const numericId = res.data?.id || res.id || null;
          if (numericId) {
            await chatService.sendTyping(numericId, userName);
            return;
          }
        } catch (innerErr) {
          console.error(
            "Failed to resolve conversation by uuid for typing fallback:",
            innerErr
          );
        }
      }

      console.error("Failed to send typing indicator:", err);
    });

    // Set timeout to stop sending after user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      lastTypingTimeRef.current = 0;
    }, 3000);
  }, [conversationId, userName]);

  return { sendTypingIndicator };
};
