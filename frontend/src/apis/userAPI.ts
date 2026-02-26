import api from './api';
import type { User } from '../types';

export const userAPI = {
  getProfile: (username: string) => api.get<{ user: User }>(`/users/${username}`),

  updateProfile: (profileData: {
    fullName?: string;
    bio?: string;
    username?: string;
  }) => api.put<{ user: User }>('/users/profile', profileData),

  searchUsers: (query: string) => api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}`),
};
