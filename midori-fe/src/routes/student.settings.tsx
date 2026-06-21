import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/student/settings")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/student/settings" || location.pathname === "/student/settings/") {
      throw redirect({ to: "/student/settings/theme" });
    }
  },
  component: () => <Outlet />,
});
