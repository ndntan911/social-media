import api from './api';

export const likeAPI = {
  likePost: (postId: string) => api.post(`/like/${postId}`),

  unlikePost: (postId: string) => api.delete(`/like/${postId}`),

  getPostLikes: (postId: string, page = 1, limit = 20) =>
    api.get(`/like/${postId}?page=${page}&limit=${limit}`),

  checkLikeStatus: (postId: string) => api.get<{ isLiked: boolean }>(`/like/status/${postId}`),
};
