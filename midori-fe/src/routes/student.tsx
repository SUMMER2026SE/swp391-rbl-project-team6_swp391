import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/student")({
  component: () => (
    <DashboardLayout role="student">
      <Outlet />
    </DashboardLayout>
  ),
});
