// filepath: src/features/chat/components/ChatWidget.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ChatWidgetButton from "./ChatWidgetButton";
import ChatWidgetPanel from "./ChatWidgetPanel";

export default function ChatWidget({
  position = "bottom-right",
  defaultOpen = false,
  apiBase = "/api",
}) {
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("chat:widget:open");
      return saved ? JSON.parse(saved) : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  // persist open state
  useEffect(() => {
    try {
      localStorage.setItem("chat:widget:open", JSON.stringify(open));
    } catch {}
  }, [open]);

  // ensure root div exists for portal
  useEffect(() => {
    let node = document.getElementById("chat-widget-root");
    if (!node) {
      node = document.createElement("div");
      node.id = "chat-widget-root";
      document.body.appendChild(node);
    }
  }, []);

  const panel = (
    <div
      className={`fixed z-50 p-4 ${
        position === "bottom-right" ? "right-4 bottom-4" : "left-4 bottom-4"
      }`}
    >
      <div className="flex flex-col items-end">
        {open && <ChatWidgetPanel onClose={() => setOpen(false)} apiBase={apiBase} />}
        <ChatWidgetButton onClick={() => setOpen((o) => !o)} open={open} />
      </div>
    </div>
  );

  return createPortal(panel, document.getElementById("chat-widget-root"));
}