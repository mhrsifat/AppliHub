// filepath: src/features/chat/index.js
export { default as ChatWidget } from "./pages/ChatWidget";
export { default as AdminChatDashboard } from "./pages/AdminChatDashboard";
export { widgetService } from "./services/widgetService";
export { adminService } from "./services/adminService";
export { default as chatSlice, 
  startConversation, 
  sendMessage, 
  fetchConversations,
  receiveMessage,
  setTyping 
} from "./slices/chatSlice";