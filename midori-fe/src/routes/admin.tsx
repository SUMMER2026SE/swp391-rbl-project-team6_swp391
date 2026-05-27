import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: () => (
    <DashboardLayout role="admin">
      <Outlet />
    </DashboardLayout>
  ),
});
