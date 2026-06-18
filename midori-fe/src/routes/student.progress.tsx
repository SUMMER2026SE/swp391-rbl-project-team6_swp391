import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/student/progress")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/student/progress" || location.pathname === "/student/progress/") {
      throw redirect({ to: "/student/progress/statistics" });
    }
  },
  component: () => <Outlet />,
});
