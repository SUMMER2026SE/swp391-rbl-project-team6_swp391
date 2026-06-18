import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, useTheme, getAvatarInitial, getUserAvatar, type FrontendRole } from "@/lib/auth";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { SakuraBg } from "./sakura-bg";
import { Logo } from "./logo";
import {
  LayoutDashboard, BookOpen, GraduationCap, Layers, Headphones, Mic,
  ClipboardCheck, Trophy, LineChart, User, LogOut, Bell, Search, Flame, Sparkles,
  Users, ShieldCheck, Settings, Megaphone,   ChevronRight, Menu,
  Bot, ChevronDown, Sun, Moon, BellRing, ChevronLeft, GraduationCap as GrammarIcon,
  Shield, FileText, FileBarChart, Eye, BookMarked, Mic2, BarChart3, FolderOpen, ScrollText,
  School, ClipboardList, Brain, ChartColumn
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { TEACHER_NOTIFICATIONS } from "@/data/teacher-notifications";
import type { Notification } from "@/types/notification";

// Hierarchical navigation types
type NavItemBase = { to: string; label: string; icon: React.ElementType; badge?: number };
type NavSubItem = { to: string; label: string; icon?: React.ElementType; badge?: number };
type NavItem = NavItemBase & { children?: NavSubItem[] };

const studentNav: NavItem[] = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/classes", label: "My Classes", icon: School },
  {
    to: "/student/learning-modules",
    label: "Learning Modules",
    icon: BookOpen,
    children: [
      { to: "/student/vocabulary", label: "Vocabulary" },
      { to: "/student/grammar", label: "Grammar" },
      { to: "/student/listening", label: "Listening" },
      { to: "/student/reading", label: "Reading" },
      { to: "/student/shadowing", label: "Shadowing" }
    ]
  },
  {
    to: "/student/progress",
    label: "Progress",
    icon: ChartColumn
  },
  { to: "/student/ai-sensei", label: "AI Sensei", icon: Bot },
  { to: "/student/profile", label: "Profile", icon: User },
  {
    to: "/student/settings",
    label: "Settings",
    icon: Settings,
    children: [
      { to: "/student/settings/theme", label: "Theme" },
      { to: "/student/settings/language", label: "Language" },
      { to: "/student/settings/notifications", label: "Notification Settings" }
    ]
  }
];

const teacherNav: NavItem[] = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/classes", label: "My Classes", icon: School },
  { to: "/teacher/grammar", label: "Grammar", icon: GraduationCap },
  { to: "/teacher/vocabulary", label: "Vocabulary", icon: BookOpen },
  { to: "/teacher/listening", label: "Listening", icon: Headphones },
  { to: "/teacher/shadowing", label: "Shadowing", icon: Mic },
  { to: "/teacher/exams", label: "Exams", icon: ClipboardCheck },
  { to: "/teacher/notifications", label: "Notifications", icon: BellRing },
  { to: "/teacher/profile", label: "Profile", icon: User },
  { to: "/teacher/settings", label: "Settings", icon: Settings },
];

// New Academic Actor Admin Navigation
const adminNav: NavItem[] = [
  // 1. Dashboard
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  
  // 2. User Management
  { to: "/admin/teachers", label: "Teacher Approval", icon: ShieldCheck, 
    children: [
      { to: "/admin/teachers", label: "Teacher Approval", icon: ShieldCheck },
      { to: "/admin/users", label: "Teacher List", icon: Users },
      { to: "/admin/students", label: "Student Management", icon: GraduationCap },
      { to: "/admin/roles", label: "Roles & Permissions", icon: Shield },
    ]
  },
  
  // 3. JLPT Exam Bank
  { to: "/admin/exams", label: "Exam Bank", icon: ClipboardCheck,
    children: [
      { to: "/admin/exams?level=n5", label: "N5 Exams", icon: FileText },
      { to: "/admin/exams?level=n4", label: "N4 Exams", icon: FileText },
      { to: "/admin/exams?level=n3", label: "N3 Exams", icon: FileText },
      { to: "/admin/exams?level=n2", label: "N2 Exams", icon: FileText },
      { to: "/admin/exams?level=n1", label: "N1 Exams", icon: FileText },
      { to: "/admin/ai-generator", label: "AI Generator", icon: Sparkles },
    ]
  },
  
  // 4. Content Library
  { to: "/admin/grammar", label: "Content Library", icon: FolderOpen,
    children: [
      { to: "/admin/grammar", label: "Grammar Library", icon: GraduationCap },
      { to: "/admin/vocabulary-library", label: "Vocabulary Library", icon: BookOpen },
      { to: "/admin/listening-library", label: "Listening Library", icon: Headphones },
      { to: "/admin/reading-library", label: "Reading Library", icon: ScrollText },
      { to: "/admin/shadowing-library", label: "Shadowing Library", icon: Mic2 },
      { to: "/admin/flashcard-library", label: "Flashcard Library", icon: Layers },
    ]
  },
  
  // 5. System Analytics
  { to: "/admin/analytics", label: "System Analytics", icon: BarChart3 },
  
  // 7. System Settings
  { to: "/admin/settings", label: "System Settings", icon: Settings,
    children: [
      { to: "/admin/settings", label: "Settings", icon: Settings },
      { to: "/admin/notifications", label: "Notifications", icon: Megaphone },
      { to: "/admin/profile", label: "Profile", icon: User },
    ]
  },
];

function getNav(role: FrontendRole): NavItem[] {
  return role === "student" ? studentNav : role === "teacher" ? teacherNav : adminNav;
}

export function DashboardLayout({ role, children }: { role: FrontendRole; children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const studentNotifications: Notification[] = [
    { id: 1, title: "New grammar lesson available", desc: "~なければならない pattern is ready", time: "2 min ago", unread: true, icon: GraduationCap },
    { id: 2, title: "Daily streak reminder", desc: "Complete today's lesson to keep your 32-day streak!", time: "1 hour ago", unread: true, icon: Flame },
    { id: 3, title: "Weekly leaderboard update", desc: "You're now #4 — just 80 XP behind #3!", time: "3 hours ago", unread: false, icon: Trophy },
    { id: 4, title: "AI Sensei feedback", desc: "Sensei reviewed your shadowing session", time: "Yesterday", unread: false, icon: Bot },
    { id: 5, title: "New badge earned", desc: "You unlocked 'Week Warrior' badge!", time: "2 days ago", unread: false, icon: Sparkles },
  ];

  const teacherNotifications = TEACHER_NOTIFICATIONS;

  const notifications: Notification[] =
    role === "teacher" ? teacherNotifications : studentNotifications;

  const unreadCount = notifications.filter(n => n.unread).length;
  const rawItems = getNav(role);
  const items = rawItems.map(item => {
    if (item.to === "/student/notifications") {
      return { ...item, badge: unreadCount };
    }
    return item;
  });

  const notificationsPath = `/${role}/notifications`;

  const dropdownNotifications = notifications.slice(0, 4);

  useEffect(() => {
    if (!notifOpen && !userMenuOpen) return;
    const handler = () => { setNotifOpen(false); setUserMenuOpen(false); };
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
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Check if item or any child is active
  const isItemOrChildActive = useCallback((item: NavItem): boolean => {
    if (item.children) {
      return item.children.some(child => pathname === child.to || pathname.startsWith(child.to + '/'));
    }
    const isBaseRoute = item.to === `/${role}`;
    return pathname === item.to || (!isBaseRoute && pathname.startsWith(item.to));
  }, [pathname, role]);

  // Get active child for a parent item
  const getActiveChild = useCallback((item: NavItem): string | null => {
    if (!item.children) return null;
    const activeChild = item.children.find(child => 
      pathname === child.to || pathname.startsWith(child.to + '/')
    );
    return activeChild?.to || null;
  }, [pathname]);

  // Render navigation item (flat or with children)
  const renderNavItem = (item: NavItem, isChild = false, parentKey = '') => {
    const key = parentKey ? `${parentKey}-${item.to}` : item.to;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[key] || false;
    const isActive = isItemOrChildActive(item);
    const activeChild = getActiveChild(item);
    const Icon = item.icon;

    if (isChild) {
      // Render child item (flat list style)
      return (
        <Link
          key={item.to}
          to={item.to}
          title={isCollapsed ? item.label : undefined}
          className={cn(
            "group flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden relative",
            pathname === item.to ? "nav-active" : "nav-item child-nav-item",
            isCollapsed ? "justify-center px-0 py-2" : "gap-2 px-3 py-2 ml-6"
          )}
        >
          {item.icon && (
            <item.icon
              className={cn(
                "w-4 h-4 flex-shrink-0 transition-all duration-300",
                pathname === item.to ? "text-white" : "text-muted-foreground group-hover:text-primary"
              )}
            />
          )}
          <span
            className={cn(
              "transition-all duration-300 whitespace-nowrap overflow-hidden",
              pathname === item.to ? "text-white font-semibold" : "text-secondary-col",
              isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
            )}
          >
            {item.label}
          </span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className={cn(
              "bg-[var(--jp-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[16px] h-4 px-1",
              isCollapsed ? "absolute top-1 right-2" : "ml-auto"
            )}>
              {item.badge}
            </span>
          )}
        </Link>
      );
    }

    // Render parent item with expandable children
    if (hasChildren) {
      return (
        <div key={item.to} className="relative">
          <button
            onClick={() => toggleExpanded(key)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "w-full group flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden relative",
              isActive ? "nav-active" : "nav-item",
              isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 flex-shrink-0 transition-all duration-300",
                isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
              )}
            />
            <span
              className={cn(
                "transition-all duration-300 whitespace-nowrap overflow-hidden flex-1 text-left",
                isActive ? "text-white font-semibold" : "text-secondary-col",
                isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
              )}
            >
              {item.label}
            </span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className={cn(
                "bg-[var(--jp-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[16px] h-4 px-1",
                isCollapsed ? "absolute top-1 right-2" : "mr-2"
              )}>
                {item.badge}
              </span>
            )}
            {!isCollapsed && (
              <ChevronRight
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                  isExpanded && "rotate-90"
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
              {item.children!.map(child => renderNavItem(child, true, key))}
            </motion.div>
          )}
        </div>
      );
    }

    // Render simple item without children
    return (
      <Link
        key={item.to}
        to={item.to}
        title={isCollapsed ? item.label : undefined}
        className={cn(
          "group flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden relative",
          isActive ? "nav-active" : "nav-item",
          isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4 flex-shrink-0 transition-all duration-300",
            isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"
          )}
        />
        <span
          className={cn(
            "transition-all duration-300 whitespace-nowrap overflow-hidden",
            isActive ? "text-white font-semibold" : "text-secondary-col",
            isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
          )}
        >
          {item.label}
        </span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className={cn(
            "bg-[var(--jp-red)] text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[16px] h-4 px-1",
            isCollapsed ? "absolute top-1 right-2" : "ml-auto mr-2"
          )}>
            {item.badge}
          </span>
        )}
        {!isCollapsed && isActive && (
          <ChevronRight className={cn(
            "w-4 h-4 text-white/70 flex-shrink-0",
            item.badge !== undefined && item.badge > 0 ? "ml-1" : "ml-auto"
          )} />
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
          isCollapsed ? "w-24 px-3" : "w-72"
        )}
      >
        <div className={cn("mb-2 flex items-start justify-between gap-3", isCollapsed ? "flex-col items-center gap-1.5" : "") }>
          <Link
            to="/"
            className={cn(
              "flex min-w-0 px-3 py-3 transition-all duration-300",
              isCollapsed ? "w-full justify-center px-2 py-2" : "items-center gap-2.5"
            )}
            title={isCollapsed ? "MIDORI" : undefined}
          >
            <div className="shrink-0 transition-all duration-300">
              <Logo size={36} />
            </div>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                isCollapsed ? "hidden w-0 opacity-0 pointer-events-none" : "block w-auto opacity-100"
              )}
            >
              <div className="font-display font-extrabold text-lg leading-none tracking-[0.2em] text-primary-col whitespace-nowrap">MIDORI</div>
              <div className="text-[10px] text-muted-col uppercase tracking-widest font-semibold whitespace-nowrap">{role}</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200/70 bg-white/70 shadow-sm text-slate-500 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-white/10 flex-shrink-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden", isCollapsed ? "mt-1" : "mt-2")}>
          {role === "admin" || role === "student" ? (
            // Admin and Student use hierarchical navigation
            items.map(item => renderNavItem(item))
          ) : (
            // Teacher uses flat navigation
            items.map((it) => {
              const isBaseRoute = it.to === `/${role}`;
              const active = pathname === it.to || (!isBaseRoute && pathname.startsWith(it.to));
              const Icon = it.icon;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  title={isCollapsed ? it.label : undefined}
                  className={cn(
                    "group flex items-center rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden",
                    active ? "nav-active" : "nav-item",
                    isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 flex-shrink-0 transition-all duration-300",
                      active ? "text-white" : "text-muted-foreground group-hover:text-primary",
                      isCollapsed ? "mx-auto" : ""
                    )}
                  />
                  <span
                    className={cn(
                      "transition-all duration-300 whitespace-nowrap overflow-hidden",
                      active ? "text-white font-semibold" : "text-secondary-col",
                      isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
                    )}
                  >
                    {it.label}
                  </span>
                  {!isCollapsed && active && <ChevronRight className="w-4 h-4 ml-auto text-white/70 flex-shrink-0" />}
                </Link>
              );
            })
          )}
        </nav>

        <button
          onClick={() => { logout(); nav({ to: "/login" }); }}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "mt-2 rounded-xl text-sm font-medium nav-item text-[var(--jp-red)] hover:bg-[var(--jp-red)]/10 transition-all duration-300 flex items-center",
            isCollapsed ? "justify-center px-0 py-2.5" : "gap-2 px-3 py-2.5"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-all duration-300",
              isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"
            )}
          >
            Logout
          </span>
        </button>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 overlay-dark" onClick={() => setOpen(false)}>
          <aside className="absolute left-0 top-0 bottom-0 w-72 glass-sidebar p-4 rounded-r-3xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="font-display font-extrabold text-xl tracking-[0.2em] text-primary-col mb-6">MIDORI</div>
            <nav className="space-y-1">
              {role === "admin" || role === "student" ? (
                // Admin and Student hierarchical mobile nav
                items.map(item => {
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
                          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </button>
                        {isExpanded && (
                          <div className="ml-4 space-y-1">
                            {item.children!.map(child => (
                              <Link
                                key={child.to}
                                to={child.to}
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
              ) : (
                // Teacher flat mobile nav
                items.map((it) => {
                  const isBaseRoute = it.to === `/${role}`;
                  const active = pathname === it.to || (!isBaseRoute && pathname.startsWith(it.to));
                  const Icon = it.icon;
                  return (
                    <Link key={it.to} to={it.to} onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${active ? "nav-active" : "nav-item"}`}>
                      <Icon className="w-4 h-4" /> {it.label}
                    </Link>
                  );
                })
              )}
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
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-col pointer-events-none" />
              <input
                placeholder="Search lessons, grammar, vocabulary…"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/95 border border-slate-200/80 dark:bg-[#1e2330] dark:border-white/10 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-200/60 focus:border-blue-300/70 dark:focus:ring-indigo-500/40 dark:focus:border-indigo-500/50 shadow-sm hover:shadow-[0_8px_24px_rgba(148,163,184,0.16)] dark:hover:shadow-none transition-all duration-200 placeholder:text-muted-col/70 dark:placeholder:text-slate-400"
              />
            </div>

            {/* XP + Streak (students) */}
            {role === "student" && (
              <div className="hidden xl:flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>9,820 XP</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--jp-red)]/10 text-[var(--jp-red)] text-xs font-semibold">
                  <Flame className="w-3.5 h-3.5" />
                  <span>32</span>
                </div>
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
                  onClick={(e) => { e.stopPropagation(); setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                  className="relative p-2 rounded-xl nav-item"
                >
                  <Bell className="w-5 h-5 text-secondary-col" />
                  {notifications.some(n => n.unread) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--jp-red)]" />
                  )}
                </button>

                {notifOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="fixed w-80 rounded-2xl shadow-2xl z-[200] flex flex-col overflow-hidden"
                    style={{ top: "72px", right: "24px" }}
                  >
                    <div className="bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.35)] rounded-2xl overflow-hidden"
                      style={{ maxHeight: "520px" }}>

                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Notifications</span>
                        <button
                          onClick={() => setNotifOpen(false)}
                          className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                        >
                          Close
                        </button>
                      </div>

                      <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(520px - 116px)" }}>
                        <div className="p-2 space-y-1">
                          {dropdownNotifications.map(n => {
                            const Icon = n.icon;
                            return (
                              <div
                                key={n.id}
                                className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 ${
                                  n.unread
                                    ? "bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                                    : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                                }`}
                              >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  n.unread ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400" : "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400"
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{n.title}</span>
                                    {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 flex-shrink-0 mt-0.5" />}
                                  </div>
                                  <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
                                    {n.desc}
                                  </p>
                                  <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 block">{n.time}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="border-t border-gray-100 dark:border-white/10 p-2 flex-shrink-0 bg-white dark:bg-[#0f1117]">
                        <Link
                          to={notificationsPath}
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
                  onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
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
                    <div className="text-xs font-semibold leading-tight text-primary-col">{user?.name ?? "Yuki T."}</div>
                    <div className="text-[10px] text-muted-col leading-tight">{roleLabels[role]}</div>
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
                      onClick={() => { logout(); nav({ to: "/login" }); }}
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

        {role === "student" && <Footer />}

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 glass-nav rounded-2xl px-2 py-2 flex justify-around">
          {items.slice(0, 5).map((it) => {
            const targetTo = it.children && it.children.length > 0 && (it.to.endsWith("-modules") || it.to.includes("practice"))
              ? it.children[0].to
              : it.to;
            const isBaseRoute = targetTo === `/${role}`;
            const active = pathname === targetTo || (!isBaseRoute && pathname.startsWith(targetTo));
            const Icon = it.icon;
            return (
              <Link key={it.to} to={targetTo as any}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-semibold transition-all duration-200 ${
                  active ? "bg-gradient-hero text-white shadow" : "text-muted-col"
                }`}>
                <Icon className={`w-5 h-5 ${active ? "text-white" : ""}`} />
                <span>{it.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
