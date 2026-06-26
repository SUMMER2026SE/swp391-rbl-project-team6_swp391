import { type ReactNode, useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Search,
  Sun,
  LayoutDashboard,
  School,
  BookOpen,
  ClipboardList,
  ClipboardCheck,
  TrendingUp,
  FolderOpen,
  HelpCircle,
  FileBadge,
  MessageSquare,
  LogOut,
  User,
  ChevronDown,
  Flame,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { SakuraBg } from "@/components/sakura-bg";
import { useTheme, useAuth, getUserAvatar, getAvatarInitial } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { notifications as mockNotifs } from "@/data/teacher-data";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

// ─── Nav structure ────────────────────────────────────────────────
type NavItem = { to: string; label: string; icon: React.ElementType; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const teacherGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/teacher", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/teacher/classes", label: "My Classes", icon: School },
      { to: "/teacher/classes/create", label: "Create Class", icon: School },
    ],
  },
  {
    label: "Class Operations",
    items: [
      { to: "/teacher/lessons", label: "Lessons", icon: BookOpen },
      { to: "/teacher/homework", label: "Homework", icon: ClipboardList },
      { to: "/teacher/exams", label: "Exams", icon: ClipboardCheck },
      { to: "/teacher/progress", label: "Progress", icon: TrendingUp },
    ],
  },
  {
    label: "Content Libraries",
    items: [
      { to: "/teacher/data-bank", label: "Data Bank", icon: FolderOpen },
      { to: "/teacher/question-bank", label: "Question Bank", icon: HelpCircle },
      { to: "/teacher/jlpt-bank", label: "JLPT Exam Bank", icon: FileBadge },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/teacher/reports", label: "Reports", icon: MessageSquare },
      { to: "/teacher/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "Account",
    items: [{ to: "/teacher/profile", label: "Profile", icon: User }],
  },
];

// ─── Page header ─────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  showBack,
  onBack,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: string;
  showBack?: boolean;
  onBack?: () => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1.5 shrink-0"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </button>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)]">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-primary-col sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-muted-col">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── Main shell ──────────────────────────────────────────────────
export function TeacherShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const unread = mockNotifs.filter((n) => !n.read).length;

  const avatar = getUserAvatar(user);
  const initials = getAvatarInitial(user);

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return pathname === to;
    if (to === "/teacher") return pathname === to;
    return pathname === to || pathname.startsWith(to + "/") || pathname.startsWith(to + "?");
  };

  // Close dropdowns on outside click
  useEffect(() => {
    if (!notifOpen && !userMenuOpen) return;
    const handler = () => {
      setNotifOpen(false);
      setUserMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [notifOpen, userMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const renderNavItem = (item: NavItem, isCollapsed: boolean) => {
    const active = isActive(item.to, item.exact);
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to}
        title={isCollapsed ? item.label : undefined}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden",
          active ? "nav-active" : "nav-item",
          isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4 flex-shrink-0 transition-all duration-300",
            active ? "text-white" : "text-muted-foreground group-hover:text-[var(--primary)]",
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
          {item.label}
        </span>
        {!isCollapsed && active && (
          <ChevronRight className="w-4 h-4 ml-auto text-white/70 flex-shrink-0" />
        )}
      </Link>
    );
  };

  const renderNavGroup = (group: NavGroup, isCollapsed: boolean) => (
    <div key={group.label} className={cn("mb-1", isCollapsed ? "px-1.5" : "")}>
      {!isCollapsed && (
        <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {group.label}
        </div>
      )}
      <div className="flex flex-col gap-0.5">
        {group.items.map((item) => renderNavItem(item, isCollapsed))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <SakuraBg count={14} />

      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col flex-shrink-0 overflow-hidden glass-sidebar m-3 mr-0 rounded-3xl p-4 sticky top-3 h-[calc(100vh-1.5rem)] transition-[width,padding] duration-300 ease-in-out",
          collapsed ? "w-24 px-3" : "w-72",
        )}
      >
        {/* Logo area + collapse button */}
        <div
          className={cn(
            "mb-2 flex items-start justify-between gap-3",
            collapsed ? "flex-col items-center gap-1.5" : "",
          )}
        >
          <Link
            to="/"
            className={cn(
              "flex min-w-0 px-3 py-3 transition-all duration-300",
              collapsed ? "w-full justify-center px-2 py-2" : "items-center gap-2.5",
            )}
            title={collapsed ? "MIDORI" : undefined}
          >
            <div className="shrink-0 transition-all duration-300">
              <Logo size={36} />
            </div>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                collapsed ? "hidden w-0 opacity-0 pointer-events-none" : "block w-auto opacity-100",
              )}
            >
              <div className="font-display font-extrabold text-lg leading-none tracking-[0.2em] text-primary-col whitespace-nowrap">
                MIDORI
              </div>
              <div className="text-[10px] text-muted-col uppercase tracking-widest font-semibold whitespace-nowrap">
                Teacher
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((p) => !p)}
            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200/70 bg-white/70 shadow-sm text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-white/10 flex-shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav
          className={cn("flex-1 overflow-y-auto overflow-x-hidden", collapsed ? "mt-1" : "mt-2")}
        >
          {teacherGroups.map((g) => renderNavGroup(g, collapsed))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "mt-2 rounded-xl text-sm font-medium nav-item text-[var(--jp-red)] hover:bg-[var(--jp-red)]/10 transition-all duration-300 flex items-center",
            collapsed ? "justify-center px-0 py-2.5" : "gap-2 px-3 py-2.5",
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300",
              collapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100",
            )}
          >
            Logout
          </span>
        </button>
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 overlay-dark"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 glass-sidebar p-4 rounded-r-3xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <Link
                to="/"
                className="flex items-center gap-2.5"
                onClick={() => setMobileOpen(false)}
              >
                <Logo size={36} />
                <div>
                  <div className="font-display font-extrabold text-lg leading-none tracking-[0.2em] text-primary-col">
                    MIDORI
                  </div>
                  <div className="text-[10px] text-muted-col uppercase tracking-widest font-semibold">
                    Teacher
                  </div>
                </div>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl nav-item">
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <nav className="space-y-1">
              {teacherGroups.map((g) => (
                <div key={g.label}>
                  <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {g.label}
                  </div>
                  {g.items.map((item) => {
                    const active = isActive(item.to, item.exact);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm mb-0.5",
                          active ? "nav-active" : "nav-item",
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 mx-3 mt-3">
          <div className="glass-nav rounded-2xl px-5 py-3 flex items-center gap-3">
            {/* Mobile menu */}
            <button
              className="lg:hidden p-2 -ml-1 rounded-xl nav-item"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5 text-secondary-col" />
            </button>

            {/* Search */}
            <div className="flex-1 relative min-w-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-col pointer-events-none" />
              <input
                placeholder="Search classes, lessons, students…"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm hover:shadow-[0_8px_24px_rgba(148,163,184,0.16)] dark:hover:shadow-none transition-all duration-200 placeholder:text-muted-col/70 dark:placeholder:text-slate-400"
              />
            </div>

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
                  {unread > 0 && (
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
                          {mockNotifs.slice(0, 5).map((n) => (
                            <div
                              key={n.id}
                              className={cn(
                                "w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150",
                                !n.read
                                  ? "bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                                  : "hover:bg-gray-50 dark:hover:bg-white/[0.04]",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                                  !n.read
                                    ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400"
                                    : "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400",
                                )}
                              >
                                <Bell className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                                    {n.title}
                                  </span>
                                  {!n.read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 flex-shrink-0 mt-0.5" />
                                  )}
                                </div>
                                <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
                                  {n.message}
                                </p>
                                <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 block">
                                  {n.time}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="border-t border-gray-100 dark:border-white/10 p-2 flex-shrink-0 bg-white dark:bg-[#0f1117]">
                        <Link
                          to="/teacher/notifications"
                          onClick={() => setNotifOpen(false)}
                          className="w-full block py-2.5 text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl transition"
                        >
                          View all notifications
                        </Link>
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
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover border-2 border-white/30 dark:border-white/20"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-hero grid place-items-center text-white font-bold text-sm">
                      {initials}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold leading-tight text-primary-col">
                      {user?.name ?? "Teacher"}
                    </div>
                    <div className="text-[10px] text-muted-col leading-tight">Teacher</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-col hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="fixed w-48 glass-modal rounded-xl shadow-2xl z-[100] p-2"
                    style={{ top: "72px", right: "24px" }}
                  >
                    <Link
                      to="/teacher/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm nav-item"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
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
        <main className="flex-1 p-3 md:p-6 pb-24 lg:pb-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
