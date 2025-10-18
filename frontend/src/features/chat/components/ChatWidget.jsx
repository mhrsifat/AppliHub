// filepath: src/features/chat/components/ChatWidget.jsx
import React, { useEffect, useState } from "react";
import ChatWidgetButton from "./ChatWidgetButton";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import useChat from "../hooks/useChat";
import { useDispatch } from "react-redux";
import { createOrResumeConversation } from "../slices/chatSlice";

export default function ChatWidget({ position = "bottom-right" }) {
  const [open, setOpen] = useState(false);
  const [initMode, setInitMode] = useState(false);
  const [name, setName] = useState(localStorage.getItem("chat_name") || "");
  const [contact, setContact] = useState(localStorage.getItem("chat_contact") || "");
  const dispatch = useDispatch();
  const { conversation, messages, typing, loadMessages, sendMessage } = useChat();

  useEffect(() => {
    const uuid = localStorage.getItem("chat_uuid");
    if (uuid) {
      dispatch(createOrResumeConversation({ existingUuid: uuid })).then((r) => {
        const conv = r?.payload?.conversation;
        if (conv?.uuid) {
          localStorage.setItem("chat_uuid", conv.uuid);
          loadMessages(conv.uuid);
        }
      });
    }
  }, []);

  const start = async (e) => {
    e.preventDefault();
    // store and create conversation
    localStorage.setItem("chat_name", name);
    localStorage.setItem("chat_contact", contact);
    const res = await dispatch(createOrResumeConversation({ name, contact }));
    const conv = res?.payload?.conversation;
    if (conv?.uuid) {
      localStorage.setItem("chat_uuid", conv.uuid);
      loadMessages(conv.uuid);
      setInitMode(false);
      setOpen(true);
    }
  };

  const handleSend = async ({ body, files }) => {
    const uuid = conversation?.uuid || localStorage.getItem("chat_uuid");
    if (!uuid) throw new Error("no conversation");
    await sendMessage({ uuid, body, files });
  };

  return (
    <>
      <ChatWidgetButton open={open} onClick={() => setOpen((s) => !s)} />
      {open && (
        <div className="fixed right-4 bottom-16 w-80 max-h-[70vh] flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
          {!conversation && (
            <div className="p-4">
              <h3 className="text-lg font-semibold">Start chat</h3>
              <form onSubmit={start} className="mt-3 space-y-2">
                <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" className="w-full px-2 py-2 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"/>
                <input value={contact} onChange={(e)=>setContact(e.target.value)} placeholder="Email or phone" className="w-full px-2 py-2 rounded border dark:border-gray-700 bg-gray-50 dark:bg-gray-900"/>
                <div className="flex justify-end">
                  <button className="bg-indigo-600 text-white px-3 py-1 rounded">Start</button>
                </div>
              </form>
            </div>
          )}
          {conversation && (
            <>
              <div className="p-3 border-b dark:border-gray-700">
                <div className="text-sm font-medium">Conversation</div>
                <div className="text-xs text-gray-500">UUID: {conversation.uuid}</div>
              </div>
              <MessageList messages={messages} typing={typing} />
              <ChatInput onSend={handleSend} />
            </>
          )}
        </div>
      )}
    </>
  );
}