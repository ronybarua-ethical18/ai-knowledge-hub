import { apiClient } from "@/lib/react-query/api-client";

export type FileStatus = "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED";
export type FileType = "PDF" | "DOCX" | "TXT";

export interface UserFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileType: FileType;
  status: FileStatus;
  createdAt: string;
  processedAt: string | null;
  errorMessage: string | null;
}

// Responses are wrapped by the backend TransformInterceptor as { data, ... }.
export const getUserFiles = async (
  workspaceId?: string,
): Promise<UserFile[]> => {
  const response = await apiClient.get("/files", {
    params: workspaceId ? { workspaceId } : undefined,
  });
  return response.data.data;
};

export const deleteFile = async (fileId: string): Promise<void> => {
  await apiClient.delete(`/files/${fileId}`);
};
