/**
 * useProfile — the current anonymous user's saved identity. Returns the
 * profile (or null when none exists yet), loading state, and a save mutation
 * used by both onboarding and the Me edit flow.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfile,
  useSaveProfile,
  getGetProfileQueryKey,
} from "@workspace/api-client-react";
import type { Profile, ProfileInput } from "@workspace/api-client-react";
import { getAnonId } from "./identity";

export function useProfile() {
  const anonId = getAnonId();
  const queryClient = useQueryClient();
  const queryKey = getGetProfileQueryKey({ anonId });

  const query = useQuery<Profile | null>({
    queryKey,
    queryFn: async () => {
      try {
        return await getProfile({ anonId });
      } catch (error) {
        if ((error as { status?: number }).status === 404) {
          return null;
        }

        throw error;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const saveMutation = useSaveProfile({
    mutation: {
      onSuccess: (saved) => {
        queryClient.setQueryData(queryKey, saved);
      },
    },
  });

  const profile = query.data ?? null;
  const isMissing = query.isSuccess && query.data === null;

  function saveProfile(input: Omit<ProfileInput, "anonId">) {
    return saveMutation.mutateAsync({ data: { ...input, anonId } });
  }

  return {
    anonId,
    profile,
    isLoading: query.isLoading,
    isMissing,
    isError: query.isError,
    saveProfile,
    isSaving: saveMutation.isPending,
    refetch: query.refetch,
  };
}
