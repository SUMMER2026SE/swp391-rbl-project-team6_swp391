import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  getRouteGuardRedirect,
  getTeacherPendingRedirect,
  type FrontendRole,
  useAuth,
} from "@/lib/auth";

type AuthGuardProps = {
  children: React.ReactNode;
  role?: FrontendRole;
  pendingOnly?: boolean;
};

export function AuthGuard({ children, role, pendingOnly = false }: AuthGuardProps) {
  const { loaded, user } = useAuth();
  const nav = useNavigate();

  const redirectTo = pendingOnly
    ? getTeacherPendingRedirect(user)
    : role
      ? getRouteGuardRedirect(user, role)
      : null;

  useEffect(() => {
    if (!loaded || !redirectTo) return;
    nav({ to: redirectTo, replace: true });
  }, [loaded, nav, redirectTo]);

  if (!loaded || redirectTo) {
    return null;
  }

  return <>{children}</>;
}
