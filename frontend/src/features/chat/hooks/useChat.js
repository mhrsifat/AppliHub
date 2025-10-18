// filepath: src/features/chat/hooks/useChat.js
import { useEffect, useRef, useState, useCallback } from "react";
import Pusher from "pusher-js";
import { useDispatch, useSelector } from "react-redux";
import {
  addMessage,
  setTyping,
  clearTyping,
  optimisticAdd,
  removeMessageByTempId,
  replaceMessage,
  setConversation,
} from "../slices/chatSlice";
import { getMessages, sendMessage as apiSend } from "../services/widgetService";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || "ap1";

export default function useChat() {
  const dispatch = useDispatch();
  const { conversation, messages, typing } = useSelector((s) => s.chat);
  const pusherRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!PUSHER_KEY) return;
    pusherRef.current = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: `${import.meta.env.VITE_API_BASE}/broadcasting/auth`,
      auth: { withCredentials: true },
    });

    pusherRef.current.connection.bind("connected", () => setConnected(true));
    pusherRef.current.connection.bind("disconnected", () => setConnected(false));

    return () => {
      try {
        pusherRef.current.disconnect();
      } catch (e) {}
    };
  }, []);

  const subscribeToConversation = useCallback((uuid) => {
    if (!pusherRef.current || !uuid) return;
    const chName = `conversation.${uuid}`;
    const ch = pusherRef.current.subscribe(chName);
    ch.bind("MessageSent", (data) => {
      if (data?.message) dispatch(addMessage(data.message));
    });
    ch.bind("UserTyping", (data) => {
      dispatch(setTyping({ [data.userName || "user"]: true }));
      // clear after short delay
      setTimeout(() => dispatch(clearTyping()), 1500);
    });
    ch.bind("UserTypingStopped", () => dispatch(clearTyping()));
  }, [dispatch]);

  const loadMessages = useCallback(
    async (uuid) => {
      const res = await getMessages(uuid);
      dispatch(setConversation({ uuid }));
      if (res?.data?.data) {
        // messages API returns array
        // normalize if needed
        res.data.data.forEach((m) => dispatch(addMessage(m)));
      }
      subscribeToConversation(uuid);
    },
    [dispatch, subscribeToConversation]
  );

  const sendMessage = useCallback(
    async ({ uuid, body, files = [], onProgress }) => {
      // optimistic id
      const tempId = `t_${Date.now()}`;
      const optimisticMsg = {
        id: null,
        temp_id: tempId,
        body,
        attachments: files.map((f) => ({ filename: f.name, url: URL.createObjectURL(f), temp: true })),
        created_at: new Date().toISOString(),
        is_pending: true,
        sender_name: "You",
      };
      dispatch(optimisticAdd(optimisticMsg));

      try {
        const res = await apiSend(uuid, body, files, (ev) => {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          if (typeof onProgress === "function") onProgress(pct);
        });
        if (res?.data?.data) {
          // replace optimistic with real message
          dispatch(replaceMessage({ ...res.data.data, temp_id: tempId }));
        }
      } catch (err) {
        // remove optimistic
        dispatch(removeMessageByTempId(tempId));
        throw err;
      }
    },
    [dispatch]
  );

  return {
    conversation,
    messages,
    typing,
    connected,
    loadMessages,
    subscribeToConversation,
    sendMessage,
    pusher: pusherRef.current,
  };
}