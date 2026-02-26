import api from './api';

export const storyAPI = {
  // Get all active stories
  getStories: () => api.get('/stories'),
  
  // Get stories from users you follow
  getFollowingStories: () => api.get('/stories/following'),
  
  // Get user's own stories
  getMyStories: () => api.get('/stories/my-stories'),
  
  // Create a new story
  createStory: (formData: FormData) => api.post('/stories', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // View a story (add to viewers)
  viewStory: (storyId: string) => api.post(`/stories/${storyId}/view`),
  
  // Delete a story
  deleteStory: (storyId: string) => api.delete(`/stories/${storyId}`),
};
