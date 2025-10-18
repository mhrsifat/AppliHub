// filepath: src/features/chat/chatServices.js
import api, { setAccessToken } from "@/services/api";

/**
 * Centralized chat API endpoints + upload progress support.
 * Edit route strings here if backend changes.
 */

const endpoints = {
  createConversation: () => "/message/conversations",
  listConversations: () => "/message/conversations",
  showConversation: (uuid) => `/message/conversations/${uuid}`,
  listMessages: (uuid, page = 1, per_page = 50) => `/message/conversations/${uuid}/messages?page=${page}&per_page=${per_page}`,
  sendMessage: (uuid) => `/message/conversations/${uuid}/messages`,
  typing: (uuid) => `/message/conversations/${uuid}/typing`,
  joinConversation: (uuid) => `/message/conversations/${uuid}/join`,
  assignConversation: (uuid) => `/message/conversations/${uuid}/assign`,
  deleteMessage: (id) => `/message/messages/${id}`,
  getAttachment: (id) => `/message/attachments/${id}`,
};

const chatServices = {
  createConversation: async ({ name, contact, subject, message, attachments = [] } = {}) => {
    const fd = new FormData();
    if (name) fd.append("name", name);
    if (contact) fd.append("contact", contact);
    if (subject) fd.append("subject", subject);
    if (message) fd.append("message", message);
    attachments.forEach((f) => fd.append("attachments[]", f));
    const res = await api.post(endpoints.createConversation(), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  listConversations: async (params = {}) => {
    const res = await api.get(endpoints.listConversations(), { params });
    return res.data;
  },

  showConversation: async (uuid) => {
    const res = await api.get(endpoints.showConversation(uuid));
    return res.data;
  },

  listMessages: async (uuid, { page = 1, per_page = 50 } = {}) => {
    const res = await api.get(endpoints.listMessages(uuid, page, per_page));
    return res.data;
  },

  sendMessage: async ({ uuid, body = "", name, contact, attachments = [], onUploadProgress = null } = {}) => {
    const fd = new FormData();
    if (name) fd.append("name", name);
    if (contact) fd.append("contact", contact);
    fd.append("body", body || "");
    attachments.forEach((f) => fd.append("attachments[]", f));
    const res = await api.post(endpoints.sendMessage(uuid), fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onUploadProgress || null,
    });
    return res.data;
  },

  typing: async ({ uuid, name }) => {
    const res = await api.post(endpoints.typing(uuid), { name });
    return res.data;
  },

  joinConversation: async (uuid) => {
    const res = await api.post(endpoints.joinConversation(uuid));
    return res.data;
  },

  assignConversation: async (uuid) => {
    const res = await api.post(endpoints.assignConversation(uuid));
    return res.data;
  },

  deleteMessage: async (id) => {
    const res = await api.delete(endpoints.deleteMessage(id));
    return res.data;
  },

  getAttachment: async (id) => {
    const res = await api.get(endpoints.getAttachment(id));
    return res.data;
  },

  setToken: (token) => setAccessToken(token),
};

export default chatServices;