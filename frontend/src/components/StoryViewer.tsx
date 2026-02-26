import React, { useState, useEffect, useCallback } from "react";
import { storyAPI } from "../apis/storyAPI";
import { useAuth } from "../context/AuthContext";
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

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const currentStory = stories[currentIndex];

  // Auto-advance story every 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, onClose]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !viewedStories.has(currentStory._id) && user) {
      markStoryAsViewed(currentStory._id);
      setViewedStories((prev) => new Set([...prev, currentStory._id]));
    }
  }, [currentStory, viewedStories, user]);

  const markStoryAsViewed = async (storyId: string) => {
    try {
      await storyAPI.viewStory(storyId);
    } catch (error) {
      console.error("Error marking story as viewed:", error);
    }
  };

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "Escape") onClose();
    },
    [handleNext, handlePrevious, onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  if (!currentStory) return null;

  const progress = ((currentIndex + 1) / stories.length) * 100;
  const isViewedByCurrentUser = currentStory.viewers.some(
    (viewer) => viewer.user.id === user?.id,
  );

  return (
    <div className="fixed inset-0 bg-[#000000ee] z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={currentStory.user.profilePicture}
              alt={currentStory.user.username}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div>
              <p className="text-white font-semibold">
                {currentStory.user.username}
              </p>
              <p className="text-white/70 text-sm">
                {new Date(currentStory.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex space-x-1 mt-4">
          {stories.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full ${
                index < currentIndex
                  ? "bg-white"
                  : index === currentIndex
                    ? "bg-white animate-pulse"
                    : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full flex items-center justify-center">
        <img
          src={currentStory.image}
          alt="Story"
          className="max-w-full max-h-full object-contain"
        />

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-0 right-0 text-center p-4">
            <p className="text-white text-lg">{currentStory.caption}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <button
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
        disabled={currentIndex === 0}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Viewers Indicator */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-2">
        <div className="flex -space-x-2">
          {currentStory.viewers.slice(0, 3).map((viewer, index) => (
            <img
              key={index}
              src={viewer.user.profilePicture}
              alt={viewer.user.username}
              className="w-6 h-6 rounded-full border-2 border-black"
            />
          ))}
        </div>
        {currentStory.viewers.length > 3 && (
          <span className="text-white text-sm">
            +{currentStory.viewers.length - 3}
          </span>
        )}
        {isViewedByCurrentUser && (
          <span className="text-white/70 text-sm">Viewed</span>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
