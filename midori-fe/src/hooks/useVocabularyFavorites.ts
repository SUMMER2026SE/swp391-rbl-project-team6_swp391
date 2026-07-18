"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vocabularyFavoriteApi, type VocabularyFavoriteResponse } from "@/lib/api/vocabularyFavorite";

interface UseVocabularyFavoritesOptions {
  lessonId?: string;
  enabled?: boolean;
}

interface UseVocabularyFavoritesReturn {
  // Data
  favoriteIds: string[];
  favorites: VocabularyFavoriteResponse[];
  
  // Loading states
  isLoading: boolean;
  isLoadingIds: boolean;
  isToggling: boolean;
  togglingId: string | null;
  
  // Actions
  toggleFavorite: (vocabularyItemId: string) => Promise<void>;
  addFavorite: (vocabularyItemId: string) => Promise<void>;
  removeFavorite: (vocabularyItemId: string) => Promise<void>;
  refresh: () => void;
  
  // Utilities
  isFavorite: (vocabularyItemId: string) => boolean;
  error: Error | null;
}

export function useVocabularyFavorites(
  options: UseVocabularyFavoritesOptions = {}
): UseVocabularyFavoritesReturn {
  const { lessonId, enabled = true } = options;
  const queryClient = useQueryClient();
  
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Query for favorite IDs (lightweight)
  const {
    data: favoriteIds = [],
    isLoading: isLoadingIds,
    refetch: refetchIds,
  } = useQuery({
    queryKey: lessonId 
      ? ["vocabulary-favorites", "lesson", lessonId, "ids"] 
      : ["vocabulary-favorites", "ids"],
    queryFn: () => lessonId 
      ? vocabularyFavoriteApi.getLessonFavoriteIds(lessonId)
      : vocabularyFavoriteApi.getFavoriteIds(),
    enabled: enabled && !!lessonId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Query for full favorite data (when viewing "Only Saved Words")
  const {
    data: favorites = [],
    isLoading: isLoadingFavorites,
    refetch: refetchFavorites,
  } = useQuery({
    queryKey: lessonId 
      ? ["vocabulary-favorites", "lesson", lessonId] 
      : ["vocabulary-favorites"],
    queryFn: () => lessonId 
      ? vocabularyFavoriteApi.getLessonFavorites(lessonId)
      : vocabularyFavoriteApi.getFavorites(),
    enabled: enabled && !!lessonId,
    staleTime: 30 * 1000,
  });

  const isLoading = isLoadingIds || isLoadingFavorites;

  // Toggle favorite mutation
  const toggleMutation = useMutation({
    mutationFn: async (vocabularyItemId: string) => {
      setTogglingId(vocabularyItemId);
      setError(null);
      try {
        const result = await vocabularyFavoriteApi.toggleFavorite(vocabularyItemId);
        return { vocabularyItemId, isNowFavorite: result !== null };
      } finally {
        setTogglingId(null);
      }
    },
    onMutate: async (vocabularyItemId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: lessonId
          ? ["vocabulary-favorites", "lesson", lessonId, "ids"]
          : ["vocabulary-favorites", "ids"]
      });

      // Snapshot previous value
      const previousIds = queryClient.getQueryData<string[]>(
        lessonId
          ? ["vocabulary-favorites", "lesson", lessonId, "ids"]
          : ["vocabulary-favorites", "ids"]
      );

      // Optimistically update cache
      const queryKey = lessonId
        ? ["vocabulary-favorites", "lesson", lessonId, "ids"]
        : ["vocabulary-favorites", "ids"];

      if (previousIds) {
        const isFav = previousIds.includes(vocabularyItemId);
        const newIds = isFav
          ? previousIds.filter(id => id !== vocabularyItemId)
          : [...previousIds, vocabularyItemId];
        queryClient.setQueryData<string[]>(queryKey, newIds);
      }

      return { previousIds };
    },
    onSuccess: () => {
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: lessonId
          ? ["vocabulary-favorites", "lesson", lessonId]
          : ["vocabulary-favorites"]
      });
      queryClient.invalidateQueries({
        queryKey: lessonId
          ? ["vocabulary-favorites", "lesson", lessonId, "ids"]
          : ["vocabulary-favorites", "ids"]
      });
    },
    onError: (err: Error, _variables, context) => {
      setError(err);
      // Rollback on error
      if (context?.previousIds) {
        queryClient.setQueryData(
          lessonId
            ? ["vocabulary-favorites", "lesson", lessonId, "ids"]
            : ["vocabulary-favorites", "ids"],
          context.previousIds
        );
      }
    },
  });

  const toggleFavorite = useCallback(
    async (vocabularyItemId: string) => {
      await toggleMutation.mutateAsync(vocabularyItemId);
    },
    [toggleMutation]
  );

  const addFavorite = useCallback(
    async (vocabularyItemId: string) => {
      setTogglingId(vocabularyItemId);
      setError(null);
      try {
        await vocabularyFavoriteApi.addFavorite(vocabularyItemId);
        queryClient.invalidateQueries({
          queryKey: lessonId
            ? ["vocabulary-favorites", "lesson", lessonId]
            : ["vocabulary-favorites"]
        });
        queryClient.invalidateQueries({
          queryKey: lessonId
            ? ["vocabulary-favorites", "lesson", lessonId, "ids"]
            : ["vocabulary-favorites", "ids"]
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to add favorite"));
        throw err;
      } finally {
        setTogglingId(null);
      }
    },
    [queryClient, lessonId]
  );

  const removeFavorite = useCallback(
    async (vocabularyItemId: string) => {
      setTogglingId(vocabularyItemId);
      setError(null);
      try {
        await vocabularyFavoriteApi.removeFavorite(vocabularyItemId);
        queryClient.invalidateQueries({
          queryKey: lessonId
            ? ["vocabulary-favorites", "lesson", lessonId]
            : ["vocabulary-favorites"]
        });
        queryClient.invalidateQueries({
          queryKey: lessonId
            ? ["vocabulary-favorites", "lesson", lessonId, "ids"]
            : ["vocabulary-favorites", "ids"]
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to remove favorite"));
        throw err;
      } finally {
        setTogglingId(null);
      }
    },
    [queryClient, lessonId]
  );

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: lessonId
        ? ["vocabulary-favorites", "lesson", lessonId]
        : ["vocabulary-favorites"]
    });
    queryClient.invalidateQueries({
      queryKey: lessonId
        ? ["vocabulary-favorites", "lesson", lessonId, "ids"]
        : ["vocabulary-favorites", "ids"]
    });
  }, [queryClient, lessonId]);

  const isFavorite = useCallback(
    (vocabularyItemId: string) => favoriteIds.includes(vocabularyItemId),
    [favoriteIds]
  );

  return {
    favoriteIds,
    favorites,
    isLoading,
    isLoadingIds,
    isToggling: togglingId !== null,
    togglingId,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    refresh,
    isFavorite,
    error,
  };
}
