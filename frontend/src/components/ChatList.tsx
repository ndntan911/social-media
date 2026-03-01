import React, { useState, useEffect } from 'react';
import { chatAPI } from '../apis/chatAPI';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

interface Chat {
  _id: string;
  participants: Array<{ user: User; lastRead: string }>;
  lastMessage?: {
    text: string;
    sender: User;
    createdAt: string;
  };
  unreadCount: number;
  otherUser: User;
}

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  selectedChatId?: string;
}

const ChatList: React.FC<ChatListProps> = ({ onChatSelect, selectedChatId }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (data) => {
        setChats(prev => {
          const chatIndex = prev.findIndex(chat => chat._id === data.chatId);
          if (chatIndex !== -1) {
            const updatedChats = [...prev];
            updatedChats[chatIndex] = {
              ...updatedChats[chatIndex],
              lastMessage: {
                text: data.message.text,
                sender: data.message.sender,
                createdAt: data.message.createdAt
              },
              unreadCount: data.message.sender.id !== user?.id 
                ? updatedChats[chatIndex].unreadCount + 1 
                : updatedChats[chatIndex].unreadCount
            };
            // Move to top
            return [updatedChats[chatIndex], ...updatedChats.filter((_, i) => i !== chatIndex)];
          }
          return prev;
        });
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, [socket, user?.id]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getChats();
      setChats(response.data || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays}d ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white border-r">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No conversations yet</p>
            <p className="text-sm">Start a conversation to see it here</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat) => (
              <button
                key={chat._id}
                onClick={() => onChatSelect(chat)}
                className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                  selectedChatId === chat._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="relative">
                  <img 
                    src={chat.otherUser.profilePicture} 
                    alt={chat.otherUser.username}
                    className="w-12 h-12 rounded-full"
                  />
                  {/* Online indicator */}
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    chat.otherUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{chat.otherUser.username}</p>
                    <span className="text-xs text-gray-500">
                      {chat.lastMessage && formatTime(chat.lastMessage.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {chat.lastMessage ? (
                        chat.lastMessage.sender.id === user?.id ? (
                          <>You: {chat.lastMessage.text}</>
                        ) : (
                          chat.lastMessage.text
                        )
                      ) : (
                        'No messages yet'
                      )}
                    </p>
                    
                    {chat.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;
