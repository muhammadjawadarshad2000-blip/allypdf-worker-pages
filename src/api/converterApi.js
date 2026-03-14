import axiosClient from "./axiosClient";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/converter`;

export const converterApi = {
  htmlToPdf: async (payload) => {
    const response = await axiosClient.post(`${API_BASE_URL}/html-to-pdf`, payload, {
      responseType: 'blob',
    });
    return response.data;
  },
  
  htmlToImage: async (payload) => {
    const response = await axiosClient.post(`${API_BASE_URL}/html-to-image`, payload, {
      responseType: 'blob',
    });
    return response.data;
  }
};