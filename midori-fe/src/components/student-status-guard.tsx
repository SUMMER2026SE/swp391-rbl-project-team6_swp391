import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, isStudentActive, type FrontendRole } from "@/lib/auth";
import { Lock } from "lucide-react";

type StudentStatusGuardProps = {
  children: React.ReactNode;
  role?: FrontendRole;
  /**
   * Routes that are accessible to all students including guests.
   * Guest students will be redirected from protected routes.
   */
  publicRoutes?: string[];
};

/**
 * Guard component that protects learning routes from guest students.
 *
 * Guest students (not joined any class) will be redirected to the landing page.
 * Only active students (joined a class) can access protected learning routes.
 *
 * Public routes (profile, settings, etc.) are always accessible.
 *
 * Usage:
 * <StudentStatusGuard>
 *   <ProtectedContent />
 * </StudentStatusGuard>
 */
const DEFAULT_PUBLIC_ROUTES = [
  "/student/landing",
  "/student/profile",
  "/student/settings",
  "/student/settings/theme",
  "/student/settings/language",
  "/student/settings/notifications",
];

import { useMemo } from "react";

export function StudentStatusGuard({ children, role, publicRoutes = [] }: StudentStatusGuardProps) {
  const { loaded, user } = useAuth();
  const nav = useNavigate();
  const routerState = useRouterState();

  const serializedPublicRoutes = publicRoutes.join(",");
  const allPublicRoutes = useMemo(() => {
    return [...DEFAULT_PUBLIC_ROUTES, ...publicRoutes];
  }, [serializedPublicRoutes]);

  useEffect(() => {
    if (!loaded) return;

    // Check if user is logged in
    if (!user) {
      nav({ to: "/login", replace: true });
      return;
    }

    // Check role match
    if (role && user.role !== role) {
      nav({ to: `/${user.role}`, replace: true });
      return;
    }

    // Check if current route is a public route
    const currentPath = routerState.location.pathname;
    const isPublicRoute = allPublicRoutes.some(
      (route) => currentPath === route || currentPath.startsWith(route + "/"),
    );

    // Guest students (not joined any class) can now see the layout but features will be locked.
    // No redirect here so they can see the locked UI.
  }, [loaded, user, role, nav, routerState.location.pathname, allPublicRoutes]);

  if (!loaded) {
    return null;
  }

  // Don't render children if redirecting
  if (!user || (role && user.role !== role)) {
    return null;
  }

  // Allow access to public routes for all students
  const currentPath = routerState.location.pathname;
  const isPublicRoute = allPublicRoutes.some(
    (route) => currentPath === route || currentPath.startsWith(route + "/"),
  );

  // Block guest students from protected routes with a Demo mode UI
  if (user.role === "student" && !isStudentActive(user) && !isPublicRoute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center">
          <Lock className="w-12 h-12" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Tính năng xem trước (Demo Mode)</h2>
          <p className="text-muted-foreground">
            Đây là tính năng dành cho học viên chính thức. Bạn cần được giáo viên thêm vào lớp học để có thể bắt đầu sử dụng.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to check if current user can access protected student content.
 *
 * @returns true if student is active (can access learning content)
 * @returns false if student is guest (cannot access learning content)
 */
export function useStudentAccess() {
  const { user } = useAuth();

  return {
    canAccessLearning: user?.role === "student" && isStudentActive(user),
    isGuest: user?.role === "student" && !isStudentActive(user),
    isActive: user?.role === "student" && isStudentActive(user),
  };
}
