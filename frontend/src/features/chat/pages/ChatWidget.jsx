// filepath: src/features/chat/pages/ChatWidget.jsx
import React, { useEffect, useState, useCallback, memo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  startConversation,
  fetchConversation,
  sendMessage,
  clearError,
  closeConversation,
} from "../slices/chatSlice";
import { useChat } from "../hooks/useChat";
import ChatStartForm from "../components/ChatStartForm";
import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";
import TypingIndicator from "../components/TypingIndicator";
import { MessageCircle, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Memoize child components to prevent unnecessary re-renders
const MemoizedChatStartForm = memo(ChatStartForm);
const MemoizedMessageList = memo(MessageList);
const MemoizedChatInput = memo(ChatInput);
const MemoizedTypingIndicator = memo(TypingIndicator);

const ChatWidget = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const errorTimeoutRef = useRef(null);
  const hasFetchedRef = useRef(false);

  // touch handling for swipe-to-close on mobile
  const touchStartYRef = useRef(null);
  const touchMovedRef = useRef(false);

  // Redux state selectors
  const conversationUuid = useSelector((state) => state.chat.conversationUuid);
  const user = useSelector((state) => state.chat.user);
  const messages = useSelector((state) => state.chat.messages || []);
  const isTyping = useSelector((state) => state.chat.isTyping);
  const error = useSelector((state) => state.chat.error);
  const isLoading = useSelector((state) => state.chat.isLoading);
  const isSending = useSelector((state) => state.chat.isSending);

  // Debug: Log state changes
  useEffect(() => {
    console.log("ChatWidget State:", {
      conversationUuid,
      messagesCount: messages.length,
      isLoading,
      isSending,
      user,
      error,
      hasFetched: hasFetchedRef.current,
    });
  }, [conversationUuid, messages, isLoading, isSending, user, error]);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
    }
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, [error, dispatch]);

  // Fetch conversation ONCE when conversationUuid exists and we haven't fetched yet
  useEffect(() => {
    if (conversationUuid && messages.length === 0 && !isLoading && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      dispatch(fetchConversation(conversationUuid));
    }
  }, [conversationUuid, messages.length, isLoading, dispatch]);

  // Reset fetch flag when conversation changes
  useEffect(() => {
    if (!conversationUuid) {
      hasFetchedRef.current = false;
    }
  }, [conversationUuid]);

  // Auto open if conversation exists
  useEffect(() => {
    if (conversationUuid) setIsOpen(true);
  }, [conversationUuid]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  // Subscribe to real-time updates (Pusher)
  useChat(conversationUuid);

  // Memoized event handlers
  const handleStart = useCallback(
    ({ name, contact, message }) => {
      hasFetchedRef.current = false; // Reset for new conversation
      dispatch(startConversation({ name, contact, message }));
    },
    [dispatch]
  );

  const handleSendMessage = useCallback(
    ({ message, file }) => {
      if (!conversationUuid) {
        console.error("No active conversation");
        return;
      }
      dispatch(sendMessage({ conversationUuid, message, file }));
    },
    [conversationUuid, dispatch]
  );

  const toggleModal = useCallback(() => setIsOpen((p) => !p), []);

  const handleCloseError = useCallback(() => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    dispatch(clearError());
  }, [dispatch]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) setIsOpen(false);
  }, []);

  // End conversation handler (stop session)
  const handleCloseConversation = useCallback(async () => {
    if (!conversationUuid) {
      setIsOpen(false);
      return;
    }
    try {
      await dispatch(closeConversation(conversationUuid));
    } catch (err) {
      console.warn("closeConversation failed:", err);
    } finally {
      setIsOpen(false);
    }
  }, [conversationUuid, dispatch]);

  // touch handlers for swipe-to-close (mobile)
  const handleTouchStart = (e) => {
    touchMovedRef.current = false;
    if (e.touches && e.touches.length === 1) touchStartYRef.current = e.touches[0].clientY;
  };
  const handleTouchMove = () => { touchMovedRef.current = true; };
  const handleTouchEnd = (e) => {
    if (!touchStartYRef.current || !touchMovedRef.current) {
      touchStartYRef.current = null;
      touchMovedRef.current = false;
      return;
    }
    const endY = (e.changedTouches && e.changedTouches[0].clientY) || null;
    if (!endY) { touchStartYRef.current = null; touchMovedRef.current = false; return; }
    const deltaY = endY - touchStartYRef.current;
    if (deltaY > 120) setIsOpen(false);
    touchStartYRef.current = null;
    touchMovedRef.current = false;
  };

  // UI decisions
  const unreadCount = messages.length > 0 && !isOpen ? messages.length : 0;
  const showLoadingState = isLoading && messages.length === 0;
  const showStartForm = !conversationUuid && !isLoading;
  const showChatInterface = conversationUuid && !showLoadingState;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleModal}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
        className="fixed bottom-5 right-4 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
      >
        <MessageCircle size={26} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-4 right-4 z-[60] bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-lg max-w-sm">
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-red-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words">{error}</p>
              </div>
              <button onClick={handleCloseError} className="text-red-500 hover:text-red-700"><X size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleBackdropClick} className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center sm:justify-end z-50 p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="chat-title">
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-full sm:w-full sm:max-w-md sm:h-[600px] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              style={{ maxHeight: "100dvh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
                  </div>
                  <h2 id="chat-title" className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {conversationUuid ? "Live Chat" : "Start Conversation"}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg" aria-label="Close chat"><X size={20} /></button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {showLoadingState ? (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
                    </div>
                  </div>
                ) : showStartForm ? (
                  <div className="flex-1 overflow-y-auto p-4">
                    <MemoizedChatStartForm onStart={handleStart} isLoading={isLoading} />
                  </div>
                ) : showChatInterface ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500 dark:text-gray-400 text-sm">No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        <MemoizedMessageList messages={messages} currentUser={user?.name} />
                      )}
                      {isTyping && <MemoizedTypingIndicator />}
                    </div>

                    {/* ChatInput always present while a conversation exists.
                        We pass isSending to indicate send-in-progress (input stays visible). */}
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <MemoizedChatInput onSend={handleSendMessage} isLoading={isSending} />
                    </div>
                  </>
                ) : null}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(ChatWidget);