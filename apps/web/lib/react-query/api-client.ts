import axios from "axios";
import { cookieUtils } from "@/lib/utils/cookies";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true,
});

// Request interceptor - optimized token extraction
apiClient.interceptors.request.use(
  (config) => {
    const token = cookieUtils.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      cookieUtils.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
