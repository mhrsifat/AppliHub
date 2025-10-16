// filepath: src/services/api.js
import axios from "axios";
import store from "../app/store";
import { setUser, clearUser } from "../features/auth/slices/authSlice";

const API_BASE = import.meta.env.VITE_API_BASE;

// Main Axios instance
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// Helper to set/remove access token in memory
export const setAccessToken = (token) => {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};

// Separate Axios instance for refresh to avoid interceptor recursion
const refreshClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// Queue for requests while refreshing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// Graceful logout utility — clears token, redux state and redirects to /login.
// Also attempts to call server logout endpoint if available.
export const logout = async (redirect = true) => {
  try {
    // Attempt server-side logout to clear cookies (if your backend exposes this)
    await refreshClient.post("/auth/logout", {}, { withCredentials: true }).catch(() => {});
  } catch (e) {
    // ignore network errors here — continue with client-side cleanup
  }

  // Clear client-side auth data
  setAccessToken(null);
  try {
    store.dispatch(clearUser());
  } catch (e) {
    // in case store isn't available for some reason, proceed
    console.error("Failed to dispatch clearUser:", e);
  }

  if (redirect) {
    // Force a reload to the login route to ensure app state reset.
    // Use absolute path so it works from anywhere.
    window.location.href = "/login";
  }
};

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // If refresh endpoint itself fails, perform full logout
    if (originalRequest.url?.includes("/auth/refresh")) {
      await logout(true);
      return Promise.reject(error);
    }

    // Handle 401s with token rotation
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (token) originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await refreshClient.post(
          "/auth/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = refreshRes.data?.access_token;
        const user = refreshRes.data?.user;

        if (!newToken) throw new Error("No token returned during refresh");

        // Set new token in Axios default headers
        setAccessToken(newToken);

        // Update Redux user if backend returns it
        if (user) store.dispatch(setUser(user));

        // Resolve all queued requests with new token
        processQueue(null, newToken);

        // Retry the original request
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        // Reject queued requests and perform full logout
        processQueue(err);
        await logout(true);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;