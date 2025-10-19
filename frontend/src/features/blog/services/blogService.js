// filepath: src/features/blog/services/blogService.js
import api from '@/services/api';

const BASE = '/blogs';

const blogService = {
  getPosts: (params = {}) => api.get(BASE, { params }),
  getPost: (slugOrId) => {
    // backend expects slug; if passed numeric, still call slug endpoint (string)
    return api.get(`${BASE}/${encodeURIComponent(slugOrId)}`);
  },
  createPost: (payload) => api.post(BASE + '/', payload),
  updatePost: (id, payload) => api.put(`${BASE}/${id}`, payload),
  votePost: (id, vote) => api.post(`${BASE}/${id}/vote`, { vote }),
  postComment: (blogId, body) => api.post(`${BASE}/${blogId}/comment`, body),
  getComments: (blogId) => {
    // backend's show returns comments; if you need separate endpoint implement here.
    return api.get(`${BASE}/${blogId}`); // will return blog with comments
  },
  getCategories: () => api.get(`${BASE}/categories`),
  getTags: () => api.get(`${BASE}/tags`),
};

export default blogService;
