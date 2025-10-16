// filepath: src/features/chat/pages/AdminPage.jsx
import React, { useState, useEffect } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import ConversationList from "../components/ConversationList";
import MessageList from "../components/MessageList";
import MessageComposer from "../components/MessageComposer";
import { useChat } from "../hooks/useChat";
import chatService from "../services/chatService";

const AdminPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [staffInfo, setStaffInfo] = useState({ isStaff: true });

  const {
    messages,
    loading,
    sending,
    error,
    typingUsers,
    sendMessage,
    loadMore,
    hasMore,
  } = useChat(selectedConversation?.uuid, staffInfo);

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);

    // Optionally join the conversation when selected
    try {
      await chatService.joinConversation(conversation.uuid);
    } catch (error) {
      console.error("Failed to join conversation:", error);
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedConversation) return;

    try {
      await chatService.assignConversation(selectedConversation.uuid);
      alert("Conversation assigned to you");
    } catch (error) {
      console.error("Failed to assign conversation:", error);
      alert("Failed to assign conversation");
    }
  };

  const handleSendMessage = async (messageData) => {
    await sendMessage(messageData);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Support Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Manage customer conversations
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation list sidebar */}
        <div className="w-96 flex-shrink-0">
          <ConversationList
            activeConversationId={selectedConversation?.uuid}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.created_by_name || "Anonymous"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedConversation.created_by_contact}
                  </p>
                  {selectedConversation.subject && (
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Subject:</span>{" "}
                      {selectedConversation.subject}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAssignToMe}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <UserCheck className="w-4 h-4" />
                    Assign to Me
                  </button>
                </div>
              </div>

              {/* Messages */}
              <MessageList
                messages={messages}
                loading={loading}
                typingUsers={typingUsers}
                hasMore={hasMore}
                onLoadMore={loadMore}
                currentUserContact={null}
              />

              {/* Message composer */}
              <MessageComposer
                onSend={handleSendMessage}
                sending={sending}
                conversationId={selectedConversation.id}
                userName="Support Team"
                placeholder="Type your reply..."
              />
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No conversation selected
                </h3>
                <p className="text-gray-600">
                  Select a conversation from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
