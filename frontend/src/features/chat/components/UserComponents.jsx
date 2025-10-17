// filepath: src/features/chat/components/UserComponents.jsx
import React, { useEffect, useRef, useState } from "react";
import useChat from "../useChat";
import { motion, AnimatePresence } from "framer-motion";

/**
 * User chat widget with:
 * - scroll management
 * - pulse + unread
 * - optimistic queue + retry
 * - file upload progress
 * - typing debounce (handled in useChat)
 * - accessibility attributes
 *
 * Props:
 *  - uuid, name, contact, broadcaster, theme, compact, placeholder, persistKey
 */

export default function UserChatWidget({
  uuid: propUuid = null,
  name: initialName = "",
  contact: initialContact = "",
  broadcaster = null,
  theme = {},
  compact = false,
  placeholder = "Write a message...",
  persistKey = "chat_session",
}) {
  const [open, setOpen] = useState(!compact);
  const [uuid, setUuid] = useState(propUuid);
  const [name, setName] = useState(initialName);
  const [contact, setContact] = useState(initialContact);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState([]);
  const [unread, setUnread] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [notifOn, setNotifOn] = useState(true);
  const fileRef = useRef();
  const originalTitleRef = useRef(document.title);
  const focusedRef = useRef(true);

  const { messages, sendMessage, retrySend, load, loading, typing, sendTyping, scrollToBottom } = useChat(uuid, { broadcaster });

  // persist session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const ses = JSON.parse(raw);
        if (ses.uuid && !uuid) setUuid(ses.uuid);
        if (ses.name) setName(ses.name);
        if (ses.contact) setContact(ses.contact);
      }
    } catch (e) {}
  }, [persistKey, uuid]);

  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify({ uuid, name, contact }));
    } catch (e) {}
  }, [uuid, name, contact, persistKey]);

  // focus handlers
  useEffect(() => {
    const onFocus = () => { focusedRef.current = true; setUnread(0); updateTitle(0); setPulse(false); };
    const onBlur = () => { focusedRef.current = false; };
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  const playBeep = (freq = 440, duration = 120) => {
    if (!soundOn) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      o.start();
      setTimeout(() => {
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
        o.stop(ctx.currentTime + 0.03);
        try { ctx.close(); } catch (e) {}
      }, duration);
    } catch (e) {}
  };

  const showBrowserNotification = (title, body) => {
    if (!notifOn) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") new Notification(title, { body });
    else if (Notification.permission !== "denied") Notification.requestPermission().then((perm) => {
      if (perm === "granted") new Notification(title, { body });
    });
  };

  const updateTitle = (count) => {
    if (count > 0) document.title = `(${count}) ${originalTitleRef.current}`;
    else document.title = originalTitleRef.current;
  };

  // react to incoming messages
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!open || !focusedRef.current) {
      setUnread((u) => {
        const nu = u + 1;
        updateTitle(nu);
        return nu;
      });
      setPulse(true);
      playBeep(600, 100);
      showBrowserNotification(`New message from ${last.sender_name || "Support"}`, (last.body || "").slice(0, 120));
    } else {
      playBeep(420, 90);
    }
    // scroll
    setTimeout(() => scrollToBottom(true), 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const handleSend = async () => {
    if (!input && files.length === 0) return;
    try {
      if (!uuid) {
        const { default: chatServices } = await import("../chatServices");
        const res = await chatServices.createConversation({ name, contact, subject: null, message: input, attachments: files });
        const createdUuid = res?.data?.uuid;
        if (createdUuid) setUuid(createdUuid);
        setFiles([]); setInput("");
        return;
      }

      await sendMessage({
        body: input,
        name,
        contact,
        attachments: files,
        onProgress: (p) => setUploadProgress(p),
      });

      setInput("");
      setFiles([]);
      setUploadProgress(0);
      setUnread(0); updateTitle(0); setPulse(false);
    } catch (e) {
      console.error("Send failed", e);
    }
  };

  const pushFile = (ev) => {
    const f = Array.from(ev.target.files || []);
    setFiles((cur) => [...cur, ...f]);
  };

  const retry = async (msg) => {
    try {
      // extract attachments? for simplicity pass empty attachments; you can improve by mapping
      await retrySend(msg, { name, contact });
    } catch (e) {
      console.error("Retry failed", e);
    }
  };

  const clearSession = () => {
    setUuid(null);
    setName("");
    setContact("");
    try { localStorage.removeItem(persistKey); } catch (e) {}
  };

  const styleVars = {
    "--chat-primary": theme.primary || "#2563EB",
    "--chat-bg": theme.background || "#FFFFFF",
    "--chat-text": theme.text || "#111827",
  };

  return (
    <div style={styleVars} className="fixed right-4 bottom-4 z-50" aria-live="polite">
      <AnimatePresence>
        {open ? (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="w-96 max-w-full shadow-lg rounded-xl overflow-hidden bg-white dark:bg-slate-800" role="dialog" aria-label="Chat widget">
            <div className="flex items-center justify-between p-3 border-b dark:border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[var(--chat-primary)]/20 flex items-center justify-center text-xl font-bold text-[var(--chat-primary)]">C</div>
                <div>
                  <div className="font-semibold text-sm text-[var(--chat-text)]">Support</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Typically replies within an hour</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button onClick={() => { setSoundOn((s) => !s); }} aria-pressed={soundOn} className="text-xs px-2 py-1 border rounded" title="Toggle sound">🔊</button>
                <button onClick={() => { setNotifOn((s) => !s); }} aria-pressed={notifOn} className="text-xs px-2 py-1 border rounded" title="Toggle browser notifications">🔔</button>
                <button onClick={() => { setOpen(false); setPulse(false); }} className="text-slate-500 hover:text-slate-700">Minimize</button>
                <button onClick={clearSession} className="text-xs px-2 py-1 border rounded">Start New</button>
              </div>
            </div>

            <div id="chat-scroll" className="p-3 h-72 overflow-y-auto" role="log" aria-live="polite" aria-relevant="additions" >
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={m.id || m._optimisticId || i} className={`flex ${m.is_staff ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[75%] p-2 rounded-lg ${m.is_staff ? "bg-slate-100 text-slate-900" : "bg-[var(--chat-primary)] text-white"}`}>
                      <div className="text-xs mb-1 font-medium">{m.sender_name || (m.is_staff ? "Support" : name)}</div>
                      <div className="text-sm whitespace-pre-wrap">{m.body}</div>

                      {m._status === "failed" && (
                        <div className="flex items-center space-x-2 mt-1">
                          <button onClick={() => retry(m)} className="text-xs px-2 py-1 border rounded bg-yellow-100">Retry</button>
                          <span className="text-xs text-red-500">Failed to send</span>
                        </div>
                      )}

                      {m._status === "sending" && (
                        <div className="text-xs text-slate-500 mt-1">Sending…</div>
                      )}

                      <div className="text-[10px] text-slate-400 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
              {!uuid && (
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="p-2 rounded-md border" aria-label="Your name" />
                  <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone or email" className="p-2 rounded-md border" aria-label="Phone or email" />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  value={input}
                  onChange={(e) => { setInput(e.target.value); sendTyping(name || "Guest"); }}
                  placeholder={placeholder}
                  className="flex-1 p-2 rounded-md border"
                  aria-label="Type your message"
                />
                <input type="file" multiple ref={fileRef} onChange={pushFile} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="px-3 py-2 rounded-md border" aria-label="Attach files">Attach</button>
                <button onClick={handleSend} className="px-3 py-2 rounded-md text-white" style={{ background: "var(--chat-primary)" }} aria-label="Send message">
                  Send
                </button>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-slate-200 rounded h-2">
                    <div className="h-2 rounded" style={{ width: `${uploadProgress}%`, background: "var(--chat-primary)" }} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{uploadProgress}%</div>
                </div>
              )}

              <div className="mt-2">
                {typing && <div className="text-xs text-slate-500">{typing.userName || "Someone"} is typing...</div>}
                {files.length > 0 && <div className="mt-2 text-xs text-slate-600">Attached: {files.map((f) => f.name).join(", ")}</div>}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => { setOpen(true); setUnread(0); updateTitle(0); setPulse(false); setTimeout(() => scrollToBottom(true), 120); }}
            className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white`}
            style={{ background: "var(--chat-primary)" }}
            aria-label="Open chat"
          >
            <span className={`absolute inset-0 rounded-full ${pulse ? "animate-pulse-ring" : ""}`} aria-hidden="true" />
            <span className="relative z-10">Chat</span>

            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center z-20">{unread}</span>
            )}

            <style>{`
              @keyframes pulse-ring {
                0% { transform: scale(1); opacity: 0.9; }
                50% { transform: scale(1.6); opacity: 0.4; }
                100% { transform: scale(2.2); opacity: 0; }
              }
              .animate-pulse-ring {
                box-shadow: 0 0 0 6px rgba(37,99,235,0.12);
              }
              .animate-pulse-ring::after{
                content: "";
                position: absolute;
                inset: 0;
                border-radius: 9999px;
                animation: pulse-ring 1.4s infinite cubic-bezier(.4,0,.2,1);
                background: rgba(37,99,235,0.12);
              }
            `}</style>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
