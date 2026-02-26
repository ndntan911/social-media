import React, { useState, useEffect } from "react";
import { storyAPI } from "../apis/storyAPI";
import type { User } from "../types";

interface Story {
  _id: string;
  user: User;
  image: string;
  caption?: string;
  viewers: Array<{ user: User; viewedAt: string }>;
  expiresAt: string;
  createdAt: string;
}

interface StoriesProps {
  onStoryClick?: (story: Story) => void;
  onAddStory?: () => void;
}

const Stories: React.FC<StoriesProps> = ({ onStoryClick, onAddStory }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStories();

    // Refresh stories every 5 minutes to check for expirations
    const interval = setInterval(fetchStories, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await storyAPI.getFollowingStories();
      setStories(response.data || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching stories:", error);
      setError("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffInMs = expires.getTime() - now.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(
      (diffInMs % (1000 * 60 * 60)) / (1000 * 60),
    );

    if (diffInHours > 0) {
      return `${diffInHours}h ${diffInMinutes}m left`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m left`;
    } else {
      ("Expires soon");
    }
  };

  const isViewed = (story: Story, currentUserId: string) => {
    return story.viewers.some((viewer) => viewer.user.id === currentUserId);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex space-x-4 overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-16 h-2 bg-gray-200 rounded-full mt-1 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Group stories by user
  const storiesByUser = stories.reduce(
    (acc, story) => {
      if (!acc[story.user.id]) {
        acc[story.user.id] = {
          user: story.user,
          stories: [],
        };
      }
      acc[story.user.id].stories.push(story);
      return acc;
    },
    {} as Record<string, { user: User; stories: Story[] }>,
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
        {/* Add Story Button */}
        <div className="flex-shrink-0">
          <button className="relative group" onClick={onAddStory}>
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full p-0.5">
              <div className="w-full h-full bg-white rounded-full p-0.5">
                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-600 mt-1 block text-center truncate w-16">
              Your Story
            </span>
          </button>
        </div>

        {/* User Stories */}
        {Object.values(storiesByUser).map(({ user, stories: userStories }) => (
          <div key={user.id} className="flex-shrink-0">
            <button
              onClick={() => onStoryClick?.(userStories[0])}
              className="relative group"
            >
              <div
                className={`w-16 h-16 rounded-full p-0.5 ${
                  isViewed(userStories[0], "current-user-id")
                    ? "bg-gray-300"
                    : "bg-gradient-to-br from-pink-500 to-purple-500"
                }`}
              >
                <div className="w-full h-full bg-white rounded-full p-0.5">
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              {userStories.length > 1 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">
                    {userStories.length}
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-600 mt-1 block text-center truncate w-16">
                {user.username}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;
