import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, isStudentActive, type FrontendRole } from "@/lib/auth";

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
export function StudentStatusGuard({ children, role, publicRoutes = [] }: StudentStatusGuardProps) {
  const { loaded, user } = useAuth();
  const nav = useNavigate();
  const routerState = useRouterState();

  // Default public routes for all students
  const defaultPublicRoutes = [
    "/student/profile",
    "/student/settings",
    "/student/settings/theme",
    "/student/settings/language",
    "/student/settings/notifications",
  ];
  
  const allPublicRoutes = [...defaultPublicRoutes, ...publicRoutes];

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
      (route) => currentPath === route || currentPath.startsWith(route + "/")
    );

    // Guest students (not joined any class) cannot access protected routes
    // Redirect to intro page where they can learn about the program and join a class
    if (user.role === "student" && !isStudentActive(user) && !isPublicRoute) {
      nav({ to: "/student/intro", replace: true });
      return;
    }
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
    (route) => currentPath === route || currentPath.startsWith(route + "/")
  );

  // Block guest students from protected routes
  if (user.role === "student" && !isStudentActive(user) && !isPublicRoute) {
    return null;
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
