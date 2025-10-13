import axios from "axios";
import { cookieUtils } from "@/lib/utils/cookies";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true,
});

// Request interceptor - optimized token extraction
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = cookieUtils.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Clear tokens and redirect to login
      if (typeof window !== "undefined") {
        cookieUtils.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);
