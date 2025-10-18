// filepath: src/features/chat/components/ChatWidgetButton.jsx
import React from "react";

export default function ChatWidgetButton({ onClick, open }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open chat"
      className="fixed right-4 bottom-4 z-50 bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl focus:outline-none"
    >
      {open ? "×" : "Chat"}
    </button>
  );
}