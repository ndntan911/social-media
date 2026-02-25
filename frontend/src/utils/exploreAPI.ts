import axios from 'axios';

const API_BASE_URL = '/api';

export const exploreAPI = {
  // Get random posts for explore
  getRandomPosts: async (page = 1, limit = 20) => {
    const response = await axios.get(`${API_BASE_URL}/explore/random?page=${page}&limit=${limit}`);
    return response;
  },

  // Get trending posts
  getTrendingPosts: async (page = 1, limit = 20) => {
    const response = await axios.get(`${API_BASE_URL}/explore/trending?page=${page}&limit=${limit}`);
    return response;
  },

  // Get popular tags
  getPopularTags: async (limit = 20) => {
    const response = await axios.get(`${API_BASE_URL}/explore/tags?limit=${limit}`);
    return response;
  },

  // Search posts
  searchPosts: async (query: string, type = 'all', page = 1, limit = 20) => {
    const params = new URLSearchParams({
      q: query,
      type,
      page: page.toString(),
      limit: limit.toString()
    });
    const response = await axios.get(`${API_BASE_URL}/explore/search?${params}`);
    return response;
  }
};
