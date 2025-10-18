// filepath: src/features/chat/components/ChatInput.jsx
import React, { useState, useRef } from "react";

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const fileRef = useRef();

  const submit = async (e) => {
    e?.preventDefault();
    if (!text.trim() && files.length === 0) return;
    try {
      await onSend({ body: text.trim(), files });
      setText("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = null;
    } catch (e) {
      console.error("send failed", e);
    }
  };

  return (
    <form onSubmit={submit} className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex gap-2 items-center">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded-md border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
        />
        <input ref={fileRef} type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
        <button type="submit" className="bg-indigo-600 text-white px-3 py-2 rounded-md">Send</button>
      </div>
    </form>
  );
}