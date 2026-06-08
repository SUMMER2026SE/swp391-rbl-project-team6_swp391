import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Outlet } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AuthGuard role="admin">
      <DashboardLayout role="admin">
        <Outlet />
      </DashboardLayout>
    </AuthGuard>
  ),
});
