import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  login,
  register,
  logout,
  getCurrentUser,
  getStoredUser,
  getStoredToken,
  getStoredWorkspaces,
} from "../services/auth";
import { queryKeys } from "@/constants/queryKeys";
import { getApiErrorMessage } from "@/lib/api-errors";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData([queryKeys.AUTH, "user"], data.user);
      queryClient.invalidateQueries({ queryKey: [queryKeys.AUTH] });
      toast.success("Login successful!");
      router.push("/");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Login failed"));
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      queryClient.setQueryData([queryKeys.AUTH, "user"], data.user);
      queryClient.invalidateQueries({ queryKey: [queryKeys.AUTH] });
      toast.success("Registration successful!");
      router.push("/");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Registration failed"));
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      toast.success("Logged out successfully!");
      router.push("/login");
    },
    onError: () => {
      queryClient.clear();
      router.push("/login");
    },
  });
};

export const useCurrentUser = () => {
  const queryClient = useQueryClient();

  // Seed the cache from localStorage after mount only. Reading it as
  // `initialData` above (evaluated during render) diverges from the SSR
  // pass, which has no localStorage — that caused a hydration mismatch
  // (server renders the logged-out/fallback UI, client instantly shows the
  // cached user).
  useEffect(() => {
    const stored = getStoredUser();
    if (
      stored &&
      queryClient.getQueryData([queryKeys.AUTH, "user"]) === undefined
    ) {
      queryClient.setQueryData([queryKeys.AUTH, "user"], stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useQuery({
    queryKey: [queryKeys.AUTH, "user"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!getStoredToken(),
    placeholderData: null,
  });
};

export const useAuth = () => {
  const { data: user, isLoading, error } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const workspaces = getStoredWorkspaces();
  const currentWorkspace = workspaces.length > 0 ? workspaces[0] : null; // Use first workspace as default

  return useMemo(
    () => ({
      user,
      isLoading,
      error,
      isAuthenticated: !!user,
      workspaces,
      currentWorkspace,
      login: loginMutation.mutate,
      register: registerMutation.mutate,
      logout: logoutMutation.mutate,
      isLoggingIn: loginMutation.isPending,
      isRegistering: registerMutation.isPending,
      isLoggingOut: logoutMutation.isPending,
    }),
    [
      user,
      isLoading,
      error,
      workspaces,
      currentWorkspace,
      loginMutation,
      registerMutation,
      logoutMutation,
    ],
  );
};
