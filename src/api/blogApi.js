import axiosClient from "./axiosClient";

const BASE = `${import.meta.env.VITE_API_URL}/blog`;

export const blogApi = {
  getPublished: (params) => axiosClient.get(`${BASE}`, { params }), 
  getPost: (slug) => axiosClient.get(`${BASE}/${slug}`),
  getCategories: () => axiosClient.get(`${BASE}/categories`),
  getTags: () => axiosClient.get(`${BASE}/tags`),

  // Admin
  getStats: () => axiosClient.get(`${BASE}/admin/stats`),
  getAllAdmin: (params) => axiosClient.get(`${BASE}/admin/all`, { params }),
  getByIdAdmin: (id) => axiosClient.get(`${BASE}/admin/${id}`),
  create: (data) => axiosClient.post(`${BASE}/admin`, data),
  update: (id, data) => axiosClient.put(`${BASE}/admin/${id}`, data),
  delete: (id) => axiosClient.delete(`${BASE}/admin/${id}`),
};