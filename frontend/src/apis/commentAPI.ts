import api from './api';
import type { Comment } from '../types';

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
