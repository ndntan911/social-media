import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { userAPI, postAPI, followAPI } from '../utils/api';
import type { User, Post } from '../types';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');

  useEffect(() => {
    if (username) {
      fetchProfile();
      fetchUserPosts();
      checkFollowStatus();
    }
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile(username!);
      setProfileUser(response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await postAPI.getUserPosts(profileUser?.id || '');
      setPosts(response.data.data || response.data.posts || []);
    } catch (err: any) {
      console.error('Failed to load posts:', err);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || !profileUser || currentUser.id === profileUser.id) return;
    
    try {
      const response = await followAPI.checkFollowStatus(profileUser.id);
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    if (!profileUser || !currentUser) return;

    try {
      if (isFollowing) {
        await followAPI.unfollowUser(profileUser.id);
        setIsFollowing(false);
        setProfileUser(prev => prev ? {
          ...prev,
          followersCount: (prev.followersCount || 0) - 1
        } : null);
      } else {
        await followAPI.followUser(profileUser.id);
        setIsFollowing(true);
        setProfileUser(prev => prev ? {
          ...prev,
          followersCount: (prev.followersCount || 0) + 1
        } : null);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => 
      prev.map(post => post.id === updatedPost.id ? updatedPost : post)
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'User not found'}</div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start space-x-6">
          {/* Profile Picture */}
          <img
            src={profileUser.profilePicture || `https://ui-avatars.com/api/?name=${profileUser.username}&background=random&size=150`}
            alt={profileUser.username}
            className="w-32 h-32 rounded-full object-cover"
          />

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{profileUser.username}</h1>
              
              {/* Follow Button */}
              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex space-x-8 mb-4">
              <div className="text-center">
                <div className="font-semibold text-lg">{profileUser.postsCount || 0}</div>
                <div className="text-gray-500 text-sm">posts</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">{profileUser.followersCount || 0}</div>
                <div className="text-gray-500 text-sm">followers</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">{profileUser.followingCount || 0}</div>
                <div className="text-gray-500 text-sm">following</div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <h2 className="font-semibold">{profileUser.fullName}</h2>
              {profileUser.bio && <p className="text-gray-600 mt-1">{profileUser.bio}</p>}
              {profileUser.isVerified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                  ✓ Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'posts'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'followers'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Followers
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 text-center font-medium transition-colors ${
              activeTab === 'following'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={isOwnProfile ? handlePostDelete : undefined}
              />
            ))}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="text-center py-12 text-gray-500">
            <p>Followers functionality coming soon...</p>
          </div>
        )}

        {activeTab === 'following' && (
          <div className="text-center py-12 text-gray-500">
            <p>Following functionality coming soon...</p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {activeTab === 'posts' && posts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No posts yet.</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
