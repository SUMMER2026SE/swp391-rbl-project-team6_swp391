import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Outlet } from "@tanstack/react-router";
import { isTeacherPending } from "@/lib/auth";

export const Route = createFileRoute("/teacher")({
  beforeLoad: () => {
    if (isTeacherPending()) {
      throw redirect({ to: "/teacher-pending" });
    }
  },
  component: TeacherLayout,
});

function TeacherLayout() {
  return (
    <DashboardLayout role="teacher">
      <Outlet />
    </DashboardLayout>
  );
}
