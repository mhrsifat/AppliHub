// filepath: src/features/chat/pages/ChatPage.jsx
import React from "react";
import UserChatWidget from "../components/UserComponents";

/**
 * Full page chat for users (not just widget).
 * You can pass conversation uuid via props or URL param.
 */

export default function ChatPage({ uuid = null }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-8">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold mb-4">Contact Support</h1>
        <UserChatWidget uuid={uuid} compact={false} />
      </div>
    </div>
  );
}
