// filepath: src/features/chat/services/widgetService.js
import api from "@/services/api";

export const startConversation = async ({ name, contact }) => {
  return api.post("/message/conversations", { name, contact, subject: "Web widget" });
};

export const getMessages = async (uuid, page = 1) => {
  return api.get(`/message/conversations/${uuid}/messages?page=${page}`);
};

export const sendMessage = async (uuid, body, files = [], onUploadProgress) => {
  const fd = new FormData();
  if (body) fd.append("body", body);
  files.forEach((f) => fd.append("attachments[]", f));
  return api.post(`/message/conversations/${uuid}/messages`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });
};