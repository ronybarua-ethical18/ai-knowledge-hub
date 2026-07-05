import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getUserFiles, deleteFile, UserFile } from "../services/files";
import { getApiErrorMessage } from "@/lib/api-errors";

export const filesQueryKey = (workspaceId?: string) => ["files", workspaceId];

/**
 * Lists a workspace's files and auto-refreshes while any file is still being
 * processed, so the sidebar reflects UPLOADED → PROCESSING → PROCESSED/FAILED
 * without a manual reload.
 */
export const useFiles = (workspaceId?: string) => {
  return useQuery({
    queryKey: filesQueryKey(workspaceId),
    queryFn: () => getUserFiles(workspaceId),
    enabled: Boolean(workspaceId),
    // Poll only while something is in-flight; stop once everything settles.
    refetchInterval: (query) => {
      const files = query.state.data as UserFile[] | undefined;
      const hasPending = files?.some(
        (f) => f.status === "UPLOADED" || f.status === "PROCESSING",
      );
      return hasPending ? 3000 : false;
    },
  });
};

export const useDeleteFile = (workspaceId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => deleteFile(fileId),
    onSuccess: () => {
      toast.success("File deleted");
      queryClient.invalidateQueries({ queryKey: filesQueryKey(workspaceId) });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to delete file"));
    },
  });
};
