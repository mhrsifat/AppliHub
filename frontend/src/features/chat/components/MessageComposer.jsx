// filepath: src/features/chat/components/MessageComposer.jsx
import React, { useState, useRef } from "react";
import { Send, Paperclip, Smile, Loader2 } from "lucide-react";
import { useTyping } from "../hooks/useTyping";
import { useUpload } from "../hooks/useUpload";
import AttachmentPreview from "./AttachmentPreview";

const MessageComposer = ({
  onSend,
  sending = false,
  conversationId,
  userName,
  disabled = false,
  placeholder = "Type your message...",
}) => {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const { sendTypingIndicator } = useTyping(conversationId, userName);
  const {
    files,
    previews,
    addFiles,
    removeFile,
    clearAll,
    formatFileSize,
    errors,
  } = useUpload();

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if ((!message.trim() && files.length === 0) || sending) return;

    const messageData = {
      body: message.trim(),
      attachments: files,
    };

    try {
      console.log("MessageComposer: sending", messageData);
      await onSend(messageData);
      setMessage("");
      clearAll();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    sendTypingIndicator();

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      await addFiles(selectedFiles);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Error messages */}
      {errors.length > 0 && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100">
          {errors.map((error, idx) => (
            <p key={idx} className="text-xs text-red-600">
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Attachment previews */}
      <AttachmentPreview
        previews={previews}
        onRemove={removeFile}
        formatFileSize={formatFileSize}
      />

      {/* Input area */}
      <div className="flex items-end gap-2 p-4">
        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || sending}
            placeholder={placeholder}
            rows={1}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
            style={{ maxHeight: "120px" }}
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            disabled || sending || (!message.trim() && files.length === 0)
          }
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          title="Send message"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageComposer;
