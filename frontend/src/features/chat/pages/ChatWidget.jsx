// filepath: src/features/chat/components/ChatWidget.jsx
import React, { useEffect, useState, useCallback, useRef, memo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  startConversation,
  fetchConversation,
  fetchConversationMessages,
  sendMessage,
  clearError,
  resetChat,
} from "../slices/chatSlice";
import { useChat } from "../hooks/useChat";
import ChatStartForm from "../components/ChatStartForm";
import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";
import TypingIndicator from "../components/TypingIndicator";
import { MessageCircle, X, AlertCircle, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ChatWidget = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const errorTimeoutRef = useRef(null);
  const fetchedOnceRef = useRef(false);
  const modalRef = useRef(null);

  // Redux state - add debugging
  const conversationUuid = useSelector((s) => s.chat.conversationUuid);
  const user = useSelector((s) => s.chat.user);
  const messages = useSelector((s) => s.chat.messages);
  const isTyping = useSelector((s) => s.chat.isTyping);
  const error = useSelector((s) => s.chat.error);
  const isLoading = useSelector((s) => s.chat.isLoading);

  // Debug Redux state
  useEffect(() => {
    console.log('🔄 ChatWidget Redux State:', {
      conversationUuid,
      user,
      messagesCount: messages.length,
      messages,
      isTyping,
      error,
      isLoading
    });
  }, [conversationUuid, user, messages, isTyping, error, isLoading]);

  // hook: realtime
  useChat(conversationUuid);

  // auto-open if there is an ongoing conversation
  useEffect(() => {
    if (conversationUuid) {
      setIsOpen(true);
    }
  }, [conversationUuid]);

  // fetch conversation and messages when opening
  useEffect(() => {
    if (isOpen && conversationUuid && !isLoading && !fetchedOnceRef.current) {
      fetchedOnceRef.current = true;
      console.log('Fetching conversation and messages...');
      
      // First fetch conversation details, then fetch messages
      dispatch(fetchConversation(conversationUuid))
        .unwrap()
        .then(() => {
          console.log('Conversation loaded, now fetching messages...');
          // Then fetch the messages separately
          return dispatch(fetchConversationMessages(conversationUuid));
        })
        .then(() => {
          console.log('Messages loaded successfully');
        })
        .catch((error) => {
          console.error('Failed to load conversation or messages:', error);
        });
    }
  }, [isOpen, conversationUuid, isLoading, dispatch]);

  // reset fetch flag when conversation changes/cleared
  useEffect(() => {
    if (!conversationUuid) fetchedOnceRef.current = false;
  }, [conversationUuid]);

  // dismiss error after a while
  useEffect(() => {
    if (!error) return;
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => dispatch(clearError()), 5000);
    return () => clearTimeout(errorTimeoutRef.current);
  }, [error, dispatch]);

  // Handle mobile back button and escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleBackButton = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    
    // Add popstate for mobile back button
    if (isOpen) {
      window.history.pushState({ chatOpen: true }, '');
      window.addEventListener('popstate', handleBackButton);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('popstate', handleBackButton);
      
      // Clean up history state when component unmounts
      if (isOpen && window.history.state?.chatOpen) {
        window.history.back();
      }
    };
  }, [isOpen]);

  // handlers
  const handleStart = useCallback(
    ({ name, contact, message }) => {
      fetchedOnceRef.current = false;
      dispatch(startConversation({ name, contact, message }));
    },
    [dispatch]
  );

  const handleSendMessage = useCallback(
    ({ message, file }) => {
      if (!conversationUuid) {
        console.error("No active conversation to send a message");
        return;
      }
      dispatch(sendMessage({ 
        conversationUuid, 
        body: message, 
        attachments: file 
      }));
    },
    [conversationUuid, dispatch]
  );

  const handleEndChat = useCallback(() => {
    // For anonymous users, just reset the chat state and close the widget
    dispatch(resetChat());
    setIsOpen(false);
    setIsMinimized(false);
  }, [dispatch]);

  const toggleModal = useCallback(() => {
    setIsOpen(prev => !prev);
    if (isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleExpand = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const unreadCount = messages.length > 0 && !isOpen ? messages.length : 0;
  const showLoading = isLoading && messages.length === 0;
  const showStartForm = !conversationUuid && !isLoading;
  const showChatInterface = !!conversationUuid && !showLoading;

  // Minimized state UI
  if (isMinimized && isOpen) {
    return (
      <>
        {/* Minimized Chat Bar */}
        <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between p-3 min-w-[280px]">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Live Chat
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {messages.length > 0 ? `${messages.length} messages` : 'Chat is active'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleExpand}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  aria-label="Expand chat"
                >
                  <MessageCircle size={18} />
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  aria-label="Close chat"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating button remains visible but less prominent */}
        <button
          onClick={handleExpand}
          aria-label="Expand chat"
          className="fixed bottom-5 left-4 z-40 flex items-center justify-center w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200"
        >
          <MessageCircle size={20} />
        </button>
      </>
    );
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggleModal}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-4 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:bottom-6 sm:right-6"
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 z-60 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg sm:left-auto sm:right-4 sm:max-w-sm"
            role="alert"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1">
                <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                <div className="text-sm font-medium pr-2">{String(error)}</div>
              </div>
              <button 
                onClick={() => dispatch(clearError())} 
                className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                aria-label="Dismiss error"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-end p-0 sm:p-4"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              ref={modalRef}
              className="relative w-full sm:max-w-md h-[85vh] sm:h-[600px] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
              style={{ 
                maxHeight: '100dvh',
                // Mobile browser safe area support
                paddingBottom: 'env(safe-area-inset-bottom)'
              }}
            >
              {/* Header with improved mobile handling */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 relative">
                    <span className="absolute inset-0 rounded-full animate-ping opacity-60 bg-green-400"></span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {conversationUuid ? "Live Chat" : "Start Conversation"}
                    </h3>
                    {conversationUuid && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {user?.name || 'Anonymous user'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Minimize button - shown when chat is active */}
                  {conversationUuid && (
                    <button
                      onClick={handleMinimize}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label="Minimize chat"
                    >
                      <Minimize2 size={18} />
                    </button>
                  )}
                  
                  {/* End Chat button - desktop */}
                  {conversationUuid && (
                    <button
                      onClick={handleEndChat}
                      className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors font-medium"
                    >
                      End Chat
                    </button>
                  )}
                  
                  {/* Close button */}
                  <button 
                    onClick={handleClose}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Close chat"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Body content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {showLoading ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4" />
                      <div className="text-sm text-gray-600 dark:text-gray-400">Loading conversation...</div>
                    </div>
                  </div>
                ) : showStartForm ? (
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 pb-6">
                      <ChatStartForm onStart={handleStart} />
                    </div>
                  </div>
                ) : showChatInterface ? (
                  <>
                    {/* Messages area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800/50">
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center p-8">
                          <div>
                            <MessageCircle size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No messages yet — start the conversation.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <MessageList messages={messages} currentUser={user?.name} />
                      )}
                      {isTyping && <TypingIndicator />}
                    </div>

                    {/* ChatInput with safe area support */}
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky bottom-0">
                      <div className="p-3 safe-area-bottom">
                        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              {/* Mobile bottom actions - only show when chat is active */}
              {conversationUuid && (
                <div className="sm:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom">
                  <div className="flex space-x-2 p-3">
                    <button 
                      onClick={handleMinimize}
                      className="flex-1 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95"
                    >
                      Minimize
                    </button>
                    <button 
                      onClick={handleEndChat}
                      className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors active:scale-95"
                    >
                      End Chat
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(ChatWidget);