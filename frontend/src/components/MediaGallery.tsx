import React, { useState } from "react";
import type { Media } from "../types";

interface MediaGalleryProps {
  media: Media[];
  className?: string;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
  media,
  className = "",
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const currentMedia = media[currentMediaIndex];

  const renderMedia = (mediaItem: Media) => {
    if (mediaItem.type === "video") {
      return (
        <video
          controls
          className="w-full h-full object-cover"
          poster={mediaItem.thumbnail || ""}
        >
          <source src={mediaItem.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return (
        <img
          src={mediaItem.url}
          alt="Post media"
          className="w-full h-full object-cover"
        />
      );
    }
  };

  const handlePrevious = () => {
    setCurrentMediaIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentMediaIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  if (media.length === 1) {
    return (
      <div className={`relative ${className}`}>{renderMedia(currentMedia)}</div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Media */}
      <div className="relative">
        {renderMedia(currentMedia)}

        {/* Navigation Arrows */}
        <button
          onClick={handlePrevious}
          className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
        >
          <svg
            className="w-4 h-4"
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
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all"
        >
          <svg
            className="w-4 h-4"
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
      </div>

      {/* Media Indicators */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
        {media.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentMediaIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentMediaIndex
                ? "bg-white"
                : "bg-white bg-opacity-50"
            }`}
          />
        ))}
      </div>

      {/* Media Type Badge */}
      <div className="absolute top-2 right-2">
        {currentMedia.type === "video" && (
          <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            Video
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaGallery;
