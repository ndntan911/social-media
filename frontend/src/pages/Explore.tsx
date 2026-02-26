import React, { useState, useEffect, useRef, useCallback } from "react";
import { exploreAPI } from "../apis";
import type { Post } from "../types";

const Explore: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement | null>(null);

  // Fetch mixed content (random + trending)
  const fetchPosts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (append && isFetchingMore) return; // Prevent duplicate requests

        if (append) setIsFetchingMore(true);
        else setLoading(true);

        // Fetch both random and trending posts
        const [trendingResponse] = await Promise.all([
          exploreAPI.getTrendingPosts(pageNum, 10),
        ]);

        const trendingPosts = trendingResponse.data.posts || [];

        // Mix and shuffle posts
        const shuffledPosts = trendingPosts.sort(() => Math.random() - 0.5);

        setPosts((prev) =>
          append ? [...prev, ...shuffledPosts] : shuffledPosts,
        );
        setHasMore(shuffledPosts.length > 0);
        setError("");
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load posts");
      } finally {
        setLoading(false);
        if (append) setIsFetchingMore(false);
      }
    },
    [isFetchingMore],
  );

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isFetchingMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, true);
      }
    },
    [page, hasMore, isFetchingMore, fetchPosts],
  );

  // Initial data fetch
  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const currentObserver = observer.current;
    const currentLastPost = lastPostRef.current;

    if (currentObserver) {
      currentObserver.disconnect();
    }

    const newObserver = new IntersectionObserver(handleObserver, {
      threshold: 1.0,
      rootMargin: "200px",
    });

    if (currentLastPost) {
      newObserver.observe(currentLastPost);
    }

    observer.current = newObserver;

    return () => {
      if (newObserver && currentLastPost) {
        newObserver.unobserve(currentLastPost);
      }
    };
  }, [handleObserver, posts.length]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Explore</h1>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Content */}
      {loading && posts.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No posts found.</div>
      ) : (
        <div>
          {/* Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((post, index) => (
              <div
                key={post.id}
                ref={index === posts.length - 1 ? lastPostRef : null}
                className="relative aspect-square group cursor-pointer"
              >
                {/* Media Preview */}
                {post.media && post.media.length > 0 && (
                  <div className="w-full h-full overflow-hidden rounded-lg">
                    {post.media[0].type === "image" ? (
                      <img
                        src={post.media[0].url}
                        alt={post.caption || "Post"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <video
                        src={post.media[0].url}
                        className="w-full h-full object-cover"
                        muted
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                      />
                    )}

                    {/* Overlay with stats */}
                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-center justify-center">
                      <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-4">
                        <div className="flex items-center space-x-1">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                          </svg>
                          <span className="text-sm">
                            {post.likes?.length || 0}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm">
                            {post.comments?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Multiple media indicator */}
                {post.media && post.media.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Loading indicator for infinite scroll */}
          {isFetchingMore && (
            <div className="text-center py-4">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
                <span className="text-gray-600">Loading more posts...</span>
              </div>
            </div>
          )}

          {/* No more posts indicator */}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              <p>You've reached the end of explore</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Explore;
