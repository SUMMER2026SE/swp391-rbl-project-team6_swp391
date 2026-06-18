import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/student/assignments")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/student/assignments" || location.pathname === "/student/assignments/") {
      throw redirect({ to: "/student/assignments/all" });
    }
  },
  component: () => <Outlet />,
});
