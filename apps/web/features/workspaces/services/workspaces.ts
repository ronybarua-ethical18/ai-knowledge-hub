import { apiClient } from "@/lib/react-query/api-client";

export type WorkspaceRole = "OWNER" | "MEMBER" | "VIEWER";

// Mirrors the backend WorkspaceResponseDto. `role` is the *current user's*
// role in this workspace, returned alongside the workspace at login.
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  slug: string;
  isPublic: boolean;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
}

// Mirrors the backend WorkspaceMemberResponseDto.
export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
  };
  createdAt: string;
}

// Responses are wrapped by the backend TransformInterceptor as { data, ... }.
export const getWorkspaceMembers = async (
  workspaceId: string,
): Promise<WorkspaceMember[]> => {
  const response = await apiClient.get(
    `/auth/workspaces/${workspaceId}/members`,
  );
  return response.data.data;
};
