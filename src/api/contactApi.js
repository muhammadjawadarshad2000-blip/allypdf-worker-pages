import axiosClient from "./axiosClient";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/contact`;

export const contactApi = {
  submit: async (formData) => {
    const { data } = await axiosClient.post(`${API_BASE_URL}/submit`, formData);
    return data;
  },
  getAllContacts: async () => {
    const { data } = await axiosClient.get(`${API_BASE_URL}`);
    return data;
  },
  getStats: async () => {
    const { data } = await axiosClient.get(`${API_BASE_URL}/stats`);
    return data;
  },
  getContact: async (id) => {
    const { data } = await axiosClient.get(`${API_BASE_URL}/${id}`);
    return data;
  },
  updateStatus: async (id, status) => {
    const { data } = await axiosClient.patch(`${API_BASE_URL}/${id}`, { status });
    return data;
  },
  reply: async (id, replyMessage) => {
    const { data } = await axiosClient.post(`${API_BASE_URL}/${id}/reply`, { replyMessage });
    return data;
  },
  deleteContact: async (id) => {
    const { data } = await axiosClient.delete(`${API_BASE_URL}/${id}`);
    return data;
  }
};