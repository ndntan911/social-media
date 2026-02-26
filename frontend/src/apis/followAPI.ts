import api from './api';
import type { User } from '../types';

export const followAPI = {
  followUser: (userId: string) => api.post(`/follow/${userId}`),

  unfollowUser: (userId: string) => api.delete(`/follow/${userId}`),

  getFollowers: (userId: string) => api.get<{ followers: User[] }>(`/follow/followers/${userId}`),

  getFollowing: (userId: string) => api.get<{ following: User[] }>(`/follow/following/${userId}`),

  checkFollowStatus: (userId: string) => api.get<{ isFollowing: boolean }>(`/follow/status/${userId}`),
};
