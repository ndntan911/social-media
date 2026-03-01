import React, { useState, useEffect } from "react";
import ChatList from "../components/ChatList";
import Chat from "../components/Chat";
import { chatAPI } from "../apis/chatAPI";
import { userAPI } from "../apis/userAPI";
import type { User } from "../types";

interface ChatData {
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

const Messages: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<ChatData | null>(null);
  const [chats, setChats] = useState<ChatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getChats();
      setChats(response.data || []);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await userAPI.searchUsers(query);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const startChat = async (user: User) => {
    try {
      const response = await chatAPI.startChat(user.id);
      const newChat = response.data;
      setChats((prev) => [newChat, ...prev]);
      setSelectedChat(newChat);
      setShowUserSearch(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const handleChatSelect = async (chat: Chat) => {
    setSelectedChat(chat);

    // Mark messages as read
    try {
      await chatAPI.markAsRead(chat._id);
      setChats((prev) =>
        prev.map((c) => (c._id === chat._id ? { ...c, unreadCount: 0 } : c)),
      );
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  };

  const handleBack = () => {
    setSelectedChat(null);
    fetchChats(); // Refresh chat list
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Chat List - Hidden on mobile when chat is selected */}
      <div
        className={`${selectedChat ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-96 bg-white`}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Messages</h1>
            <button
              onClick={() => setShowUserSearch(true)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>

        <ChatList
          onChatSelect={handleChatSelect}
          selectedChatId={selectedChat?._id}
        />
      </div>

      {/* Chat View */}
      <div
        className={`${selectedChat ? "flex" : "hidden lg:flex"} flex-1 flex-col`}
      >
        {selectedChat ? (
          <Chat chat={selectedChat} onBack={handleBack} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <h2 className="text-xl font-semibold mb-2">
                Select a conversation
              </h2>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showUserSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">New Message</h2>
              <button
                onClick={() => {
                  setShowUserSearch(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleUserSearch(e.target.value);
                  }}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Search Results */}
              {isSearching ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => startChat(user)}
                      className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors"
                    >
                      <img
                        src={user.profilePicture}
                        alt={user.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="text-left">
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.fullName}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-4 text-gray-500">
                  <p>No users found</p>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Type to search for users</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
