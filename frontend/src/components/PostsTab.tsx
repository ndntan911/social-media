import React from 'react';
import PostCard from './PostCard';
import type { Post } from '../types';

interface PostsTabProps {
  posts: Post[];
  isOwnProfile: boolean;
  onPostUpdate: (post: Post) => void;
  onPostDelete?: (postId: string) => void;
}

const PostsTab: React.FC<PostsTabProps> = ({
  posts,
  isOwnProfile,
  onPostUpdate,
  onPostDelete,
}) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No posts yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onUpdate={onPostUpdate}
          onDelete={isOwnProfile ? onPostDelete : undefined}
        />
      ))}
    </div>
  );
};

export default PostsTab;
