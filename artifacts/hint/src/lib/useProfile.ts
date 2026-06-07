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

function localProfileKey(anonId: string) {
  return `hint_profile_v2_${anonId}`;
}

function readLocalProfile(anonId: string): Profile | null {
  try {
    const raw = window.localStorage.getItem(localProfileKey(anonId));
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

function writeLocalProfile(anonId: string, input: Omit<ProfileInput, "anonId">): Profile {
  const existing = readLocalProfile(anonId);
  const profile: Profile = {
    anonId,
    name: input.name,
    birthDate: input.birthDate,
    birthTime: input.birthTime ?? null,
    birthPlace: input.birthPlace ?? null,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(localProfileKey(anonId), JSON.stringify(profile));
  } catch {
    // If localStorage is blocked, still return the in-memory value for this save.
  }

  return profile;
}

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
          return readLocalProfile(anonId);
        }

        return readLocalProfile(anonId);
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

  async function saveProfile(input: Omit<ProfileInput, "anonId">) {
    try {
      const saved = await saveMutation.mutateAsync({ data: { ...input, anonId } });
      queryClient.setQueryData(queryKey, saved);
      writeLocalProfile(anonId, input);
      return saved;
    } catch {
      const saved = writeLocalProfile(anonId, input);
      queryClient.setQueryData(queryKey, saved);
      return saved;
    }
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
