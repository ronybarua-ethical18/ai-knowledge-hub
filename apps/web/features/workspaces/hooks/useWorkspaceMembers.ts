import { useQuery } from "@tanstack/react-query";
import { getWorkspaceMembers } from "../services/workspaces";

export const workspaceMembersQueryKey = (workspaceId?: string) => [
  "workspace-members",
  workspaceId,
];

export const useWorkspaceMembers = (workspaceId?: string) => {
  return useQuery({
    queryKey: workspaceMembersQueryKey(workspaceId),
    queryFn: () => getWorkspaceMembers(workspaceId as string),
    enabled: Boolean(workspaceId),
    staleTime: 60 * 1000,
  });
};
