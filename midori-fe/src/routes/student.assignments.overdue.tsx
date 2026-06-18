import { createFileRoute } from "@tanstack/react-router";
import { AssignmentsDashboard } from "@/components/assignments-dashboard";

export const Route = createFileRoute("/student/assignments/overdue")({
  component: () => <AssignmentsDashboard activeTab="overdue" />,
});
