import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/classes/$classId/lessons")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/teacher/classes/$classId",
      params: { classId: params.classId },
      replace: true,
    });
  },
});
