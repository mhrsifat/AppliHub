// filepath: src/features/chat/useTokenListener.js
import { useEffect, useState } from "react";
import api from "@/services/api";

export default function useTokenListener() {
  const [authHeader, setAuthHeader] = useState(
    api.defaults.headers.common["Authorization"] || null
  );

  useEffect(() => {
    const handler = (e) => setAuthHeader(e.detail || null);
    window.addEventListener("tokenChanged", handler);
    return () => window.removeEventListener("tokenChanged", handler);
  }, []);

  return authHeader; // e.g. "Bearer eyJhbGciOi..."
}