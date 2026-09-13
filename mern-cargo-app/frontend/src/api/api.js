import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "/api";

const api = axios.create({ baseURL: API_BASE });

export const getContainers = (params) => api.get("/containers", { params });
export const getContainer = (containerId) => api.get(`/containers/${containerId}`);
export const createContainer = (data) => api.post("/containers", data);
export const updateContainer = (containerId, data) => api.put(`/containers/${containerId}`, data);
export const deleteContainer = (containerId) => api.delete(`/containers/${containerId}`);
export const placeContainer = (containerId, position) =>
  api.post(`/containers/${containerId}/place`, position);
export const suggestPlacement = (payload) => api.post("/containers/suggest-placement", payload);
export const getSummary = () => api.get("/containers/report/summary");
export const getAlerts = () => api.get("/containers/alerts");

export default api;
