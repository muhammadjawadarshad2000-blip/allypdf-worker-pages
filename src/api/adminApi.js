import axiosClient from "./axiosClient";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/admin`;

export const adminApi = {
  getStats: async () => {
    const { data } = await axiosClient.get(`${API_BASE_URL}/stats`);
    return data;
  },
  getUsers: async () => {
    const { data } = await axiosClient.get(`${API_BASE_URL}/users`);
    return data;
  },
  updateUserRole: async (userId, role) => {
    const { data } = await axiosClient.post(`${API_BASE_URL}/users/update-role`, { userId, role });
    return data;
  }
};