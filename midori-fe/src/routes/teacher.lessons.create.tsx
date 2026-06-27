import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/lessons/create")({
  beforeLoad: () => {
    throw redirect({ to: "/teacher/homework", replace: true });
  },
});
