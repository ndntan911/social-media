import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../apis/chatAPI';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

interface Message {
  _id: string;
  sender: User;
  text: string;
  image?: string;
  createdAt: string;
  readBy: Array<{ user: User; readAt: string }>;
  isDeleted: boolean;
  isEdited?: boolean;
}

interface Chat {
  _id: string;
  participants: Array<{ user: User; lastRead: string }>;
  lastMessage?: {
    text: string;
    sender: User;
    createdAt: string;
  };
  messages?: Message[];
}

interface ChatProps {
  chat: Chat;
  onBack?: () => void;
}

const Chat: React.FC<ChatProps> = ({ chat, onBack }) => {
  const [messages, setMessages] = useState<Message[]>(chat.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  const otherUser = chat.participants.find(p => p.user.id !== user?.id)?.user;

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (data) => {
        if (data.chatId === chat._id) {
          setMessages(prev => [...prev, data.message]);
        }
      });

      socket.on('message_deleted', (data) => {
        if (data.chatId === chat._id) {
          setMessages(prev => 
            prev.map(msg => 
              msg._id === data.messageId 
                ? { ...msg, isDeleted: true }
                : msg
            )
          );
        }
      });

      return () => {
        socket.off('new_message');
        socket.off('message_deleted');
      };
    }
  }, [socket, chat._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!newMessage.trim() && !fileInputRef.current?.files?.[0]) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      if (newMessage.trim()) {
        formData.append('text', newMessage.trim());
      }
      if (fileInputRef.current?.files?.[0]) {
        formData.append('image', fileInputRef.current.files[0]);
      }

      const response = await chatAPI.sendMessage(chat._id, formData);
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Mark as read
      await chatAPI.markAsRead(chat._id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator logic here if needed
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      // Emit typing event
      socket?.emit('typing_start', { chatId: chat._id });
    } else if (isTyping && !e.target.value.trim()) {
      setIsTyping(false);
      // Emit stop typing event
      socket?.emit('typing_stop', { chatId: chat._id });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isOwnMessage = (message: Message) => {
    return message.sender.id === user?.id;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <img 
            src={otherUser?.profilePicture} 
            alt={otherUser?.username}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <p className="font-semibold">{otherUser?.username}</p>
            <p className="text-sm text-gray-500">
              {otherUser?.isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${
              isOwnMessage(message) 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            } rounded-lg px-4 py-2`}>
              {message.isDeleted ? (
                <p className="text-sm italic">Message deleted</p>
              ) : (
                <>
                  {message.image && (
                    <img 
                      src={message.image} 
                      alt="Message image"
                      className="rounded-lg mb-2 max-w-full"
                    />
                  )}
                  {message.text && (
                    <p className="break-words">{message.text}</p>
                  )}
                  <div className={`text-xs mt-1 ${
                    isOwnMessage(message) 
                      ? 'text-blue-100' 
                      : 'text-gray-500'
                  }`}>
                    {formatTime(message.createdAt)}
                    {message.isEdited && ' (edited)'}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={() => {}} // Handle file selection if needed
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <textarea
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 resize-none border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() && !fileInputRef.current?.files?.[0] || isLoading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
