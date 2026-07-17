import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListeningApi,
  type ListeningDetailResponse,
  type ListeningItemResponse,
  type ListeningLessonResponse,
} from "@/lib/api/listening";
import type {
  ListeningLessonWithItemsRequest,
} from "@/types/content-library";

export const adminListeningKeys = {
  all: ["adminListening"] as const,
  lessons: (level?: string) => ["adminListening", "lessons", { level }] as const,
  detail: (id: string) => ["adminListeningDetail", id] as const,
  items: (lessonId: string) => ["adminListeningItems", lessonId] as const,
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
 * Fetch a single listening lesson with its items.
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
 * Fetch all items for a lesson.
 */
export function useFetchListeningItems(lessonId: string) {
  return useQuery({
    queryKey: adminListeningKeys.items(lessonId),
    queryFn: () => adminListeningApi.getAdminListeningLesson(lessonId).then((d) => d.listeningItems ?? []),
    select: (data: ListeningItemResponse[]) => data,
    enabled: !!lessonId,
  });
}

/**
 * Create a new listening lesson with items.
 */
export function useCreateListeningLesson(level: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ListeningLessonWithItemsRequest) =>
      adminListeningApi.createListeningLesson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.lessons(level) });
    },
  });
}

/**
 * Update an existing listening lesson with items.
 */
export function useUpdateListeningLesson(level: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ListeningLessonWithItemsRequest) =>
      adminListeningApi.updateListeningLesson(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.lessons(level) });
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.detail(lessonId) });
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.items(lessonId) });
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
    },
  });
}

/**
 * Add a single listening item to an existing lesson.
 */
export function useCreateListeningItem(lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => adminListeningApi.createListeningItem(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.detail(lessonId) });
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.items(lessonId) });
    },
  });
}

/**
 * Update an existing listening item.
 */
export function useUpdateListeningItem(lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: unknown }) =>
      adminListeningApi.updateListeningItem(lessonId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.detail(lessonId) });
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.items(lessonId) });
    },
  });
}

/**
 * Delete a listening item.
 */
export function useDeleteListeningItem(lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => adminListeningApi.deleteListeningItem(lessonId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.detail(lessonId) });
      queryClient.invalidateQueries({ queryKey: adminListeningKeys.items(lessonId) });
    },
  });
}