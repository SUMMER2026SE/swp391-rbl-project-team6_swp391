import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/classes/$classId/students")({
  component: () => <Outlet />,
});
