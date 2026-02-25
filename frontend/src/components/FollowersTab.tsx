import React from "react";
import type { User } from "../types";

interface FollowersTabProps {
  followers: User[];
  currentUser: User | null;
  onFollowUser: (user: User) => void;
}

const FollowersTab: React.FC<FollowersTabProps> = ({
  followers,
  currentUser,
  onFollowUser,
}) => {
  if (followers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No followers yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Followers</h3>
      <div className="space-y-4">
        {followers.map((user) => (
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
            {currentUser?.id !== user.id && (
              <button
                onClick={() => onFollowUser(user)}
                className={`px-3 py-1  text-sm rounded-md  transition-colors hover:cursor-pointer ${
                  currentUser?.following.includes(user.id)
                    ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {currentUser?.following.includes(user.id)
                  ? "Unfollow"
                  : "Follow"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowersTab;
