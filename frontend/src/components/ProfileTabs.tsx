import React from "react";
import PostsTab from "./PostsTab";
import FollowersTab from "./FollowersTab";
import FollowingTab from "./FollowingTab";
import type { User, Post } from "../types";

interface ProfileTabsProps {
  activeTab: "posts" | "followers" | "following";
  posts: Post[];
  followers: User[];
  following: User[];
  currentUser: User | null;
  isOwnProfile: boolean;
  onPostUpdate: (post: Post) => void;
  onPostDelete?: (postId: string) => void;
  onFollowUser: (user: User) => void;
  onUnfollowUser: (user: User) => void;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  posts,
  followers,
  following,
  currentUser,
  isOwnProfile,
  onPostUpdate,
  onPostDelete,
  onFollowUser,
  onUnfollowUser,
}) => {
  switch (activeTab) {
    case "posts":
      return (
        <PostsTab
          posts={posts}
          isOwnProfile={isOwnProfile}
          onPostUpdate={onPostUpdate}
          onPostDelete={onPostDelete}
        />
      );
    case "followers":
      return (
        <FollowersTab
          followers={followers}
          currentUser={currentUser}
          onFollowUser={onFollowUser}
        />
      );
    case "following":
      return (
        <FollowingTab following={following} onUnfollowUser={onUnfollowUser} />
      );
    default:
      return null;
  }
};

export default ProfileTabs;
