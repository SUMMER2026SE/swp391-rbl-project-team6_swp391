import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListeningApi,
  type ListeningDetailResponse,
  type ListeningLessonResponse,
} from "@/lib/api/listening";
import type { ListeningLessonWithQuestionsRequest } from "@/types/content-library";

export const adminListeningKeys = {
  all: ["adminListening"] as const,
  lessons: (level?: string) => ["adminListening", "lessons", { level }] as const,
  detail: (id: string) => ["adminListeningDetail", id] as const,
};

/**
 * Fetch all listening lessons for a given level (with optional filters).
 */
export function useFetchListeningLessons(level: string) {
  return useQuery({
    queryKey: adminListeningKeys.lessons(level),
    queryFn: () => adminListeningApi.getAdminListeningLessons({ level }),
    select: (data: ListeningLessonResponse[]) => data,
  });
}

/**
 * Fetch a single listening lesson with its questions.
 */
export function useFetchListeningDetail(id: string) {
  return useQuery({
    queryKey: adminListeningKeys.detail(id),
    queryFn: () => adminListeningApi.getAdminListeningLesson(id),
    select: (data: ListeningDetailResponse) => data,
    enabled: !!id,
  });
}

/**
 * Create a new listening lesson with questions.
 */
export function useCreateListeningLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ListeningLessonWithQuestionsRequest) =>
      adminListeningApi.createListeningLesson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.lessons(level) });
    },
  });
}

/**
 * Update an existing listening lesson with questions.
 */
export function useUpdateListeningLesson(level: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ListeningLessonWithQuestionsRequest) =>
      adminListeningApi.updateListeningLesson(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.lessons(level) });
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.detail(lessonId) });
    },
  });
}

/**
 * Delete a listening lesson.
 */
export function useDeleteListeningLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminListeningApi.deleteListeningLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.lessons(level) });
    },
  });
}

/**
 * Publish a listening lesson (make it active).
 */
export function usePublishListeningLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminListeningApi.publishListeningLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.lessons(level) });
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.detail(level) });
    },
  });
}

/**
 * Unpublish a listening lesson (make it inactive).
 */
export function useUnpublishListeningLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminListeningApi.unpublishListeningLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.lessons(level) });
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.detail(level) });
    },
  });
}
