import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/classes/$classId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/teacher/classes/$classId/progress",
      params: { classId: params.classId },
    });
  },
});
