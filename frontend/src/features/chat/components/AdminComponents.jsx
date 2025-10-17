// filepath: src/features/chat/components/AdminComponents.jsx
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchConversations, fetchMessages, sendMessage } from "../chatSlices";
import chatServices from "../chatServices";

/**
 * Admin panel: unread counts, pulse, presence, notifications, sound toggle.
 * Pass broadcaster prop to enable real-time updates.
 */

export default function AdminChatPanel({ broadcaster = null }) {
  const dispatch = useDispatch();
  const { conversations, messages } = useSelector((s) => s.chat || { conversations: [], messages: {} });
  const [selectedUuid, setSelectedUuid] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [unreadMap, setUnreadMap] = useState({});
  const [soundOn, setSoundOn] = useState(true);
  const focusRef = useRef(true);

  useEffect(() => {
    dispatch(fetchConversations({ per_page: 50 }));
  }, [dispatch]);

  useEffect(() => {
    const onFocus = () => { focusRef.current = true; setUnreadMap({}); };
    const onBlur = () => { focusRef.current = false; };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // broadcaster subscription for admin: subscribe to staff channel or each conversation
  useEffect(() => {
    if (!broadcaster) return;
    // if backend provides a staff-level channel, use it; otherwise subscribe per conversation:
    const subs = [];
    if (broadcaster.channelName) {
      // subscribe to each conversation channel
      conversations.forEach((c) => {
        const channel = broadcaster.channelName(c.uuid);
        broadcaster.subscribe(channel);
        const handler = (payload) => {
          const msg = payload?.message || payload?.data?.message || payload?.data;
          if (!msg) return;
          setUnreadMap((prev) => {
            if (selectedUuid === c.uuid && focusRef.current) return prev;
            return { ...prev, [c.uuid]: (prev[c.uuid] || 0) + 1 };
          });
          dispatch(fetchConversations({ per_page: 50 }));
          if (selectedUuid === c.uuid) dispatch(fetchMessages({ uuid: c.uuid }));
          // notify
          if (!focusRef.current) {
            try { new Notification("New message", { body: (msg.body || "").slice(0, 120) }); } catch (e) {}
            if (soundOn) {
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = "sine";
                o.frequency.value = 700;
                o.connect(g);
                g.connect(ctx.destination);
                g.gain.setValueAtTime(0.0001, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
                o.start();
                setTimeout(() => { g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02); o.stop(ctx.currentTime + 0.03); try { ctx.close(); } catch (e) {} }, 120);
              } catch (e) {}
            }
          }
        };
        broadcaster.bind(channel, "MessageSent", handler);
        subs.push({ channel, handler });
      });
    }
    return () => {
      subs.forEach((s) => {
        try { broadcaster.unbind(s.channel, "MessageSent", s.handler); broadcaster.unsubscribe(s.channel); } catch (e) {}
      });
    };
  }, [broadcaster, conversations, selectedUuid, dispatch, soundOn]);

  useEffect(() => {
    if (selectedUuid) {
      dispatch(fetchMessages({ uuid: selectedUuid }));
      setUnreadMap((prev) => ({ ...prev, [selectedUuid]: 0 }));
    }
  }, [selectedUuid, dispatch]);

  const conversationMessages = (selectedUuid && messages && messages[selectedUuid] && messages[selectedUuid].data) || [];

  const handleSend = async () => {
    if (!selectedUuid || !messageText) return;
    try {
      await dispatch(sendMessage({ uuid: selectedUuid, body: messageText }));
      setMessageText("");
      dispatch(fetchMessages({ uuid: selectedUuid }));
    } catch (e) { console.error(e); }
  };

  const handleAssign = async (uuid) => {
    try {
      await chatServices.assignConversation(uuid);
      dispatch(fetchConversations({ per_page: 50 }));
    } catch (e) { console.error(e); }
  };

  const handleJoin = async (uuid) => {
    try {
      await chatServices.joinConversation(uuid);
      dispatch(fetchMessages({ uuid }));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex h-full">
      <div className="w-80 border-r p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold">Conversations</div>
          <div>
            <button onClick={() => setSoundOn((s) => !s)} className="text-xs px-2 py-1 border rounded">{soundOn ? "🔊" : "🔈"}</button>
          </div>
        </div>

        <div className="space-y-2 overflow-auto" style={{ maxHeight: "70vh" }}>
          {conversations.map((c) => {
            const unread = unreadMap[c.uuid] || 0;
            return (
              <div key={c.uuid} onClick={() => { setSelectedUuid(c.uuid); setUnreadMap((p) => ({ ...p, [c.uuid]: 0 })); }} className="p-2 rounded hover:bg-slate-50 cursor-pointer relative" role="button" tabIndex={0}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{c.created_by_name || c.subject || "Guest"}</div>
                    <div className="text-xs text-slate-500">{c.last_message_preview}</div>
                  </div>
                  <div className="text-xs text-slate-400">{new Date(c.last_message_at).toLocaleString()}</div>
                </div>

                <div className="flex items-center space-x-2 mt-2">
                  <button onClick={(e) => { e.stopPropagation(); handleJoin(c.uuid); }} className="text-xs px-2 py-1 border rounded">Join</button>
                  <button onClick={(e) => { e.stopPropagation(); handleAssign(c.uuid); }} className="text-xs px-2 py-1 border rounded">Assign</button>
                </div>

                {unread > 0 && (
                  <>
                    <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">{unread}</span>
                    <span className="absolute -left-1 top-4 w-3 h-3 rounded-full bg-red-400 pulse-dot" />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <div className="flex-1 overflow-auto" aria-live="polite">
          <div className="space-y-3">
            {conversationMessages.map((m) => (
              <div key={m.id} className={`flex ${m.is_staff ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[70%] p-3 rounded ${m.is_staff ? "bg-slate-100" : "bg-blue-600 text-white"}`}>
                  <div className="font-medium text-xs">{m.sender_name}</div>
                  <div className="mt-1 text-sm">{m.body}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} className="w-full p-2 border rounded" rows={3} aria-label="Reply message" />
          <div className="mt-2 flex justify-end">
            <button onClick={handleSend} className="px-3 py-2 rounded bg-blue-600 text-white">Send</button>
          </div>
        </div>
      </div>

      <style>{`
        .pulse-dot {
          box-shadow: 0 0 0 3px rgba(239,68,68,0.14);
        }
        @keyframes adminPulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.6); opacity: 0.4; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .pulse-dot::after{
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          animation: adminPulse 1.4s infinite cubic-bezier(.4,0,.2,1);
          background: rgba(239,68,68,0.14);
        }
      `}</style>
    </div>
  );
}
