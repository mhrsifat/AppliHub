// filepath: src/features/chat/components/MessageList.jsx
import React, { useEffect, useRef } from "react";

export default function MessageList({ messages, typing }) {
  const endRef = useRef();
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  return (
    <div className="flex-1 overflow-auto p-3 space-y-3">
      {messages.map((m) => (
        <div key={m.id || m.temp_id} className={`max-w-[85%] ${m.sender_user_id ? "ml-auto bg-indigo-100 dark:bg-indigo-900" : "bg-gray-100 dark:bg-gray-700"} rounded-md p-2`}>
          <div className="text-sm whitespace-pre-wrap">{m.body}</div>
          {m.attachments?.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {m.attachments.map((a, idx) => (
                <a key={idx} href={a.url} target="_blank" rel="noreferrer" className="text-xs underline">
                  {a.filename || "attachment"}
                </a>
              ))}
            </div>
          )}
          <div className="text-xs text-gray-500 mt-1">{new Date(m.created_at).toLocaleString()}</div>
        </div>
      ))}

      {typing && <div className="text-sm text-gray-500">typing…</div>}
      <div ref={endRef} />
    </div>
  );
}