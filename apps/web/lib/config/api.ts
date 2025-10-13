const isDevelopment = process.env.NODE_ENV === "development";

export const apiConfig = {
  baseURL: isDevelopment
    ? "http://localhost:8000/api/v1"
    : "https://your-production-api.com/api/v1",
  timeout: 10000,
  retries: 3,
};
