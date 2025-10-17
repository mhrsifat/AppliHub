// filepath: src/features/chat/useChat.js
import { useEffect, useRef, useState, useCallback } from "react";
import chatServices from "./chatServices";
import debounce from "lodash.debounce";

/**
 * useChat hook:
 * - loads messages
 * - optimistic sending + retry
 * - typing with debounce (ডিবাউনস)
 * - rate limiting (থ্রটল) for sends
 * - scroll management
 * - broadcaster integration (pusher/socket) expected interface
 *
 * Returns: { messages, loading, sendMessage, sendTyping, retrySend, scrollToBottom, typing, presence }
 */

export default function useChat(uuid, { broadcaster = null, page = 1, per_page = 50, onMessage = null, onTyping = null } = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(null);
  const [presence, setPresence] = useState({});
  const mountedRef = useRef(true);
  const lastSendAt = useRef(0);
  const sendQueue = useRef({}); // tempId -> { args, resolve, reject }
  const scrollRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load messages
  const load = useCallback(async (p = page) => {
    if (!uuid) return;
    setLoading(true);
    try {
      const res = await chatServices.listMessages(uuid, { page: p, per_page });
      if (!mountedRef.current) return;
      setMessages(res.data || []);
      // scroll to bottom after a short delay
      setTimeout(() => scrollToBottom(), 80);
    } catch (e) {
      console.error("Failed to load messages", e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [uuid, page, per_page]);

  useEffect(() => {
    if (uuid) load();
  }, [uuid, load]);

  // broadcaster subscription
  useEffect(() => {
    if (!uuid || !broadcaster || typeof broadcaster.subscribe !== "function") return;
    const channel = broadcaster.channelName ? broadcaster.channelName(uuid) : `conversation.${uuid}`;
    broadcaster.subscribe(channel);

    const onMessageEvent = (payload) => {
      const message = payload?.message || payload?.data?.message || payload?.data;
      if (!message) return;
      setMessages((cur) => [...cur, message]);
      scrollToBottom();
      if (onMessage) onMessage(message);
    };
    const onTypingEvent = (payload) => {
      setTyping(payload);
      if (onTyping) onTyping(payload);
      // clear typing after 2.5s
      setTimeout(() => setTyping(null), 2500);
    };

    broadcaster.bind(channel, "MessageSent", onMessageEvent);
    broadcaster.bind(channel, "UserTyping", onTypingEvent);

    // presence (optional) if server broadcasts presence updates
    const onPresence = (payload) => {
      setPresence(payload);
    };
    broadcaster.bind(channel, "PresenceUpdated", onPresence);

    return () => {
      try {
        broadcaster.unbind(channel, "MessageSent", onMessageEvent);
        broadcaster.unbind(channel, "UserTyping", onTypingEvent);
        broadcaster.unbind(channel, "PresenceUpdated", onPresence);
        broadcaster.unsubscribe(channel);
      } catch (e) {}
    };
  }, [uuid, broadcaster, onMessage, onTyping]);

  // scrollToBottom helper
  const scrollToBottom = useCallback((smooth = true) => {
    try {
      const el = document.getElementById("chat-scroll") || scrollRef.current;
      if (!el) return;
      if (smooth) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      else el.scrollTop = el.scrollHeight;
    } catch (e) {}
  }, []);

  // rate limit: allow send at most once per 300ms
  const canSendNow = () => {
    const now = Date.now();
    if (now - lastSendAt.current < 300) return false;
    lastSendAt.current = now;
    return true;
  };

  // sendTyping debounced
  const sendTyping = useCallback(
    debounce(async (name) => {
      if (!uuid) return;
      try {
        await chatServices.typing({ uuid, name });
      } catch (e) {}
    }, 400),
    [uuid]
  );

  // sendMessage with optimistic UI and upload progress and retry
  const sendMessage = useCallback(async ({ body = "", name, contact, attachments = [], onProgress = null } = {}) => {
    if (!uuid) throw new Error("missing uuid");
    if (!canSendNow()) throw new Error("rate_limited");

    const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const optimisticMessage = {
      _optimisticId: tempId,
      body,
      sender_name: name || "You",
      is_staff: false,
      attachments: attachments.map((f) => ({ name: f.name, size: f.size })),
      created_at: new Date().toISOString(),
      _status: "sending",
    };

    setMessages((cur) => [...cur, optimisticMessage]);

    try {
      const res = await chatServices.sendMessage({ uuid, body, name, contact, attachments, onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      } });
      // server message in res.data.data or res.data
      const serverMessage = res?.data || res;
      // replace optimistic
      setMessages((cur) => cur.map((m) => (m._optimisticId === tempId ? serverMessage : m)));
      return serverMessage;
    } catch (e) {
      // mark failed
      setMessages((cur) => cur.map((m) => (m._optimisticId === tempId ? { ...m, _status: "failed" } : m)));
      throw e;
    }
  }, [uuid]);

  const retrySend = useCallback(async (optimisticMsg, { name, contact, attachments = [], onProgress = null } = {}) => {
    // optimisticMsg contains body and temp id
    try {
      // remove failed marker before resend
      setMessages((cur) => cur.filter((m) => m._optimisticId !== optimisticMsg._optimisticId));
      const server = await sendMessage({ body: optimisticMsg.body, name, contact, attachments, onProgress });
      return server;
    } catch (e) {
      throw e;
    }
  }, [sendMessage]);

  return {
    messages,
    setMessages,
    loading,
    load,
    sendMessage,
    retrySend,
    sendTyping,
    scrollToBottom,
    typing,
    presence,
    scrollRef,
  };
}