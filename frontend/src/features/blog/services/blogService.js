// blogService.js
import api from "@/services/api";

export const blogService = {
  list: (params = {}) => api.get("/api/blogs", { params }),
  get: (slugOrId) => {
    // sometimes admin may fetch by id, client fetches by slug
    return api.get(`/api/blogs/${slugOrId}`);
  },
  create: (payload) => api.post("/api/blogs", payload),
  update: (id, payload) => api.put(`/api/blogs/${id}`, payload),
  remove: (id) => api.delete(`/api/blogs/${id}`),
  vote: (id, voteType) =>
    api.post(`/api/blogs/${id}/vote`, { vote_type: voteType }),
  comment: (id, payload) => api.post(`/api/blogs/${id}/comment`, payload),
  adminReply: (blogId, payload) =>
    api.post(`/api/blogs/${blogId}/comment/reply`, payload),

  categories: () => api.get("/api/categories"),
  createCategory: (payload) => api.post("/api/categories", payload),
  updateCategory: (id, payload) => api.put(`/api/categories/${id}`, payload),
  removeCategory: (id) => api.delete(`/api/categories/${id}`),

  tags: () => api.get("/api/tags"),
  createTag: (payload) => api.post("/api/tags", payload),
  updateTag: (id, payload) => api.put(`/api/tags/${id}`, payload),
  removeTag: (id) => api.delete(`/api/tags/${id}`),
};
