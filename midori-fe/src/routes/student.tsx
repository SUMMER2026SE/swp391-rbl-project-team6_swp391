import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Outlet } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";

export const Route = createFileRoute("/student")({
  component: () => (
    <AuthGuard role="student">
      <DashboardLayout role="student">
        <Outlet />
      </DashboardLayout>
    </AuthGuard>
  ),
});
