import { apiClient } from "@/lib/react-query/api-client";

// Types
export interface ChatRequest {
  message: string;
  limit?: number;
}

export interface ChatResponse {
  response: string;
  references: Array<{
    content: string;
    source?: string;
  }>;
}

// AI functions
export const chatWithDocuments = async (
  request: ChatRequest,
): Promise<ChatResponse> => {
  try {
    const response = await apiClient.post("/ai/chat", request);
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Chat failed:",
      error.response?.data?.message || error.message,
    );
    throw error;
  }
};
