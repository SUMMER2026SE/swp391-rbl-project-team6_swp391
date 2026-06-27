import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/lessons")({
  beforeLoad: () => {
    throw redirect({ to: "/teacher", replace: true });
  },
});
