// filepath: src/features/chat/services/api.js 
import axios from 'axios';

// Simple axios instance. You can set AUTH token on each request via setAuthToken. 
const instance = axios.create({ baseURL: typeof window !== 'undefined' && window.CHAT_WIDGET_API_BASE ? window.CHAT_WIDGET_API_BASE : '/api', withCredentials: true, headers: { 'Accept': 'application/json', }, });

export function setAuthToken(token) { if (token) { instance.defaults.headers.common['Authorization'] = Bearer ${token}; } else { delete instance.defaults.headers.common['Authorization']; } }

export default instance;

