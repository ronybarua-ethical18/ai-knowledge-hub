import { apiClient } from "@/lib/react-query/api-client";
import { cookieUtils } from "@/lib/utils/cookies";

// Types (unchanged)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: string;
  avatarUrl?: string;
  preferences?: Record<string, any>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  workspaces?: any[];
}

export interface User {
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  isOnboarded: boolean;
}

// Helper function to extract data from wrapped response
const extractResponseData = (response: any) => response.data.data;

// Helper function to store auth data
const storeAuthData = (data: AuthResponse) => {
  cookieUtils.set("accessToken", data.accessToken, data.expiresIn);
  cookieUtils.set("refreshToken", data.refreshToken, 7 * 24 * 60 * 60); // 7 days
  localStorage.setItem("user", JSON.stringify(data.user));
  // Store workspaces if available
  if (data.workspaces && data.workspaces.length > 0) {
    localStorage.setItem("workspaces", JSON.stringify(data.workspaces));
  }
};

// Auth functions
export const login = async (
  credentials: LoginRequest,
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post("/auth/login", credentials);
    const data = extractResponseData(response);
    storeAuthData(data);
    return data;
  } catch (error: any) {
    console.error(
      "Login failed:",
      error.response?.data?.message || error.message,
    );
    throw error;
  }
};

export const register = async (
  userData: RegisterRequest,
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post("/auth/register", userData);
    const data = extractResponseData(response);
    storeAuthData(data);
    return data;
  } catch (error: any) {
    console.error("Register error:", error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    cookieUtils.clear();
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Check if we have a token first
    if (!getStoredToken()) {
      return null;
    }

    const { data } = await apiClient.get("/auth/me");
    const userData = extractResponseData(data);

    // Ensure we return a valid user object or null
    return userData || null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

// Utility functions
export const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null;

  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => {
  return cookieUtils.get("accessToken");
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

// Add utility function to get workspaces
export const getStoredWorkspaces = (): any[] => {
  if (typeof window === "undefined") return [];

  try {
    const workspacesStr = localStorage.getItem("workspaces");
    return workspacesStr ? JSON.parse(workspacesStr) : [];
  } catch {
    return [];
  }
};
