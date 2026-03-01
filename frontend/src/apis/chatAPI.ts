import api from './api';

export const chatAPI = {
  // Get all chats for current user
  getChats: () => api.get('/chat'),
  
  // Get chat by ID with messages
  getChat: (chatId: string) => api.get(`/chat/${chatId}`),
  
  // Start or get chat with user
  startChat: (userId: string) => api.post(`/chat/start/${userId}`),
  
  // Send message
  sendMessage: (chatId: string, formData: FormData) => api.post(`/chat/${chatId}/message`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // Delete message
  deleteMessage: (messageId: string) => api.delete(`/chat/message/${messageId}`),
  
  // Mark messages as read
  markAsRead: (chatId: string) => api.put(`/chat/${chatId}/read`),
};
