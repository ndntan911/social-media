import axios from 'axios';
import type { User, Post, Comment, AuthResponse } from '../types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
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

// User endpoints
export const userAPI = {
  getProfile: (username: string) => api.get<{ user: User }>(`/users/${username}`),

  updateProfile: (profileData: {
    fullName?: string;
    bio?: string;
    username?: string;
  }) => api.put<{ user: User }>('/users/profile', profileData),

  searchUsers: (query: string) => api.get<{ users: User[] }>(`/users/search/${query}`),
};

// Post endpoints
export const postAPI = {
  createPost: (formData: FormData) => api.post<{ post: Post }>('/posts', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  getFeed: (page = 1, limit = 5) => 
    api.get(`/posts/feed?page=${page}&limit=${limit}`),

  getPost: (postId: string) => api.get<{ post: Post }>(`/posts/${postId}`),

  getUserPosts: (userId: string, page = 1, limit = 10) =>
    api.get(`/posts/user/${userId}?page=${page}&limit=${limit}`),

  deletePost: (postId: string) => api.delete(`/posts/${postId}`),
};

// Follow endpoints
export const followAPI = {
  followUser: (userId: string) => api.post(`/follow/${userId}`),

  unfollowUser: (userId: string) => api.delete(`/follow/${userId}`),

  getFollowers: (userId: string) => api.get<{ followers: User[] }>(`/follow/followers/${userId}`),

  getFollowing: (userId: string) => api.get<{ following: User[] }>(`/follow/following/${userId}`),

  checkFollowStatus: (userId: string) => api.get<{ isFollowing: boolean }>(`/follow/status/${userId}`),
};

// Like endpoints
export const likeAPI = {
  likePost: (postId: string) => api.post(`/like/${postId}`),

  unlikePost: (postId: string) => api.delete(`/like/${postId}`),

  getPostLikes: (postId: string, page = 1, limit = 20) =>
    api.get(`/like/${postId}?page=${page}&limit=${limit}`),

  checkLikeStatus: (postId: string) => api.get<{ isLiked: boolean }>(`/like/status/${postId}`),
};

// Comment endpoints
export const commentAPI = {
  addComment: (postId: string, text: string, parentCommentId?: string) =>
    api.post<{ comment: Comment }>(`/comment/${postId}`, {
      text,
      parentCommentId,
    }),

  getComments: (postId: string, page = 1, limit = 20) =>
    api.get(`/comment/${postId}?page=${page}&limit=${limit}`),

  deleteComment: (commentId: string) => api.delete(`/comment/${commentId}`),

  likeComment: (commentId: string) => api.post(`/comment/like/${commentId}`),

  unlikeComment: (commentId: string) => api.delete(`/comment/like/${commentId}`),
};

export default api;
