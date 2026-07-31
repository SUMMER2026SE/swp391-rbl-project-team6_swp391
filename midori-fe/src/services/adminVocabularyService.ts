import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminVocabularyApi,
  type VocabularyDetailResponse,
  type VocabularyLessonResponse,
  type VocabularyLessonWithItemsRequest,
} from "@/lib/api/vocabulary";

export const adminVocabularyKeys = {
  all: ["adminVocabulary"] as const,
  lessons: (level?: string) => ["adminVocabulary", "lessons", { level }] as const,
  detail: (id: string) => ["adminVocabularyDetail", id] as const,
};

/**
 * Fetch all vocabulary lessons for a given level.
 */
export function useFetchVocabularyLessons(level: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminVocabularyKeys.lessons(level),
    queryFn: () => adminVocabularyApi.getAdminVocabularyLessons({ level }),
    select: (data: VocabularyLessonResponse[]) => data,
    ...options,
  });
}

/**
 * Fetch a single vocabulary lesson with its items.
 */
export function useFetchVocabularyDetail(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminVocabularyKeys.detail(id),
    queryFn: () => adminVocabularyApi.getAdminVocabularyLesson(id),
    select: (data: VocabularyDetailResponse) => data,
    enabled: id ? (options?.enabled ?? true) : false,
  });
}

/**
 * Create a new vocabulary lesson with items.
 */
export function useCreateVocabularyLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VocabularyLessonWithItemsRequest) =>
      adminVocabularyApi.createVocabularyLesson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminVocabularyKeys.lessons(level) });
    },
  });
}

/**
 * Update an existing vocabulary lesson with items.
 */
export function useUpdateVocabularyLesson(level: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VocabularyLessonWithItemsRequest) =>
      adminVocabularyApi.updateVocabularyLesson(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminVocabularyKeys.lessons(level) });
      queryClient.invalidateQueries({ queryKey: adminVocabularyKeys.detail(lessonId) });
    },
  });
}

/**
 * Delete a vocabulary lesson.
 */
export function useDeleteVocabularyLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminVocabularyApi.deleteVocabularyLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminVocabularyKeys.lessons(level) });
    },
  });
}

/**
 * Publish a vocabulary lesson (make it active).
 */
export function usePublishVocabularyLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminVocabularyApi.publishVocabularyLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminVocabularyKeys.lessons(level) });
    },
  });
}

/**
 * Unpublish a vocabulary lesson (make it inactive).
 */
export function useUnpublishVocabularyLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminVocabularyApi.unpublishVocabularyLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminVocabularyKeys.lessons(level) });
    },
  });
}