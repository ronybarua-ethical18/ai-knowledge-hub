import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatWithDocuments, ChatRequest, ChatResponse } from "../services/ai";
import toast from "react-hot-toast";

export const useAiChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: ChatRequest) => chatWithDocuments(request),
    onSuccess: (data: ChatResponse) => {
      console.log("Chat successful:", data);
    },
    onError: (error: any) => {
      console.error("Chat error:", error);
      toast.error("Failed to get AI response. Please try again.");
    },
  });
};
