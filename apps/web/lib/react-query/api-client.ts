import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  withCredentials: true, // for cookie-based auth
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (e.g., attach token from localStorage or cookie)
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token"); // or from cookie
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
    // You can handle auth errors globally here
    if (err.response?.status === 401) {
      console.warn("Unauthorized, redirect to login maybe");
    }
    return Promise.reject(err);
  },
);
