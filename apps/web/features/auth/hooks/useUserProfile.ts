import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../services/auth";
import { queryKeys } from "@/constants/queryKeys";

export const useProfile = () => {
  return useQuery({
    queryKey: [queryKeys.PROFILE],
    queryFn: getProfile,
  });
};
