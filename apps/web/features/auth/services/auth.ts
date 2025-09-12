import { apiClient } from "@/lib/react-query/api-client";

export const getProfile = async () => {
  try {
    const { data } = await apiClient.get("/auth/me");
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};
export const getPosts = async () => {
  try {
    const { data } = await apiClient.get("/posts");
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

export const getPost = async (postId: number) => {
  try {
    const { data } = await apiClient.get(`/posts/${postId}`);
    return data;
  } catch (error) {
    console.error("Error fetching post:", error);
    throw error;
  }
};
