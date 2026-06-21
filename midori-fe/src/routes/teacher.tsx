import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth-guard";
import { TeacherShell } from "@/components/teacher/teacher-shell";

export const Route = createFileRoute("/teacher")({
  component: () => (
    <AuthGuard role="teacher">
      <TeacherShell>
        <Outlet />
      </TeacherShell>
    </AuthGuard>
  ),
});
