// filepath: src/features/chat/index.js

// Components
export { default as ChatWidget } from './components/ChatWidget';
export { default as ChatWidgetButton } from './components/ChatWidgetButton';
export { default as ChatWidgetPanel } from './components/ChatWidgetPanel';
export { default as ConversationList } from './components/ConversationList';
export { default as ConversationItem } from './components/ConversationItem';
export { default as MessageList } from './components/MessageList';
export { default as MessageItem } from './components/MessageItem';
export { default as MessageComposer } from './components/MessageComposer';
export { default as AttachmentPreview } from './components/AttachmentPreview';
export { default as TypingIndicator } from './components/TypingIndicator';
export { default as UserComponent } from './components/UserComponent';
export { default as AdminComponent } from './components/AdminComponent';

// Pages
export { default as ChatPage } from './pages/Page';
export { default as AdminPage } from './pages/AdminPage';

// Hooks
export { useChat } from './hooks/useChat';
export { useTyping } from './hooks/useTyping';
export { useUpload } from './hooks/useUpload';

// Services
export { default as chatService } from './services/chatService';

// Redux (if using Redux)
export { default as chatReducer } from './store/chatSlice';
export * from './store/chatSlice';