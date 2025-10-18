// 
import React from 'react';
import { format } from 'date-fns';

const ConversationsList = ({ conversations, selectedConversation, onSelectConversation }) => {
  return (
    <div className="h-full overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No conversations found
        </div>
      ) : (
        conversations.map(conversation => (
          <div
            key={conversation.uuid}
            onClick={() => onSelectConversation(conversation.uuid)}
            className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
              selectedConversation === conversation.uuid ? 'bg-blue-50 border-blue-200' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-800 truncate">
                {conversation.subject || 'No Subject'}
              </h4>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {format(new Date(conversation.last_message_at), 'HH:mm')}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-1">
              {conversation.created_by_name} • {conversation.created_by_contact}
            </p>
            
            <p className="text-sm text-gray-500 truncate">
              {conversation.last_message_preview || 'No messages yet'}
            </p>
            
            {conversation.assigned_to && (
              <div className="mt-2">
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Assigned
                </span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ConversationsList;