import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, useTheme, getAvatarInitial, getUserAvatar, type FrontendRole } from "@/lib/auth";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";
import { SakuraBg } from "./sakura-bg";
import { Logo } from "./logo";
import {
  LayoutDashboard, BookOpen, GraduationCap, Layers, Headphones, Mic,
  ClipboardCheck, Trophy, LineChart, User, LogOut, Bell, Search, Flame, Sparkles,
  Users, ShieldCheck, Settings, BookMarked, Megaphone, ChevronRight, Menu,
  Bot, ChevronDown, Sun, Moon, BellRing, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TEACHER_NOTIFICATIONS } from "@/data/teacher-notifications";
import type { Notification } from "@/types/notification";

type NavItem = { to: string; label: string; icon: React.ElementType };

const studentNav: NavItem[] = [
  { to: "/student", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/vocabulary", label: "Vocabulary", icon: BookOpen },
  { to: "/student/grammar", label: "Grammar", icon: GraduationCap },
  { to: "/student/flashcards", label: "Flashcards", icon: Layers },
  { to: "/student/listening", label: "Listening", icon: Headphones },
  { to: "/student/shadowing", label: "AI Shadowing", icon: Mic },
  { to: "/student/exams", label: "Exams", icon: ClipboardCheck },
  { to: "/student/ai-sensei", label: "AI Sensei", icon: Bot },
  { to: "/student/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/student/progress", label: "Progress", icon: LineChart },
  { to: "/student/notifications", label: "Notifications", icon: BellRing },
  { to: "/student/profile", label: "Profile", icon: User },
];

const teacherNav: NavItem[] = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/grammar", label: "Grammar", icon: GraduationCap },
  { to: "/teacher/vocabulary", label: "Vocabulary", icon: BookOpen },
  { to: "/teacher/flashcards", label: "Flashcards", icon: Layers },
  { to: "/teacher/listening", label: "Listening", icon: Headphones },
  { to: "/teacher/shadowing", label: "Shadowing", icon: Mic },
  { to: "/teacher/exams", label: "Exams", icon: ClipboardCheck },
  { to: "/teacher/notifications", label: "Notifications", icon: BellRing },
  { to: "/teacher/profile", label: "Profile", icon: User },
  { to: "/teacher/settings", label: "Settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "User Management", icon: Users },
  { to: "/admin/teachers", label: "Teacher Approval", icon: ShieldCheck },
  { to: "/admin/exams", label: "Exam Approval", icon: ClipboardCheck },
  { to: "/admin/moderation", label: "Content Moderation", icon: BookMarked },
  { to: "/admin/analytics", label: "Analytics", icon: LineChart },
  { to: "/admin/notifications", label: "Notifications", icon: Megaphone },
  { to: "/admin/settings", label: "System Settings", icon: Settings },
  { to: "/admin/profile", label: "Profile", icon: User },
];

function getNav(role: FrontendRole): NavItem[] {
  return role === "student" ? studentNav : role === "teacher" ? teacherNav : adminNav;
}

export function DashboardLayout({ role, children }: { role: FrontendRole; children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = getNav(role);
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

  return (
    <div className="min-h-screen flex">
      <SakuraBg count={14} />

      <aside
        className={cn(
          "hidden lg:flex flex-col glass-sidebar m-3 mr-0 rounded-3xl p-4 sticky top-3 h-[calc(100vh-1.5rem)] transition-[width,padding] duration-300 ease-in-out overflow-visible",
          isCollapsed ? "w-20 px-3" : "w-72"
        )}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className={cn(
            "absolute -right-3 top-8 z-20 hidden lg:flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-slate-900/95 text-secondary-col shadow-lg backdrop-blur-sm transition-all duration-300 hover:text-primary",
            isCollapsed ? "top-7" : "top-8"
          )}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        <div className={cn("mb-2", isCollapsed ? "flex justify-center pr-2" : "flex items-start justify-between gap-3 pr-8") }>
          <Link
            to="/"
            className={cn(
              "flex min-w-0 px-3 py-3 transition-all duration-300",
              isCollapsed ? "w-full justify-center" : "items-center gap-2.5"
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
        </div>

        <nav className="flex-1 mt-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {items.map((it) => {
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
          })}
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

        <div className="mt-4">
          <Footer />
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
