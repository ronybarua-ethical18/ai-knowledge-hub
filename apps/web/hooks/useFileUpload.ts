import { useMutation } from "@tanstack/react-query";
import { apiClient } from "../lib/react-query/api-client";
import toast from "react-hot-toast";

export const useFileUpload = () => {
  return useMutation({
    mutationFn: async ({
      file,
      workspaceId,
    }: {
      file: File;
      workspaceId: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post(
        `/files/upload?workspaceId=${workspaceId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Remove the toast from here - let the component handle it
      // toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Upload failed");
    },
  });
};
