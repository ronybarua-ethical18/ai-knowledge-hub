import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/react-query/api-client";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "@/lib/api-errors";
import { filesQueryKey } from "@/features/files/hooks/useFiles";

export const useFileUpload = () => {
  const queryClient = useQueryClient();

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
    onSuccess: (_data, variables) => {
      // Surface the new file (status UPLOADED) in the sidebar right away;
      // useFiles then polls until it reaches PROCESSED/FAILED.
      queryClient.invalidateQueries({
        queryKey: filesQueryKey(variables.workspaceId),
      });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Upload failed"));
    },
  });
};
