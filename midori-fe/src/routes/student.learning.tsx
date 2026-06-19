import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/student/learning")({
  component: LearningLayout,
});

function LearningLayout() {
  return <Outlet />;
}
