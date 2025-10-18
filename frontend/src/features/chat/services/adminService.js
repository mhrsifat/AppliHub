// filepath: src/features/chat/services/adminService.js
import api from "src/services/api";

export const listConversations = (params = {}) => {
  // params: page, per_page, filters
  return api.get("/message/conversations", { params });
};

export const getConversationDetail = (uuid) => {
  return api.get(`/message/conversations/${uuid}`);
};

export const postAdminMessage = (uuid, body, files = [], onUploadProgress) => {
  const fd = new FormData();
  if (body) fd.append("body", body);
  files.forEach((f) => fd.append("attachments[]", f));
  return api.post(`/message/conversations/${uuid}/messages`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
};

export const closeConversation = (uuid) => api.post(`/message/conversations/${uuid}/close`);
export const addInternalNote = (uuid, body) => api.post(`/message/conversations/${uuid}/notes`, { body });
export const assignConversation = (uuid) => api.post(`/message/conversations/${uuid}/assign`);
export const markRead = (uuid) => api.post(`/message/conversations/${uuid}/read`);
export const deleteMessage = (id) => api.delete(`/message/messages/${id}`);