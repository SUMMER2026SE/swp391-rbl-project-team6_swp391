import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/classes/$classId/progress")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/teacher/progress",
      search: { classId: params.classId, view: "homework" as const },
      replace: true,
    });
  },
});
