import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  manualHomeworkApi,
  ManualHomeworkRequest,
  AssignClassRequest,
} from "../lib/api/manualHomework";

export function useManualHomeworks() {
  return useQuery({
    queryKey: ["manual-homeworks"],
    queryFn: () => manualHomeworkApi.getManualHomeworks(),
  });
}

// Exact alias requested
export const useHomework = useManualHomework;

export function useManualHomework(id: string | undefined) {
  return useQuery({
    queryKey: ["manual-homework-detail", id],
    queryFn: () => {
      if (!id) throw new Error("No homework ID provided");
      return manualHomeworkApi.getManualHomeworkById(id);
    },
    enabled: !!id,
  });
}

// Exact alias requested
export function useHomeworkQuestions(id: string | undefined) {
  return useQuery({
    queryKey: ["manual-homework-questions", id],
    queryFn: async () => {
      if (!id) throw new Error("No homework ID provided");
      const res = await manualHomeworkApi.getManualHomeworkById(id);
      return res.questions || [];
    },
    enabled: !!id,
  });
}

// Exact alias requested
export const useCreateHomework = useCreateManualHomework;

export function useCreateManualHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (req: ManualHomeworkRequest) => manualHomeworkApi.createManualHomework(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-homeworks"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-homeworks"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    },
  });
}

// Exact alias requested
export const useUpdateHomework = useUpdateManualHomework;

export function useUpdateManualHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: ManualHomeworkRequest }) =>
      manualHomeworkApi.updateManualHomework(id, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-homeworks"] });
      queryClient.invalidateQueries({ queryKey: ["manual-homework-detail", data.id] });
      queryClient.invalidateQueries({ queryKey: ["manual-homework-questions", data.id] });
      queryClient.invalidateQueries({ queryKey: ["manual-homework-edit", data.id] });
      queryClient.invalidateQueries({ queryKey: ["teacher-homeworks"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-homework-detail", data.id] });
      queryClient.invalidateQueries({ queryKey: ["teacher-class-homeworks"] });
    },
  });
}

export function useDeleteManualHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => manualHomeworkApi.deleteManualHomework(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-homeworks"] });
    },
  });
}

export function usePublishManualHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, req }: { id: string; req?: AssignClassRequest }) =>
      manualHomeworkApi.publishManualHomework(id, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-homeworks"] });
      queryClient.invalidateQueries({ queryKey: ["manual-homework-detail", data.id] });
      queryClient.invalidateQueries({ queryKey: ["teacherAllHomeworks"] });
      queryClient.invalidateQueries({ queryKey: ["teacherHomeworksByClass"] });
      queryClient.invalidateQueries({ queryKey: ["teacherClassDetail"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-class-homeworks"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-class-detail"] });
      queryClient.invalidateQueries({ queryKey: ["student-my-classes"] });
      queryClient.invalidateQueries({ queryKey: ["student-homeworks"] });
      queryClient.invalidateQueries({ queryKey: ["student-class-homeworks"] });
    },
  });
}

export function useDraftManualHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => manualHomeworkApi.draftManualHomework(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-homeworks"] });
      queryClient.invalidateQueries({ queryKey: ["manual-homework-detail", data.id] });
    },
  });
}

export function useDuplicateManualHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => manualHomeworkApi.duplicateManualHomework(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manual-homeworks"] });
    },
  });
}

export function useAssignManualHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: AssignClassRequest }) =>
      manualHomeworkApi.assignManualHomework(id, req),
    onSuccess: () => {
      // Invalidate existing homework lists so the newly assigned class homework shows up immediately
      queryClient.invalidateQueries({ queryKey: ["teacherAllHomeworks"] });
      queryClient.invalidateQueries({ queryKey: ["teacherHomeworksByClass"] });
      queryClient.invalidateQueries({ queryKey: ["teacherClassDetail"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-class-homeworks"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-class-detail"] });
      queryClient.invalidateQueries({ queryKey: ["student-my-classes"] });
      queryClient.invalidateQueries({ queryKey: ["student-homeworks"] });
      queryClient.invalidateQueries({ queryKey: ["student-class-homeworks"] });
    },
  });
}
