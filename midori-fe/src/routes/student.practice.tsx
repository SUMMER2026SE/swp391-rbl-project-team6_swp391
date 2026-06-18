import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/student/practice")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/student/practice" || location.pathname === "/student/practice/") {
      throw redirect({ to: "/student/practice/flashcards" });
    }
  },
  component: () => <Outlet />,
});
