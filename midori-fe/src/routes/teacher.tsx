import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Outlet } from "@tanstack/react-router";

type StoredUser = {
  role?: string;
  status?: string;
};

export const Route = createFileRoute("/teacher")({
  beforeLoad: () => {
    if (typeof window === "undefined") {
      return;
    }

    const rawUser = localStorage.getItem("midori_user");
    const token = localStorage.getItem("midori_access_token");

    if (!rawUser || !token) {
      throw redirect({ to: "/login" });
    }

    try {
      const user = JSON.parse(rawUser) as StoredUser;
      if (user.role !== "teacher") {
        throw redirect({ to: "/login" });
      }
      if (user.status !== "active") {
        throw redirect({ to: "/teacher-pending" });
      }
    } catch {
      localStorage.removeItem("midori_user");
      localStorage.removeItem("midori_access_token");
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <DashboardLayout role="teacher">
      <Outlet />
    </DashboardLayout>
  ),
});
