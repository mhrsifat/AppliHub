// filepath: src/features/chat/pages/AdminChatDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { listConversations, getConversationDetail, postAdminMessage, closeConversation, addInternalNote, deleteMessage } from "../services/adminService";
import Pusher from "pusher-js";
import { addMessage } from "../slices/chatSlice";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY;
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || "ap1";

export default function AdminChatDashboard() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const pusherRef = useRef(null);

  useEffect(() => {
    (async () => {
      const res = await listConversations({ per_page: 50 });
      setConversations(res.data.data || []);
    })();
  }, []);

  useEffect(() => {
    if (!PUSHER_KEY) return;
    pusherRef.current = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: `${import.meta.env.VITE_API_BASE}/broadcasting/auth`,
      auth: { withCredentials: true },
    });

    return () => {
      try { pusherRef.current.disconnect(); } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (!selected || !pusherRef.current) return;
    const ch = pusherRef.current.subscribe(`conversation.${selected.uuid}`);
    ch.bind("MessageSent", (d) => {
      setMessages((m) => [...m, d.message]);
    });
    ch.bind("UserTyping", (d) => {
      // optional: handle typing indicator
    });
    return () => {
      try { pusherRef.current.unsubscribe(`conversation.${selected.uuid}`); } catch (e) {}
    };
  }, [selected]);

  const openConv = async (conv) => {
    setSelected(conv);
    const res = await getConversationDetail(conv.uuid);
    setMessages(res.data.data?.messages || []);
  };

  const sendReply = async () => {
    if (!selected) return;
    await postAdminMessage(selected.uuid, reply);
    setReply("");
    // message will arrive via pusher; optionally append immediately:
    // setMessages((m)=>[...m, { body: reply, created_at: new Date().toISOString(), sender_name: "Admin" }]);
  };

  const submitNote = async () => {
    if (!selected) return;
    await addInternalNote(selected.uuid, note);
    setNote("");
    // refresh details
    const res = await getConversationDetail(selected.uuid);
    setMessages(res.data.data?.messages || []);
  };

  const handleClose = async () => {
    if (!selected) return;
    await closeConversation(selected.uuid);
    // update list
    const res = await listConversations();
    setConversations(res.data.data || []);
  };

  const handleDeleteMessage = async (id) => {
    if (!confirm("Delete message?")) return;
    await deleteMessage(id);
    setMessages((ms) => ms.filter((m)=>m.id !== id));
  };

  return (
    <div className="flex gap-4 p-4 h-full">
      <aside className="w-80 border-r dark:border-gray-700">
        <h3 className="font-semibold mb-2">Conversations</h3>
        <div className="space-y-2 overflow-auto max-h-[70vh]">
          {conversations.map((c) => (
            <div key={c.uuid} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={()=>openConv(c)}>
              <div className="text-sm font-medium">{c.created_by_name || c.created_by_contact}</div>
              <div className="text-xs text-gray-500">{c.last_message_preview}</div>
              <div className="text-xs text-gray-400">{c.status}</div>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        {!selected ? <div className="p-4">Select a conversation</div> :
        <>
          <header className="p-3 border-b dark:border-gray-700 flex items-center justify-between">
            <div>
              <div className="font-semibold">{selected.created_by_name || selected.created_by_contact}</div>
              <div className="text-xs text-gray-500">UUID: {selected.uuid}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleClose} className="px-3 py-1 rounded bg-red-500 text-white">Close</button>
              <button onClick={()=>{}} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">Assign</button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-3 space-y-3 bg-white dark:bg-gray-900">
            {messages.map((m)=>(
              <div key={m.id} className={`p-2 rounded ${m.is_note ? "bg-yellow-50 dark:bg-yellow-900" : m.is_staff ? "bg-indigo-50 dark:bg-indigo-900" : "bg-gray-100 dark:bg-gray-700"}`}>
                <div className="text-sm">{m.body}</div>
                <div className="text-xs text-gray-500 flex items-center justify-between mt-1">
                  <span>{m.sender_name || m.created_by_name}</span>
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                {!m.is_note && <div className="mt-1"><button onClick={()=>handleDeleteMessage(m.id)} className="text-xs text-red-500">Delete</button></div>}
              </div>
            ))}
          </div>

          <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex gap-2">
              <input value={reply} onChange={(e)=>setReply(e.target.value)} className="flex-1 px-3 py-2 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900" placeholder="Type reply..." />
              <button onClick={sendReply} className="px-3 py-2 bg-indigo-600 text-white rounded">Send</button>
            </div>

            <div className="mt-3">
              <textarea value={note} onChange={(e)=>setNote(e.target.value)} className="w-full p-2 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900" placeholder="Internal note (staff only)"></textarea>
              <div className="flex justify-end mt-2">
                <button onClick={submitNote} className="px-3 py-1 bg-green-600 text-white rounded">Add Note</button>
              </div>
            </div>
          </div>
        </>}
      </main>
    </div>
  );
}