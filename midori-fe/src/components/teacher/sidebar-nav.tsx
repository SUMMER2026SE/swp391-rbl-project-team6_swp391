import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, GraduationCap, TrendingUp,
  HelpCircle, FileBadge, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const groups = [
  {
    label: "Overview",
    items: [
      { to: "/teacher", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/teacher/classes", label: "My Classes", icon: GraduationCap },
    ],
  },
  {
    label: "Class Operations",
    items: [
      { to: "/teacher/progress", label: "Progress", icon: TrendingUp },
    ],
  },
  {
    label: "Content Libraries",
    items: [
      { to: "/teacher/my-questions", label: "My Questions", icon: HelpCircle },
      { to: "/teacher/question-bank", label: "Question Bank", icon: HelpCircle },
      { to: "/teacher/jlpt-bank", label: "JLPT Exam Bank", icon: FileBadge },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/teacher/notifications", label: "Notifications", icon: Bell },
    ],
  },
] as const;

interface SidebarNavProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export function SidebarNav({ onNavigate, collapsed = false }: SidebarNavProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact?: boolean) => {
    if (to === "/teacher/classes") {
      return pathname === "/teacher/classes" || (pathname.startsWith("/teacher/classes/") && pathname !== "/teacher/classes/create");
    }
    if (to === "/teacher/classes/create") {
      return pathname === "/teacher/classes/create";
    }
    if (exact) return pathname === to;
    if (to === "/teacher") return pathname === to;
    return pathname === to || pathname.startsWith(to + "/") || pathname.startsWith(to + "?");
  };

  if (collapsed) {
    return (
      <nav className="flex flex-col gap-1 px-1.5">
        {groups.map((g) => (
          <div key={g.label}>
            {g.items.map((it) => {
              const active = isActive(it.to, "exact" in it ? it.exact : false);
              return (
                <Tooltip key={it.to} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={it.to}
                      onClick={onNavigate}
                      className={cn(
                        "mb-0.5 flex h-9 w-full items-center justify-center rounded-lg px-2 transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <it.icon className="h-4 w-4 shrink-0" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2">
                    <span>{it.label}</span>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1 overflow-y-auto px-3 py-1">
      {groups.map((g) => (
        <div key={g.label} className="mb-1">
          <div className="flex flex-col gap-0.5">
            {g.items.map((it) => {
              const active = isActive(it.to, "exact" in it ? it.exact : false);
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <it.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
