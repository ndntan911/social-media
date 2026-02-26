import React, { useState, useEffect, useRef, useCallback } from "react";
import { postAPI } from "../apis";
import type { Post } from "../types";
import PostCard from "../components/PostCard";
import Stories from "../components/Stories";
import StoryViewer from "../components/StoryViewer";
import CreateStory from "../components/CreateStory";

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement | null>(null);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);

  const fetchPosts = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        if (append && isFetchingMore) return; // Prevent duplicate requests

        if (append) setIsFetchingMore(true);
        const response = await postAPI.getFeed(pageNum);
        const newPosts = response.data.data || response.data.posts || [];

        setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
        setHasMore(newPosts.length > 0);
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

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Stories Section */}
      <Stories
        onStoryClick={(story) => setSelectedStory(story)}
        onAddStory={() => setShowCreateStory(true)}
      />

      {/* Posts Section */}
      {loading && posts.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchPosts()}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No posts yet. Follow some users to see their posts!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <div
              key={post.id}
              ref={index === posts.length - 1 ? lastPostRef : null}
            >
              <PostCard
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            </div>
          ))}

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
              <p>You've reached the end of your feed</p>
            </div>
          )}
        </div>
      )}

      {/* Story Viewer Modal */}
      {selectedStory && (
        <StoryViewer
          stories={[selectedStory]} // For now, just show the selected story
          onClose={() => setSelectedStory(null)}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStory
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={() => {
            setShowCreateStory(false);
            // Refresh stories
          }}
        />
      )}
    </div>
  );
};

export default Feed;
