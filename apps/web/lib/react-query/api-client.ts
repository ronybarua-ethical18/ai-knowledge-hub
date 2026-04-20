import axios from "axios";
import { cookieUtils } from "@/lib/utils/cookies";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true,
});

function shouldSkipUnauthorizedRedirect(errorUrl: string | undefined): boolean {
  if (!errorUrl) return false;
  // Failed login/register return 401 — redirecting would clear state and break the auth UI.
  return (
    errorUrl.includes("/auth/login") || errorUrl.includes("/auth/register")
  );
}

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
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    if (
      status === 401 &&
      typeof window !== "undefined" &&
      !shouldSkipUnauthorizedRedirect(url)
    ) {
      cookieUtils.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
