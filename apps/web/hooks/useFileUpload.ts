import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../lib/react-query/api-client";
import toast from "react-hot-toast";

export const useFileUpload = () => {
  return useMutation({
    mutationFn: async ({ file, userId }: { file: File; userId: string }) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Upload failed");
    },
  });
};
