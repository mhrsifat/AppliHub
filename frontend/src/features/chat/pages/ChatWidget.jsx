// filepath: src/features/chat/pages/ChatWidget.jsx
import React, { useEffect, useState, useCallback, memo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  startConversation,
  fetchConversation,
  sendMessage,
  clearError,
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

  // Redux state selectors
  const conversationUuid = useSelector((state) => state.chat.conversationUuid);
  const user = useSelector((state) => state.chat.user);
  const messages = useSelector((state) => state.chat.messages);
  const isTyping = useSelector((state) => state.chat.isTyping);
  const error = useSelector((state) => state.chat.error);
  const isLoading = useSelector((state) => state.chat.isLoading);

  // Debug: Log state changes
  useEffect(() => {
    console.log('ChatWidget State:', {
      conversationUuid,
      messagesCount: messages.length,
      isLoading,
      user,
      error,
      hasFetched: hasFetchedRef.current
    });
  }, [conversationUuid, messages, isLoading, user, error]);

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
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error, dispatch]);

  // Fetch conversation ONCE when conversationUuid exists and we haven't fetched yet
  useEffect(() => {
    if (conversationUuid && messages.length === 0 && !isLoading && !hasFetchedRef.current) {
      console.log('Fetching conversation once:', conversationUuid);
      hasFetchedRef.current = true;
      dispatch(fetchConversation(conversationUuid));
    }
  }, [conversationUuid, dispatch]); // Remove messages.length and isLoading from deps

  // Reset fetch flag when conversation changes
  useEffect(() => {
    if (!conversationUuid) {
      hasFetchedRef.current = false;
    }
  }, [conversationUuid]);

  // Auto open if conversation exists
  useEffect(() => {
    if (conversationUuid) {
      setIsOpen(true);
    }
  }, [conversationUuid]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Subscribe to real-time updates (Pusher)
  useChat(conversationUuid);

  // Memoized event handlers
  const handleStart = useCallback(
    async ({ name, contact, message }) => {
      console.log('Starting conversation with:', { name, contact, message });
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
      console.log('Sending message:', { conversationUuid, message, file });
      dispatch(sendMessage({ conversationUuid, message, file }));
    },
    [conversationUuid, dispatch]
  );

  const toggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleCloseError = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    dispatch(clearError());
  }, [dispatch]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  }, []);

  // Calculate unread message count
  const unreadCount = messages.length > 0 && !isOpen ? messages.length : 0;

  // Determine what to show
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
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95"
      >
        <MessageCircle size={26} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse"
            aria-label={`${unreadCount} unread messages`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Error Toast Notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-4 right-4 z-[60] bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg shadow-lg max-w-sm"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start space-x-3">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-red-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium break-words">{error}</p>
              </div>
              <button
                onClick={handleCloseError}
                className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                aria-label="Dismiss error"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-end z-50 p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-title"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full h-[100dvh] sm:w-full sm:max-w-md sm:h-[600px] bg-white dark:bg-gray-900 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />
                  </div>
                  <h2
                    id="chat-title"
                    className="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    {conversationUuid ? "Live Chat" : "Start Conversation"}
                  </h2>
                </div>
                <button
                  onClick={toggleModal}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                  aria-label="Close chat"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Content */}
              <div className="flex flex-col flex-1 overflow-hidden">
                {showLoadingState ? (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {conversationUuid ? 'Loading conversation...' : 'Starting conversation...'}
                      </p>
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
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No messages yet. Start the conversation!
                          </p>
                        </div>
                      ) : (
                        <MemoizedMessageList messages={messages} currentUser={user?.name} />
                      )}
                      {isTyping && <MemoizedTypingIndicator />}
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                      <MemoizedChatInput onSend={handleSendMessage} isLoading={isLoading} />
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