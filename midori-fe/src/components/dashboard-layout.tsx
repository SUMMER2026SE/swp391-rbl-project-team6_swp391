import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, useTheme, type Role } from "@/lib/auth";
import { SakuraBg } from "./sakura-bg";
import { Logo } from "./logo";
import {
  LayoutDashboard, BookOpen, GraduationCap, Layers, Headphones, Mic,
  ClipboardCheck, Trophy, LineChart, User, LogOut, Bell, Search, Flame, Sparkles,
  Users, ShieldCheck, Settings, BookMarked, Megaphone, ChevronRight, Menu,
  Bot, ChevronDown, Sun, Moon, BellRing
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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

function getNav(role: Role): NavItem[] {
  return role === "student" ? studentNav : role === "teacher" ? teacherNav : adminNav;
}

export function DashboardLayout({ role, children }: { role: Role; children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = getNav(role);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [expandedNotifIds, setExpandedNotifIds] = useState<Set<number>>(new Set());

  const notifications = [
    { id: 1, title: "New grammar lesson available", desc: "~なければならない pattern is ready", time: "2 min ago", unread: true, icon: GraduationCap },
    { id: 2, title: "Daily streak reminder", desc: "Complete today's lesson to keep your 32-day streak!", time: "1 hour ago", unread: true, icon: Flame },
    { id: 3, title: "Weekly leaderboard update", desc: "You're now #4 — just 80 XP behind #3!", time: "3 hours ago", unread: false, icon: Trophy },
    { id: 4, title: "AI Sensei feedback", desc: "Sensei reviewed your shadowing session", time: "Yesterday", unread: false, icon: Bot },
    { id: 5, title: "New badge earned", desc: "You unlocked 'Week Warrior' badge!", time: "2 days ago", unread: false, icon: Sparkles },
  ];

  const LONG_TEXT_THRESHOLD = 60;
  const isLongText = (text: string) => text.length > LONG_TEXT_THRESHOLD;

  const toggleExpanded = (id: number) => {
    setExpandedNotifIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (user === null) {
      const t = setTimeout(() => {
        if (typeof window !== "undefined" && !localStorage.getItem("midori_user")) nav({ to: "/login" });
      }, 50);
      return () => clearTimeout(t);
    }
    if (user && user.role !== role) nav({ to: `/${user.role}` });
  }, [user, role, nav]);

  useEffect(() => {
    if (!notifOpen && !userMenuOpen) return;
    const handler = () => { setNotifOpen(false); setUserMenuOpen(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [notifOpen, userMenuOpen]);

  const roleLabels: Record<Role, string> = {
    student: "Student",
    teacher: "Teacher",
    admin: "Administrator",
  };

  return (
    <div className="min-h-screen flex">
      <SakuraBg count={14} />

      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 glass-sidebar m-3 mr-0 rounded-3xl p-4 sticky top-3 h-[calc(100vh-1.5rem)]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 px-3 py-3 mb-2">
          <Logo size={36} />
          <div>
            <div className="font-display font-extrabold text-lg leading-none tracking-[0.2em] text-primary-col">MIDORI</div>
            <div className="text-[10px] text-muted-col uppercase tracking-widest font-semibold">{role}</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 mt-2 space-y-1 overflow-y-auto">
          {items.map((it) => {
            const isBaseRoute = it.to === `/${role}`;
            const active = pathname === it.to || (!isBaseRoute && pathname.startsWith(it.to));
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? "nav-active"
                    : "nav-item"
                }`}>
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-white" : "text-muted-foreground group-hover:text-primary"}`} />
                <span className={active ? "text-white font-semibold" : "text-secondary-col"}>{it.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto text-white/70" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button onClick={() => { logout(); nav({ to: "/login" }); }}
          className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium nav-item text-[var(--jp-red)] hover:bg-[var(--jp-red)]/10 transition">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 overlay-dark" onClick={() => setOpen(false)}>
          <aside className="absolute left-0 top-0 bottom-0 w-72 glass-sidebar p-4 rounded-r-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="font-display font-extrabold text-xl tracking-[0.2em] text-primary-col mb-6">MIDORI</div>
            <nav className="space-y-1">
              {items.map((it) => {
                const isBaseRoute = it.to === `/${role}`;
                const active = pathname === it.to || (!isBaseRoute && pathname.startsWith(it.to));
                const Icon = it.icon;
                return (
                  <Link key={it.to} to={it.to} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${active ? "nav-active" : "nav-item"}`}>
                    <Icon className="w-4 h-4" /> {it.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
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
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-col" />
              <input
                placeholder="Search lessons, grammar, vocabulary…"
                className="w-full pl-10 pr-4 py-2 rounded-xl search-input text-sm"
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
                    {/* Outer shell: solid opaque surface in both modes — stops dashboard bleed */}
                    <div className="bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.35)] rounded-2xl overflow-hidden"
                      style={{ maxHeight: "520px" }}>

                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10 flex-shrink-0">
                        <span className="font-bold text-sm text-gray-900 dark:text-gray-100">Notifications</span>
                        <button
                          onClick={() => setNotifOpen(false)}
                          className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                        >
                          Close
                        </button>
                      </div>

                      {/* Scrollable list */}
                      <div className="overflow-y-auto flex-1" style={{ maxHeight: "calc(520px - 116px)" }}>
                        <div className="p-2 space-y-1">
                          {notifications.map(n => {
                            const Icon = n.icon;
                            const isExpanded = expandedNotifIds.has(n.id);
                            const showToggle = isLongText(n.desc);
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
                                  <p className={`text-[13px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed ${isExpanded ? "" : "line-clamp-2"}`}>
                                    {n.desc}
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-[11px] text-gray-400 dark:text-gray-500">{n.time}</span>
                                    {showToggle && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); toggleExpanded(n.id); }}
                                        className="text-[11px] font-medium text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                                      >
                                        {isExpanded ? "Less" : "More"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Footer — solid background, no transparency */}
                      <div className="border-t border-gray-100 dark:border-white/10 p-2 flex-shrink-0 bg-white dark:bg-[#0f1117]">
                        <Link
                          to="/student/notifications"
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
                  <div className="w-9 h-9 rounded-full bg-gradient-hero grid place-items-center text-white font-bold text-sm">
                    {(user?.name?.[0] ?? "Y").toUpperCase()}
                  </div>
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
                      to={`/${role}/profile`}
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

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 glass-nav rounded-2xl px-2 py-2 flex justify-around">
          {items.slice(0, 5).map((it) => {
            const isBaseRoute = it.to === `/${role}`;
            const active = pathname === it.to || (!isBaseRoute && pathname.startsWith(it.to));
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to}
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
