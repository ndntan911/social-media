import React, { useState, useEffect } from "react";
import { exploreAPI } from "../utils/exploreAPI";
import type { Post } from "../types";
import PostCard from "../components/PostCard";

const Explore: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"random" | "trending" | "tags">(
    "random",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "caption" | "tags">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch random posts
  const fetchRandomPosts = async (pageNum = 1) => {
    try {
      const response = await exploreAPI.getRandomPosts(pageNum);
      const newPosts = response.data.posts || [];

      setPosts((prev) => (pageNum === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMore(newPosts.length > 0);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  // Fetch trending posts
  const fetchTrendingPosts = async (pageNum = 1) => {
    try {
      const response = await exploreAPI.getTrendingPosts(pageNum);
      const newPosts = response.data.posts || [];

      setTrendingPosts((prev) =>
        pageNum === 1 ? newPosts : [...prev, ...newPosts],
      );
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load trending posts");
    } finally {
      setLoading(false);
    }
  };

  // Fetch popular tags
  const fetchPopularTags = async () => {
    try {
      const response = await exploreAPI.getPopularTags();
      setPopularTags(response.data.tags || []);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load tags");
    }
  };

  // Search posts
  const searchPosts = async (pageNum = 1) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await exploreAPI.searchPosts(
        searchQuery,
        searchType,
        pageNum,
      );
      const newPosts = response.data.posts || [];

      setPosts((prev) => (pageNum === 1 ? newPosts : [...prev, ...newPosts]));
      setHasMore(newPosts.length > 0);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to search posts");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Load more posts
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);

    if (activeTab === "random") {
      fetchRandomPosts(nextPage);
    } else if (activeTab === "trending") {
      fetchTrendingPosts(nextPage);
    } else if (isSearching) {
      searchPosts(nextPage);
    }
  };

  // Handle post updates
  const handlePostUpdate = (updatedPost: Post) => {
    const updatePostArray = (postsArray: Post[]) =>
      postsArray.map((post) =>
        post.id === updatedPost.id ? updatedPost : post,
      );

    setPosts(updatePostArray);
    setTrendingPosts(updatePostArray);
  };

  // Handle post deletion
  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setTrendingPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  // Initial data fetch
  useEffect(() => {
    setLoading(true);
    if (activeTab === "random") {
      fetchRandomPosts();
    } else if (activeTab === "trending") {
      fetchTrendingPosts();
    } else if (activeTab === "tags") {
      fetchPopularTags();
    }
  }, [activeTab]);

  // Search on Enter key
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    searchPosts();
  };

  const currentPosts = activeTab === "trending" ? trendingPosts : posts;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Explore</h1>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab("random")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "random"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Random
        </button>
        <button
          onClick={() => setActiveTab("trending")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "trending"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Trending
        </button>
        <button
          onClick={() => setActiveTab("tags")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "tags"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Tags
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearchSubmit} className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={searchType}
            onChange={(e) =>
              setSearchType(e.target.value as "all" | "caption" | "tags")
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All</option>
            <option value="caption">Caption</option>
            <option value="tags">Tags</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : activeTab === "tags" ? (
        /* Tags View */
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-4">Popular Tags</h2>
          {popularTags.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tags found</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm hover:bg-gray-200 cursor-pointer"
                  onClick={() => {
                    setSearchQuery(tag);
                    setSearchType("tags");
                    setActiveTab("random");
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Posts View (Random/Trending/Search Results) */
        <div>
          {currentPosts.length === 0 && !isSearching ? (
            <div className="text-center py-12 text-gray-500">
              {activeTab === "trending"
                ? "No trending posts yet."
                : activeTab === "random"
                  ? "No posts found."
                  : "No results found."}
            </div>
          ) : (
            <div className="space-y-6">
              {currentPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center py-4">
                  <button
                    onClick={loadMore}
                    className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Explore;
