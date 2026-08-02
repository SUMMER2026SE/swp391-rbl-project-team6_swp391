import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  useAuth,
  useTheme,
  getAvatarInitial,
  getUserAvatar,
  isStudentActive,
  type FrontendRole,
} from "@/lib/auth";
import { Footer } from "@/components/layout/Footer";
import { AdminFooter } from "@/components/layout/AdminFooter";
import { cn } from "@/lib/utils";
import { SakuraBg } from "./sakura-bg";
import { Logo } from "./logo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { prefetchAdminQuestionBankLessons } from "@/services/questionBankService";
import { classesApi } from "@/lib/api/classes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Headphones,
  Mic,
  ClipboardCheck,
  Trophy,
  LineChart,
  User,
  LogOut,
  Bell,
  Search,
  Flame,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Menu,
  Bot,
  ChevronDown,
  Sun,
  Moon,
  BellRing,
  ChevronLeft,
  FileText,
  FileBarChart,
  FolderOpen,
  BookUser,
  Library,
  School,
  UserPlus,
  ClipboardList,
  Users,
  Settings,
  Megaphone,
  Eye,
  BookMarked,
  Mic2,
  BarChart3,
  ScrollText,
  Brain,
  ChartColumn,
  BookText,
  Lock,
  BookOpenCheck,
  Map,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNotifications } from "@/lib/context/notification-context";
import { studentProgressApi } from "@/lib/api/studentProgress";

// Hierarchical navigation types
type NavItemBase = {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  disabled?: boolean;
  dividerBefore?: boolean;
  dividerAfter?: boolean;
};
type NavSubItem = {
  to: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
  disabled?: boolean;
};
type NavItem = NavItemBase & { children?: NavSubItem[] };

// Guest student navigation - limited access
const guestStudentNav: NavItem[] = [
  { to: "/", label: "Home", icon: BookText },
  { to: "/teachers", label: "Teachers", icon: GraduationCap },
  { to: "/reviews", label: "Reviews", icon: BookMarked },
  { to: "/preview", label: "Course Preview", icon: Eye },
  { to: "/student/profile", label: "Profile", icon: User },
];

// Active student navigation - full access with locked learning modules for guests
const studentNav: NavItem[] = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/classes", label: "My Classes", icon: School },
  {
    to: "/student/learning-modules",
    label: "Learning Modules",
    icon: BookOpen,
    children: [
      { to: "/student/learning/alphabet", label: "Alphabet" },
      { to: "/student/learning/kanji", label: "Kanji" },
      { to: "/student/shadowing", label: "Shadowing" },
    ],
  },
  { to: "/student/journey", label: "Learning Journey", icon: Map },
  { to: "/student/ai-sensei", label: "AI Sensei", icon: Bot },
  { to: "/student/profile", label: "Profile", icon: User },
];

// Guest student navigation - redirected to intro page
const guestStudentNavWithLockedLearning: NavItem[] = [
  { to: "/student/intro", label: "Introduction", icon: LayoutDashboard },
  { to: "/student/classes", label: "My Classes", icon: School },
  {
    to: "/",
    label: "Learning Modules",
    icon: BookOpen,
    disabled: true,
    children: [
      { to: "/", label: "Alphabet", disabled: true },
      { to: "/", label: "Kanji", disabled: true },
      { to: "/", label: "Shadowing", disabled: true },
    ],
  },
  { to: "/", label: "Learning Journey", icon: Map, disabled: true },
  { to: "/student/ai-sensei", label: "AI Sensei", icon: Bot },
  { to: "/student/profile", label: "Profile", icon: User },
];

// All students (both active and guests) see the same navigation structure.
// Guests will be blocked by StudentStatusGuard when they click on protected features.

const teacherNav: NavItem[] = [
  // 1. Dashboard
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/classes", label: "My Classes", icon: School },
  { to: "/teacher/grammar", label: "Grammar", icon: GraduationCap },
  { to: "/teacher/vocabulary", label: "Vocabulary", icon: BookOpen },
  { to: "/teacher/listening", label: "Listening", icon: Headphones },
  { to: "/teacher/shadowing", label: "Shadowing", icon: Mic },

  // 2. My Classes (class-based flow)
  {
    to: "/teacher/classes",
    label: "My Classes",
    icon: School,
    children: [
      { to: "/teacher/classes", label: "My Classes", icon: School },
      { to: "/teacher/classes/create", label: "Create Class", icon: Plus },
    ],
  },

  // 3. Homework (global)
  { to: "/teacher/homework", label: "Homework", icon: ClipboardList },

  // 5. Exams (global)
  { to: "/teacher/exams", label: "Exams", icon: ClipboardCheck },

  // 7. Reports
  { to: "/teacher/reports", label: "Reports", icon: FileBarChart },

  // 8. Notifications
  { to: "/teacher/notifications", label: "Notifications", icon: BellRing },

  // 9. Profile
  { to: "/teacher/profile", label: "Profile", icon: User },
];

// New Academic LMS Admin Navigation
const adminNav: NavItem[] = [
  // 1. Dashboard
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },

  // 2. Teacher Management
  { to: "/admin/teachers", label: "Teacher Management", icon: ShieldCheck },

  // 3. Class Management
  { to: "/admin/class-management", label: "Class Management", icon: BookUser },

  // 4. Question Bank
  { to: "/admin/question-bank", label: "Question Bank", icon: ClipboardCheck },

  // 5. Content Library
  { to: "/admin/content-library", label: "Content Library", icon: Library },

  // 8. Notification Management
  { to: "/admin/notification", label: "Notification", icon: Bell },

  // 9. Profile
  { to: "/admin/profile", label: "Profile", icon: User },
];

function getNav(role: FrontendRole, isActive: boolean, hasAssignedLevel: boolean): NavItem[] {
  if (role === "student") {
    return studentNav;
  }
  return role === "teacher" ? teacherNav : adminNav;
}

export function DashboardLayout({
  role,
  children,
  hideFooter = false,
}: {
  role: FrontendRole;
  children?: React.ReactNode;
  hideFooter?: boolean;
}) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (role === "admin" && user) {
      prefetchAdminQuestionBankLessons(queryClient).catch(() => {});
    }
  }, [role, user, queryClient]);

  const handleNavPrefetch = useCallback((to: string) => {
    if (to === "/admin/question-bank" && role === "admin") {
      prefetchAdminQuestionBankLessons(queryClient).catch(() => {});
    }
  }, [role, queryClient]);

  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search }) as any;
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Use global notification context for real data
  const { notifications, unreadCount, markRead } = useNotifications();

  // Admin role uses DashboardLayout too but admin has its own notification page
  // No need to show dropdown badge for admin (they manage notifications)
  const showBadge = role !== "admin";
  const dropdownNotifications = notifications.slice(0, 4);
  // Check if student is active (joined a class)
  const isStudentActiveStudent = role === "student" && isStudentActive(user);
  const isStudentGuestStudent = role === "student" && !isStudentActive(user);
  const [showLockedDialog, setShowLockedDialog] = useState(false);

  const { data: dbClasses = [] } = useQuery({
    queryKey: ["studentJoinedClassesDashboard"],
    queryFn: () => classesApi.getJoinedClasses(),
    enabled: role === "student" && !!user,
    staleTime: 5 * 60 * 1000,
  });

  const hasAssignedLevel = role === "student" && dbClasses && dbClasses.length > 0;

  const rawItems = getNav(role, isStudentActiveStudent, hasAssignedLevel);
  const items = rawItems.map((item) => {
    if (item.to === "/student/notifications") {
      return { ...item, badge: unreadCount };
    }
    return item;
  });

  const notificationsPath = role === "admin" ? "/admin/notification" : `/${role}/notifications`;

  useEffect(() => {
    if (!notifOpen && !userMenuOpen) return;
    const handler = () => {
      setNotifOpen(false);
      setUserMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [notifOpen, userMenuOpen]);

  const roleLabels: Record<FrontendRole, string> = {
    student: "Student",
    teacher: "Teacher",
    admin: "Administrator",
  };

  // Expandable menu state for admin
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  // Toggle expanded state for submenu
  const toggleExpanded = useCallback((key: string) => {
    setExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isRouteActive = useCallback(
    (to: string, exact?: boolean) => {
      if (to === "/student/shadowing") {
        return (
          pathname === "/student/shadowing" ||
          pathname.startsWith("/student/shadowing/") ||
          (pathname.startsWith("/student/vocabulary") && !!search?.sourceVideoId)
        );
      }

      if (to === "/student/journey") {
        if (pathname.startsWith("/student/vocabulary") && !!search?.sourceVideoId) {
          return false;
        }
        return (
          pathname === "/student/journey" ||
          pathname.startsWith("/student/journey/") ||
          pathname.startsWith("/student/vocabulary") ||
          pathname.startsWith("/student/grammar") ||
          pathname.startsWith("/student/reading") ||
          pathname.startsWith("/student/listening")
        );
      }
      if (to === "/teacher/classes") {
        return (
          pathname === "/teacher/classes" ||
          (pathname.startsWith("/teacher/classes/") && pathname !== "/teacher/classes/create")
        );
      }
      if (to === "/teacher/classes/create") {
        return pathname === "/teacher/classes/create";
      }
      if (to === "/admin/class-management") {
        return (
          pathname === "/admin/class-management" ||
          pathname.startsWith("/admin/class-management/") ||
          pathname.startsWith("/admin/class/")
        );
      }
      if (exact) return pathname === to;
      const isBaseRoute = to === `/${role}`;
      return (
        pathname === to ||
        (!isBaseRoute && pathname.startsWith(to + "/")) ||
        (!isBaseRoute && pathname.startsWith(to + "?"))
      );
    },
    [pathname, search, role],
  );

  // Check if item or any child is active
  const isItemOrChildActive = useCallback(
    (item: NavItem): boolean => {
      if (item.children && item.children.length > 0) {
        return item.children.some((child) => isRouteActive(child.to));
      }
      return isRouteActive(item.to);
    },
    [isRouteActive],
  );

  // Get active child for a parent item
  const getActiveChild = useCallback(
    (item: NavItem): string | null => {
      if (!item.children || item.children.length === 0) return null;
      const activeChild = item.children.find((child) => isRouteActive(child.to));
      return activeChild?.to || null;
    },
    [isRouteActive],
  );

  // Handle click on disabled items
  const handleDisabledClick = (e: React.MouseEvent | React.TouchEvent, item: NavItem | NavSubItem) => {
    if (item.disabled) {
      e.preventDefault();
      e.stopPropagation();
      setShowLockedDialog(true);
    }
  };

  // Render navigation item (flat or with children)
  const renderNavItem = (item: NavItem, isChild = false, parentKey = "") => {
    const key = parentKey ? `${parentKey}-${item.to}` : item.to;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[key] || false;
    const isActive = isItemOrChildActive(item);
    const activeChild = getActiveChild(item);
    const Icon = item.icon;

    if (isChild) {
      // Render child item (flat list style)
      // Handle disabled child items
      if (item.disabled) {
        return (
          <div
            key={item.to}
            title="Join a class to access"
            className={cn(
              "group flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden relative cursor-not-allowed opacity-50",
              isCollapsed ? "justify-center px-0 py-2" : "gap-2 px-3 py-2 ml-6",
            )}
            onClick={(e) => handleDisabledClick(e as unknown as React.MouseEvent, item)}
          >
            {item.icon && (
              <item.icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-all duration-300 text-muted-foreground",
                )}
              />
            )}
            <span
              className={cn(
                "transition-all duration-300 whitespace-nowrap overflow-hidden text-secondary-col",
                isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100",
              )}
            >
              {item.label}
            </span>
            <Lock className="w-3 h-3 ml-auto text-muted-foreground" />
          </div>
        );
      }

      return (
        <Link
          key={item.to}
          to={item.to}
          preload="intent"
          title={isCollapsed ? item.label : undefined}
          className={cn(
            "group flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden relative",
            isRouteActive(item.to) ? "nav-active" : "nav-item child-nav-item",
            isCollapsed ? "justify-center px-0 py-2" : "gap-2 px-3 py-2 ml-6",
          )}
        >
          {item.icon && (
            <item.icon
              className={cn(
                "w-4 h-4 flex-shrink-0 transition-all duration-300",
                isRouteActive(item.to)
                  ? "text-white"
                  : "text-muted-foreground group-hover:text-primary",
              )}
            />
          )}
          <span
            className={cn(
              "transition-all duration-300 whitespace-nowrap overflow-hidden",
              isRouteActive(item.to) ? "text-white font-semibold" : "text-secondary-col",
              isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100",
            )}
          >
            {item.label}
          </span>
          {item.badge !== undefined && item.badge > 0 && (
            <span
              className={cn(
                "bg-[var(--jp-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[16px] h-4 px-1",
                isCollapsed ? "absolute top-1 right-2" : "ml-auto",
              )}
            >
              {item.badge}
            </span>
          )}
        </Link>
      );
    }

    // Handle disabled parent items
    if (item.disabled) {
      return (
        <div key={item.to} className="relative">
          <button
            onClick={(e) => handleDisabledClick(e, item)}
            title="Join a class to access learning content"
            className={cn(
              "w-full group flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden relative cursor-not-allowed opacity-50",
              isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 flex-shrink-0 transition-all duration-300 text-muted-foreground",
              )}
            />
            <span
              className={cn(
                "transition-all duration-300 whitespace-nowrap overflow-hidden flex-1 text-left text-secondary-col",
                isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100",
              )}
            >
              {item.label}
            </span>
            <Lock className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      );
    }

    // Render parent item with expandable children
    if (hasChildren) {
      const isParentRouteActive = isRouteActive(item.to);
      return (
        <div key={item.to} className="relative">
          <button
            onClick={() => toggleExpanded(key)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "w-full group flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden relative",
              isParentRouteActive ? "nav-active" : "nav-item",
              isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 flex-shrink-0 transition-all duration-300",
                isParentRouteActive ? "text-white" : "text-muted-foreground group-hover:text-primary",
              )}
            />
            <span
              className={cn(
                "transition-all duration-300 whitespace-nowrap overflow-hidden flex-1 text-left",
                isParentRouteActive ? "text-white font-semibold" : "text-secondary-col",
                isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100",
              )}
            >
              {item.label}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={cn(
                  "bg-[var(--jp-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[16px] h-4 px-1",
                  isCollapsed ? "absolute top-1 right-2" : "mr-2",
                )}
              >
                {item.badge}
              </span>
            )}
            {!isCollapsed && (
              <ChevronRight
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                  isExpanded && "rotate-90",
                )}
              />
            )}
          </button>

          {/* Children */}
          {!isCollapsed && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {item.children!.map((child) => renderNavItem(child as NavItem, true, key))}
            </motion.div>
          )}
        </div>
      );
    }

    // Render simple item without children
    return (
      <Link
        key={item.to}
        to={item.to.startsWith("landing-") ? "/student/dashboard" : item.to}
        preload="intent"
        onMouseEnter={() => handleNavPrefetch(item.to)}
        onFocus={() => handleNavPrefetch(item.to)}
        onPointerDown={() => handleNavPrefetch(item.to)}
        title={isCollapsed ? item.label : undefined}
        onClick={(e) => {
          if (item.to.startsWith("landing-")) {
            e.preventDefault();
            const id = item.to.replace("landing-", "");
            if (pathname === "/student/dashboard") {
              const el = document.getElementById(id);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              nav({ to: "/student/dashboard" }).then(() => {
                setTimeout(() => {
                  const el = document.getElementById(id);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 200);
              });
            }
          }
        }}
        className={cn(
          "group flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden relative",
          isActive ? "nav-active" : "nav-item",
          isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4 flex-shrink-0 transition-all duration-300",
            isActive ? "text-white" : "text-muted-foreground group-hover:text-primary",
          )}
        />
        <span
          className={cn(
            "transition-all duration-300 whitespace-nowrap overflow-hidden",
            isActive ? "text-white font-semibold" : "text-secondary-col",
            isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100",
          )}
        >
          {item.label}
        </span>
        {item.badge !== undefined && item.badge > 0 && (
          <span
            className={cn(
              "bg-[var(--jp-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[16px] h-4 px-1",
              isCollapsed ? "absolute top-1 right-2" : "ml-auto mr-2",
            )}
          >
            {item.badge}
          </span>
        )}
        {!isCollapsed && isActive && (
          <ChevronRight
            className={cn(
              "w-4 h-4 text-white/70 flex-shrink-0",
              item.badge !== undefined && item.badge > 0 ? "ml-1" : "ml-auto",
            )}
          />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex">
      <SakuraBg count={14} />
      <aside
        className={cn(
          "hidden lg:flex flex-col flex-shrink-0 overflow-hidden glass-sidebar m-3 mr-0 rounded-3xl p-4 sticky top-3 h-[calc(100vh-1.5rem)] transition-[width,padding] duration-300 ease-in-out",
          isCollapsed ? "w-24 px-3" : "w-72",
        )}
      >
        <div
          className={cn(
            "mb-2 flex items-start justify-between gap-3",
            isCollapsed ? "flex-col items-center gap-1.5" : "",
          )}
        >
          <Link
            to="/"
            className={cn(
              "flex min-w-0 px-3 py-3 transition-all duration-300",
              isCollapsed ? "w-full justify-center px-2 py-2" : "items-center gap-2.5",
            )}
            title={isCollapsed ? "MIDORI" : undefined}
          >
            <div className="shrink-0 transition-all duration-300">
              <Logo size={36} />
            </div>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                isCollapsed
                  ? "hidden w-0 opacity-0 pointer-events-none"
                  : "block w-auto opacity-100",
              )}
            >
              <div className="font-display font-extrabold text-lg leading-none tracking-[0.2em] text-primary-col whitespace-nowrap">
                MIDORI
              </div>
              <div className="text-[10px] text-muted-col uppercase tracking-widest font-semibold whitespace-nowrap">
                {role}
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200/70 bg-white/70 shadow-sm text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-white/10 flex-shrink-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300",
            isCollapsed ? "flex flex-row flex-wrap content-start gap-2 mt-1" : "flex-col mt-2",
          )}
        >
          {role === "admin" || role === "student" ? (
            // Admin and Student use hierarchical navigation
            isCollapsed ? (
              // When collapsed, render a simplified icon-only view
              <div className="flex flex-row flex-wrap gap-2 w-full justify-center">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemOrChildActive(item);
                  return (
                    <div key={item.to} className="flex flex-col items-center w-full">
                      {item.dividerBefore && <hr className="w-8 my-1.5 border-slate-200/60 dark:border-white/5" />}
                      <Link
                        to={item.disabled ? "/" : (item.to.startsWith("landing-") ? "/student/dashboard" : item.to)}
                        title={item.label}
                        onMouseEnter={() => handleNavPrefetch(item.to)}
                        onFocus={() => handleNavPrefetch(item.to)}
                        onPointerDown={() => handleNavPrefetch(item.to)}
                        onClick={
                          item.disabled
                            ? (e: React.MouseEvent<HTMLAnchorElement>) => handleDisabledClick(e, item)
                            : (e: React.MouseEvent<HTMLAnchorElement>) => {
                                if (item.to.startsWith("landing-")) {
                                  e.preventDefault();
                                  const id = item.to.replace("landing-", "");
                                  if (pathname === "/student/dashboard") {
                                    const el = document.getElementById(id);
                                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                  } else {
                                    nav({ to: "/student/dashboard" }).then(() => {
                                      setTimeout(() => {
                                        const el = document.getElementById(id);
                                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                      }, 200);
                                    });
                                  }
                                }
                              }
                        }
                        className={cn(
                          "flex items-center justify-center rounded-xl transition-all duration-300",
                          isActive
                            ? "bg-primary text-white w-10 h-10"
                            : item.disabled
                              ? "bg-slate-100 dark:bg-slate-800 text-muted-foreground w-10 h-10 cursor-not-allowed opacity-50"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 w-10 h-10",
                        )}
                      >
                        <Icon
                          className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground")}
                        />
                      </Link>
                      {item.dividerAfter && <hr className="w-8 my-1.5 border-slate-200/60 dark:border-white/5" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              items.map((item) => (
                <div key={item.to} className="w-full">
                  {item.dividerBefore && <hr className="my-2 border-slate-200/60 dark:border-white/5 mx-3" />}
                  {renderNavItem(item)}
                  {item.dividerAfter && <hr className="my-2 border-slate-200/60 dark:border-white/5 mx-3" />}
                </div>
              ))
            )
          ) : // Teacher uses flat navigation
          isCollapsed ? (
            <div className="flex flex-row flex-wrap gap-2 w-full justify-center">
              {items.map((it) => {
                const isBaseRoute = it.to === `/${role}`;
                const active = pathname === it.to || (!isBaseRoute && pathname.startsWith(it.to));
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    title={it.label}
                    className={cn(
                      "flex items-center justify-center rounded-xl transition-all duration-300",
                      active
                        ? "bg-primary text-white w-10 h-10"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 w-10 h-10",
                    )}
                  >
                    <Icon
                      className={cn("w-5 h-5", active ? "text-white" : "text-muted-foreground")}
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            items.map((it) => {
              const isBaseRoute = it.to === `/${role}`;
              const active = pathname === it.to || (!isBaseRoute && pathname.startsWith(it.to));
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  preload="intent"
                  title={isCollapsed ? it.label : undefined}
                  className={cn(
                    "group flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden",
                    active ? "nav-active" : "nav-item",
                    isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-all duration-300",
                      active ? "text-white" : "text-muted-foreground group-hover:text-primary",
                      isCollapsed ? "mx-auto" : "",
                    )}
                  />
                  <span
                    className={cn(
                      "transition-all duration-300 whitespace-nowrap overflow-hidden",
                      active ? "text-white font-semibold" : "text-secondary-col",
                      isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100",
                    )}
                  >
                    {it.label}
                  </span>
                  {!isCollapsed && active && (
                    <ChevronRight className="w-4 h-4 ml-auto text-white/70 flex-shrink-0" />
                  )}
                </Link>
              );
            })
          )}
        </nav>

        <button
          onClick={() => {
            logout();
            nav({ to: "/login" });
          }}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "mt-2 rounded-xl text-sm font-medium nav-item text-[var(--jp-red)] hover:bg-[var(--jp-red)]/10 transition-all duration-300 flex items-center",
            isCollapsed ? "justify-center px-0 py-2.5" : "gap-2 px-3 py-2.5",
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300",
              isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100",
            )}
          >
            Logout
          </span>
        </button>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 overlay-dark" onClick={() => setOpen(false)}>
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 glass-sidebar p-4 rounded-r-3xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display font-extrabold text-xl tracking-[0.2em] text-primary-col mb-6">
              MIDORI
            </div>
            <nav className="space-y-1">
              {role === "admin" || role === "student"
                ? // Admin and Student hierarchical mobile nav
                  items.map((item) => {
                    const hasChildren = item.children && item.children.length > 0;
                    const isActive = isItemOrChildActive(item);
                    const isExpanded = expandedMenus[item.to] || false;

                    if (hasChildren) {
                      return (
                        <div key={item.to}>
                          <button
                            onClick={() => toggleExpanded(item.to)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                              isActive ? "nav-active" : "nav-item"
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronRight
                              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            />
                          </button>
                          {isExpanded && (
                            <div className="ml-4 space-y-1">
                              {item.children!.map((child) => (
                                <Link
                                  key={child.to}
                                  to={child.to}
                                  preload="intent"
                                  onClick={() => setOpen(false)}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                                    pathname === child.to ? "nav-active" : "nav-item"
                                  }`}
                                >
                                  <span className="w-4 h-4" />
                                  {child.icon && <child.icon className="w-4 h-4" />}
                                  {child.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        preload="intent"
                        onMouseEnter={() => handleNavPrefetch(item.to)}
                        onFocus={() => handleNavPrefetch(item.to)}
                        onPointerDown={() => handleNavPrefetch(item.to)}
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                          isActive ? "nav-active" : "nav-item"
                        }`}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })
                : // Teacher flat mobile nav
                  items.map((it) => {
                    const isBaseRoute = it.to === `/${role}`;
                    const active =
                      pathname === it.to || (!isBaseRoute && pathname.startsWith(it.to));
                    const Icon = it.icon;
                    return (
                      <Link
                        key={it.to}
                        to={it.to}
                        preload="intent"
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${active ? "nav-active" : "nav-item"}`}
                      >
                        <Icon className="w-4 h-4" /> {it.label}
                      </Link>
                    );
                  })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Navbar */}
        <header className="sticky top-0 z-40 mx-3 mt-3">
          <div className="glass-nav rounded-2xl px-5 py-3 flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 -ml-1 rounded-xl nav-item"
              onClick={() => setOpen(true)}
            >
              <Menu className="w-5 h-5 text-secondary-col" />
            </button>

            {/* Search */}
            <div className="flex-1 relative min-w-0">
              {/* Header search is handled by TeacherShell — not rendered here */}
            </div>

            {/* XP + Streak (students) */}
            {role === "student" && (
              <div className="hidden xl:flex items-center gap-2">
                <StreakBadge />
              </div>
            )}

            <div className="flex items-center gap-1">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl nav-item"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-[var(--primary)]" />
                )}
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotifOpen(!notifOpen);
                    setUserMenuOpen(false);
                  }}
                  className="relative p-2 rounded-xl nav-item"
                >
                  <Bell className="w-5 h-5 text-secondary-col" />
                  {showBadge && unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--jp-red)]" />
                  )}
                </button>

                {notifOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="fixed w-80 rounded-2xl shadow-2xl z-[200] flex flex-col overflow-hidden"
                    style={{ top: "72px", right: "24px" }}
                  >
                    <div
                      className="bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.35)] rounded-2xl overflow-hidden"
                      style={{ maxHeight: "520px" }}
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
                          Notifications
                        </span>
                        <button
                          onClick={() => setNotifOpen(false)}
                          className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                        >
                          Close
                        </button>
                      </div>

                      <div
                        className="overflow-y-auto flex-1"
                        style={{ maxHeight: "calc(520px - 116px)" }}
                      >
                        <div className="p-2 space-y-1">
                          {dropdownNotifications.map((n) => {
                            const Icon = n.icon;
                            return (
                              <button
                                key={n.id}
                                type="button"
                                onClick={() => {
                                  setNotifOpen(false);
                                  // Clicking a notification from the bell
                                  // popup must take the user straight to the
                                  // detail view of that notification, not
                                  // just stop on the list page. We navigate
                                  // to the role-scoped inbox with `?id=` so
                                  // the route handler can open the drawer
                                  // for the right notification and then
                                  // strip the param.
                                  const params: Record<string, unknown> = {};
                                  if (role === "teacher") {
                                    params.q = "";
                                  }
                                  params.id = n.id;
                                  nav({
                                    to: notificationsPath as never,
                                    search: params as never,
                                  });
                                  // Optimistically mark as read so the
                                  // bell badge updates immediately. The
                                  // route handler also marks it as read
                                  // when the detail drawer closes.
                                  if (n.unread) {
                                    void markRead(n.id);
                                  }
                                }}
                                className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 ${
                                  n.unread
                                    ? "bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                                    : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                }`}
                              >
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                    n.unread
                                      ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400"
                                      : "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400"
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                      {n.title}
                                    </span>
                                    {n.unread && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 flex-shrink-0 mt-0.5" />
                                    )}
                                  </div>
                                  <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
                                    {n.desc}
                                  </p>
                                  <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 block">
                                    {n.time}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 dark:border-white/10 p-2 flex-shrink-0 bg-white dark:bg-[#0f1117]">
                        <button
                          onClick={() => {
                            setNotifOpen(false);
                            // "View all" is purely a navigation shortcut to
                            // the inbox list page; it must NOT auto-open any
                            // detail drawer. We explicitly send `id: null`
                            // so the inbox renders the regular list and the
                            // user picks a notification themselves.
                            const params: Record<string, unknown> = {};
                            if (role === "teacher") {
                              params.q = "";
                            }
                            params.id = null;
                            nav({
                              to: notificationsPath as never,
                              search: params as never,
                            });
                          }}
                          className="w-full block py-2.5 text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl transition"
                        >
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User avatar */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserMenuOpen(!userMenuOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full nav-item ml-1"
                >
                  {getUserAvatar(user) ? (
                    <img
                      src={getUserAvatar(user)!}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover border-2 border-white/30 dark:border-white/20"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-hero grid place-items-center text-white font-bold text-sm">
                      {(user?.name?.[0] ?? "Y").toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold leading-tight text-primary-col">
                      {user?.name ?? "Yuki T."}
                    </div>
                    <div className="text-[10px] text-muted-col leading-tight">
                      {roleLabels[role]}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-col hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="fixed right-6 w-48 glass-modal rounded-xl shadow-2xl z-[100] p-2"
                    style={{ top: "72px", right: "24px" }}
                  >
                    <Link
                      to={`/${role}/profile` as never}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm nav-item"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        nav({ to: "/login" });
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--jp-red)] hover:bg-[var(--jp-red)]/10 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-3 md:p-6 lg:pb-6 xl:pb-6 pb-24 lg:pb-6 min-h-0 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {children}
          </motion.div>
        </main>

        {role === "student" ? <Footer /> : role === "admin" && <AdminFooter />}

        {/* Mobile bottom nav - hidden on lesson pages and desktop */}
        {role === "student" && !hideFooter && (
          <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 glass-nav rounded-2xl px-2 py-2 flex justify-around">
            {items.slice(0, 5).map((it) => {
              const targetTo =
                it.children &&
                it.children.length > 0 &&
                (it.to.endsWith("-modules") || it.to.includes("practice"))
                  ? it.children[0].to
                  : it.to;
              const isBaseRoute = targetTo === `/${role}`;
              const active =
                pathname === targetTo || (!isBaseRoute && pathname.startsWith(targetTo));
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={targetTo as any}
                  preload="intent"
                  className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-semibold transition-all duration-200 ${
                    active ? "bg-gradient-hero text-white shadow" : "text-muted-col"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-white" : ""}`} />
                  <span>{it.label.split(" ")[0]}</span>
                </Link>
              );
            })}
          </nav>
        )}

        <Dialog open={showLockedDialog} onOpenChange={setShowLockedDialog}>
          <DialogContent className="sm:max-w-md rounded-2xl z-[150] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 shadow-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-500 font-extrabold text-lg">
                <Lock className="w-5 h-5 text-rose-500" />
                Feature Locked
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-300 font-medium pt-2 text-sm">
                You have not been assigned to any class yet. Once your teacher adds you to a class, you will be able to access this feature.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                onClick={() => setShowLockedDialog(false)}
                className="bg-primary hover:opacity-95 text-white font-bold w-full rounded-xl cursor-pointer"
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function StreakBadge() {
  // Reuse the same queryKey as StudentDashboard ("progress-stats") so React Query
  // serves the cached result — no second GET /stats request is made.
  const { data: stats, isLoading } = useQuery({
    queryKey: ["progress-stats"],
    queryFn: () => studentProgressApi.getProgressStats(),
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const streak = typeof stats?.learningStreak === "number" ? stats.learningStreak : null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--jp-red)]/10 text-[var(--jp-red)] text-xs font-semibold">
        <Flame className="w-3.5 h-3.5 animate-pulse" />
        <span className="w-4 h-3 bg-[var(--jp-red)]/20 rounded animate-pulse" />
      </div>
    );
  }

  if (streak === null || streak === 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--jp-red)]/10 text-[var(--jp-red)] text-xs font-semibold">
        <Flame className="w-3.5 h-3.5" />
        <span>0</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--jp-red)]/10 text-[var(--jp-red)] text-xs font-semibold">
      <Flame className="w-3.5 h-3.5" />
      <span>{streak} day{streak !== 1 ? "s" : ""}</span>
    </div>
  );
}
