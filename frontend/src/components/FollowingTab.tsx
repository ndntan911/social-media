import React from 'react';
import type { User } from '../types';

interface FollowingTabProps {
  following: User[];
  onUnfollowUser: (user: User) => void;
}

const FollowingTab: React.FC<FollowingTabProps> = ({
  following,
  onUnfollowUser,
}) => {
  if (following.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Not following anyone yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Following</h3>
      <div className="space-y-4">
        {following.map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={
                  user.profilePicture ||
                  `https://ui-avatars.com/api/?name=${user.username}&background=random&size=40`
                }
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-gray-500">{user.fullName}</p>
              </div>
            </div>
            <button
              onClick={() => onUnfollowUser(user)}
              className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300 transition-colors hover:cursor-pointer"
            >
              Unfollow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowingTab;
