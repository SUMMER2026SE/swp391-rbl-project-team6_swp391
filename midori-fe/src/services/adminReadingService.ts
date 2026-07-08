import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminReadingApi,
  type ReadingDetailResponse,
  type ReadingLessonResponse,
  type ReadingLessonWithQuestionsRequest,
} from "@/lib/api/reading";

export const adminReadingKeys = {
  all: ["adminReading"] as const,
  lessons: (level?: string) => ["adminReading", "lessons", { level }] as const,
  detail: (id: string) => ["adminReadingDetail", id] as const,
};

/**
 * Fetch all reading lessons for a given level (with optional filters).
 */
export function useFetchReadingLessons(level: string) {
  return useQuery({
    queryKey: adminReadingKeys.lessons(level),
    queryFn: () => adminReadingApi.getAdminReadingLessons({ level }),
    select: (data: import("@/lib/api/reading").ReadingLessonResponse[]) => data,
  });
}

/**
 * Fetch a single reading lesson with its questions.
 */
export function useFetchReadingDetail(id: string) {
  return useQuery({
    queryKey: adminReadingKeys.detail(id),
    queryFn: () => adminReadingApi.getAdminReadingLesson(id),
    select: (data: import("@/lib/api/reading").ReadingDetailResponse) => data,
    enabled: !!id,
  });
}

/**
 * Create a new reading lesson with questions.
 */
export function useCreateReadingLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReadingLessonWithQuestionsRequest) =>
      adminReadingApi.createReadingLesson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReadingKeys.lessons(level) });
    },
  });
}

/**
 * Update an existing reading lesson with questions.
 */
export function useUpdateReadingLesson(level: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReadingLessonWithQuestionsRequest) =>
      adminReadingApi.updateReadingLesson(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReadingKeys.lessons(level) });
      queryClient.invalidateQueries({ queryKey: adminReadingKeys.detail(lessonId) });
    },
  });
}

/**
 * Delete a reading lesson.
 */
export function useDeleteReadingLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminReadingApi.deleteReadingLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReadingKeys.lessons(level) });
    },
  });
}

/**
 * Publish a reading lesson (make it active).
 */
export function usePublishReadingLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminReadingApi.publishReadingLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReadingKeys.lessons(level) });
      queryClient.invalidateQueries({ queryKey: adminReadingKeys.detail(level) });
    },
  });
}

/**
 * Unpublish a reading lesson (make it inactive).
 */
export function useUnpublishReadingLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminReadingApi.unpublishReadingLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminReadingKeys.lessons(level) });
      queryClient.invalidateQueries({ queryKey: adminReadingKeys.detail(level) });
    },
  });
}
