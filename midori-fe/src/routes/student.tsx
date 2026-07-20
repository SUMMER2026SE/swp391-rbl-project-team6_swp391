import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Outlet } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { StudentStatusGuard } from "@/components/student-status-guard";

export const Route = createFileRoute("/student")({
  component: StudentLayout,
});

function StudentLayout() {
  const routerState = useRouterState();
  const isLessonPage = routerState.location.pathname.includes("/learning/japanese/lesson/");
  const hideFooter = isLessonPage;

  return (
    <AuthGuard role="student">
      <DashboardLayout role="student" hideFooter={hideFooter}>
        <StudentStatusGuard>
          <Outlet />
        </StudentStatusGuard>
      </DashboardLayout>
    </AuthGuard>
  );
}
