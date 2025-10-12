// src/features/client/services/clientServices.js
import axios from "axios";

export const clientServices = {
  /**
   * params: object (the payload to send)
   * returns: response.data
   */
  create: async (payload = {}) => {
    try {
      const response = await axios.post(`/api/orders`, payload);
      return response.data;
    } catch (error) {
      console.error("Error creating order.", error);
      throw error;
    }
  },
};
export default clientServices;