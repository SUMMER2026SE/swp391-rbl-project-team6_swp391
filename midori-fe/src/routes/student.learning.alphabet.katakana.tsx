import { createFileRoute, Outlet, Navigate, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/student/learning/alphabet/katakana")({
  component: KatakanaOverviewPage,
});

function KatakanaOverviewPage() {
  const routerState = useRouterState();
  const isExactRoute = routerState.location.pathname === "/student/learning/alphabet/katakana";

  if (isExactRoute) {
    return <Navigate to="/student/learning/alphabet" replace />;
  }

  return <Outlet />;
}
