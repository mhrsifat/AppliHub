// src/features/client/services/clientServices.js
import api from "@/services/api";

export const clientServices = {
  /**
   * params: object (the payload to send)
   * returns: response.data
   */
  create: async (payload = {}) => {
    try {
      // `api` has baseURL set to VITE_API_BASE (e.g. http://localhost:8000/api)
      const response = await api.post(`/orders`, payload);
      return response.data;
    } catch (error) {
      console.error("Error creating order.", error);
      throw error;
    }
  },
};
export default clientServices;
