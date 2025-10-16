// filepath: src/features/chat/components/UserComponent.jsx
import React from 'react';
import ChatWidget from './ChatWidget';

/**
 * UserComponent - Easy to embed chat widget for public users
 * 
 * Usage:
 * import { UserComponent } from '@/features/chat';
 * 
 * function App() {
 *   return (
 *     <div>
 *       <YourContent />
 *       <UserComponent />
 *     </div>
 *   );
 * }
 */
const UserComponent = ({ unreadCount = 0 }) => {
  return <ChatWidget unreadCount={unreadCount} />;
};

export default UserComponent;