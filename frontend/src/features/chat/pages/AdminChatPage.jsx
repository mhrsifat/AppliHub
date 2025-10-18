// filepath: src/features/chat/pages/AdminChatPage.jsx
import React from "react";
import AdminChatPanel from "@/features/chat/components/AdminComponents";
import { createPusherBroadcaster } from "@/features/chat/broadcaster/pusherBroadcaster";
import useTokenListener from "@/features/chat/useTokenListener";


/**
 * Admin page wrapper. Drop this into your admin router.
 */

export default function AdminChatPage() {
  const authHeader = useTokenListener();

  const pb = useMemo(() => {
    if (!authHeader) return null;
    return createPusherBroadcaster({
      key: import.meta.env.VITE_PUSHER_KEY,
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
      authHeaders: { Authorization: authHeader },
    });
  }, [authHeader]);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="container mx-auto bg-white dark:bg-slate-800 rounded shadow p-4">
        <h1 className="text-xl font-bold mb-4">Admin Chat</h1>
        <AdminChatPanel broadcaster={pb} />
      </div>
    </div>
  );
}
