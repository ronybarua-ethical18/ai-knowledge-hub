import { useQuery } from "@tanstack/react-query";
import { getPost, getPosts } from "../services/auth";
import { queryKeys } from "@/constants/queryKeys";

export const usePosts = () => {
  return useQuery({
    queryKey: [queryKeys.POSTS],
    queryFn: getPosts,
    // Add some options for better testing
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

// You can also add a hook for individual posts
export const usePost = (postId: number) => {
  return useQuery({
    queryKey: [queryKeys.POSTS, postId],
    queryFn: () => getPost(postId),
    enabled: !!postId, // Only run if postId exists
  });
};
