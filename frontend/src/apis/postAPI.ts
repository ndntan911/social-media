import api from './api';
import type { Post } from '../types';

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
