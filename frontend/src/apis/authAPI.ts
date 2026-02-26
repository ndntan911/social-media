import api from './api';
import type { User, AuthResponse } from '../types';

export const authAPI = {
  register: (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) => api.post<AuthResponse>('/auth/register', userData),

  login: (credentials: {
    email: string;
    password: string;
  }) => api.post<AuthResponse>('/auth/login', credentials),

  getCurrentUser: () => api.get<{ user: User }>('/auth/me'),
};
