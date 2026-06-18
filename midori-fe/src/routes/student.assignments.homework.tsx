import { createFileRoute } from "@tanstack/react-router";
import { AssignmentsDashboard } from "@/components/assignments-dashboard";

export const Route = createFileRoute("/student/assignments/homework")({
  component: () => <AssignmentsDashboard activeTab="homework" />,
});
