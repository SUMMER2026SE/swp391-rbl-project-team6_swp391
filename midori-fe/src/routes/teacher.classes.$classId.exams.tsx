import { createFileRoute } from "@tanstack/react-router";
import { TeacherClassExamsTab } from "@/components/teacher/class-detail/TeacherClassExamsTab";

export const Route = createFileRoute("/teacher/classes/$classId/exams")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: ClassExamsRoute,
});

function ClassExamsRoute() {
  const { classId } = Route.useParams();
  const { q: urlQ } = Route.useSearch();
  return <TeacherClassExamsTab classId={classId} urlQ={urlQ} />;
}
