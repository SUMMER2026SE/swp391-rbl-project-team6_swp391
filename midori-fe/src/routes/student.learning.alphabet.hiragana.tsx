import { createFileRoute, Outlet, Navigate, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/student/learning/alphabet/hiragana")({
  component: HiraganaOverviewPage,
});

function HiraganaOverviewPage() {
  const routerState = useRouterState();
  const isExactRoute = routerState.location.pathname === "/student/learning/alphabet/hiragana";

  if (isExactRoute) {
    return <Navigate to="/student/learning/alphabet" replace />;
  }

  return <Outlet />;
}
