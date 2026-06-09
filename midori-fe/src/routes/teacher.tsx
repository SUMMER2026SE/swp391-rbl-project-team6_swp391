import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Outlet } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";

export const Route = createFileRoute("/teacher")({
  component: () => (
    <AuthGuard role="teacher">
      <DashboardLayout role="teacher">
        <Outlet />
      </DashboardLayout>
    </AuthGuard>
  ),
});
