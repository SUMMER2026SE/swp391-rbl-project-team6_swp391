import { useQuery } from "@tanstack/react-query";
import { classesApi } from "@/lib/api/classes";

export function useStudentProgress(classId: string, studentId: string) {
  return useQuery({
    queryKey: ["studentProgress", classId, studentId],
    queryFn: () => classesApi.getStudentProgress(classId, studentId),
    enabled: !!classId && !!studentId,
  });
}
