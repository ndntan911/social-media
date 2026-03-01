export interface Media {
  type: 'image' | 'video';
  url: string;
  thumbnail: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  bio: string;
  profilePicture: string;
  followers: string[];
  following: string[];
  posts: string[];
  savedPosts: string[];
  isVerified: boolean;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isOnline?: boolean;
}

export interface Post {
  id: string;
  user: {
    id: string;
    username: string;
    profilePicture: string;
  };
  media: Media[];
  caption: string;
  location: string;
  tags: string[];
  likes: string[];
  comments: Comment[];
  likesCount: number;
  commentsCount: number;
  mediaCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    profilePicture: string;
  };
  text: string;
  parentComment: string | null;
  replies: Comment[];
  likes: string[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}
