import api from './api';

export const exploreAPI = {
  getRandomPosts: (page = 1, limit = 20) => 
    api.get(`/explore/random?page=${page}&limit=${limit}`),

  getTrendingPosts: (page = 1, limit = 20) => 
    api.get(`/explore/trending?page=${page}&limit=${limit}`),

  getPopularTags: (limit = 20) => 
    api.get(`/explore/tags?limit=${limit}`),

  searchPosts: (query: string, type = 'all', page = 1, limit = 20) => {
    const params = new URLSearchParams({
      q: query,
      type,
      page: page.toString(),
      limit: limit.toString()
    });
    return api.get(`/explore/search?${params}`);
  }
};
