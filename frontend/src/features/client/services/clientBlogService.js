// clientBlogService.js
import api from "@/services/api";

export const clientBlogService = {
  list: async (params = {}) => {
    try {
      const response = await api.get("/blogs", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching blogs:", error);
      throw error;
    }
  },
  getBySlug: async (slug) => {
    try {
      const response = await api.get(`/blogs/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching blog with slug ${slug}:`, error);
      throw error;
    }
  },
  comment: async (blogId, payload) => {
    try {
      const response = await api.post(`/blogs/${blogId}/comment`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to blog ${blogId}:`, error);
      throw error;
    }
  },
  reply: async (blogId, payload) => {
    try {
      const response = await api.post(
        `/blogs/${blogId}/comment/reply`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error(`Error replying to comment in blog ${blogId}:`, error);
      throw error;
    }
  },
  vote: async (blogId, type) => {
    try {
      const response = await api.post(`/blogs/${blogId}/vote`, {
        vote_type: type,
      });
      return response.data;
    } catch (error) {
      console.error(`Error voting on blog ${blogId}:`, error);
      throw error;
    }
  },
  categories: async () => {
    try {
      const response = await api.get("/categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  },
  tags: async () => {
    try {
      const response = await api.get("/tags");
      return response.data;
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw error;
    }
  },
};
