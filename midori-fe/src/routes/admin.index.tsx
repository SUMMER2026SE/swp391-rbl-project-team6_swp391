import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Users, BookOpen, GraduationCap, ClipboardCheck,
  Activity, Bot, Zap, AlertTriangle, TrendingUp, Award, BookUser,
  Clock, Bell, Plus, ChevronRight
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import { useState, useEffect } from "react";
import { adminApi, type AdminDashboardSummaryResponse } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

// â”€â”€â”€ Mock Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const platformStats = {
  totalStudents: 12847,
  totalTeachers: 128,
  activeClasses: 45,
  learningCompletionRate: 72,
  dailyActiveUsers: [
    { day: "Mon", users: 3200 }, { day: "Tue", users: 3650 }, { day: "Wed", users: 3400 },
    { day: "Thu", users: 3890 }, { day: "Fri", users: 4100 }, { day: "Sat", users: 2950 }, { day: "Sun", users: 2200 },
  ],
  jlptDistribution: [
    { name: "N5", value: 35, color: "oklch(0.62 0.18 270)" },
    { name: "N4", value: 28, color: "oklch(0.72 0.15 230)" },
    { name: "N3", value: 20, color: "oklch(0.72 0.18 340)" },
    { name: "N2", value: 12, color: "oklch(0.6 0.22 25)" },
    { name: "N1", value: 5, color: "oklch(0.6 0.2 25)" },
  ],
  recentActivities: [
    { id: 1, type: "teacher", action: "Teacher created class", detail: "N5 Beginner Japanese", time: "2 min ago", icon: GraduationCap, color: "text-[var(--status-teacher)]" },
    { id: 2, type: "student", action: "Student completed lesson", detail: "Hiragana Basics", time: "5 min ago", icon: Award, color: "text-[var(--status-active)]" },
    { id: 3, type: "content", action: "Teacher uploaded content", detail: "JLPT N5 Grammar Quiz", time: "15 min ago", icon: BookOpen, color: "text-primary" },
    { id: 4, type: "student", action: "New student enrolled", detail: "Minato Aquo joined", time: "30 min ago", icon: Users, color: "text-[oklch(0.72_0.15_230)]" },
    { id: 5, type: "exam", action: "Exam completed", detail: "N4 Listening Test", time: "1 hour ago", icon: ClipboardCheck, color: "text-[var(--status-pending)]" },
  ],
  learningProgress: [
    { week: "W1", vocabulary: 820, grammar: 640, listening: 420, completion: 65 },
    { week: "W2", vocabulary: 940, grammar: 720, listening: 480, completion: 72 },
    { week: "W3", vocabulary: 880, grammar: 680, listening: 510, completion: 78 },
    { week: "W4", vocabulary: 1020, grammar: 780, listening: 590, completion: 82 },
  ],
  pendingApprovals: {
    teachers: 7,
    exams: 12,
    content: 23,
    reports: 5,
  },
};

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MetricCard({ label, value, icon, trend }: {
  label: string; value: string | number; icon: React.ElementType; trend?: { value: number; positive: boolean };
}) {
  const Icon = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base p-4 flex flex-col min-h-[6rem]"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-xl glass-surface flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-bold ${trend.positive ? "text-[var(--status-active)]" : "text-[var(--status-rejected)]"}`}>
            {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold leading-tight">{label}</span>
      <div className="font-display font-black text-xl text-primary-col mt-auto pt-1">{value}</div>
    </motion.div>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const [summary, setSummary] = useState<AdminDashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    adminApi
      .getDashboardSummary()
      .then((data) => {
        if (isMounted) {
          setSummary(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof ApiError ? err.message : "Unable to load dashboard summary");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Academic Dashboard</h1>
          <p className="text-sm text-secondary-col mt-0.5">Monitor platform performance and manage academic operations</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-secondary-col text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[var(--status-active)] shadow-sm shadow-[var(--status-active)]/50" />
          All systems operational
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Total Students"
          value={summary?.totalStudents?.toLocaleString() ?? platformStats.totalStudents.toLocaleString()}
          icon={Users}
          trend={{ value: 12, positive: true }}
        />
        <MetricCard
          label="Total Teachers"
          value={summary?.totalTeachers?.toLocaleString() ?? platformStats.totalTeachers.toLocaleString()}
          icon={GraduationCap}
          trend={{ value: 8, positive: true }}
        />
        <MetricCard
          label="Active Classes"
          value={platformStats.activeClasses}
          icon={BookUser}
          trend={{ value: 5, positive: true }}
        />
        <MetricCard
          label="Completion Rate"
          value={`${platformStats.learningCompletionRate}%`}
          icon={TrendingUp}
          trend={{ value: 3, positive: true }}
        />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Learning Progress Chart */}
        <div className="lg:col-span-2 card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-sm text-primary-col flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Learning Progress
            </h2>
            <div className="flex gap-3 text-[10px] text-secondary-col">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[oklch(0.62_0.18_270)]" /> Vocabulary</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.15_230)]" /> Grammar</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[oklch(0.72_0.18_340)]" /> Listening</span>
            </div>
          </div>
          <div className="h-[260px] min-h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformStats.learningProgress}>
                <defs>
                  <linearGradient id="vocabFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.18 270)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.62 0.18 270)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grammarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.15 230)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.72 0.15 230)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#F3F4F6", backdropFilter: "blur(12px)" }} />
                <Area type="monotone" dataKey="vocabulary" stroke="oklch(0.62 0.18 270)" fill="url(#vocabFill)" strokeWidth={2} name="Vocabulary" />
                <Area type="monotone" dataKey="grammar" stroke="oklch(0.72 0.15 230)" fill="url(#grammarFill)" strokeWidth={2} name="Grammar" />
                <Area type="monotone" dataKey="listening" stroke="oklch(0.72 0.18 340)" strokeWidth={2} name="Listening" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Students by JLPT Level */}
        <div className="card-base p-5">
          <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Students by JLPT Level
          </h2>
          <div className="h-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformStats.jlptDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {platformStats.jlptDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#F3F4F6", backdropFilter: "blur(12px)" }} formatter={(value) => [`${value}%`, "Students"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {platformStats.jlptDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-secondary-col">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-primary-col">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-sm text-primary-col flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Activities
            </h2>
            <button className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {platformStats.recentActivities.map((activity, i) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className={`w-8 h-8 rounded-xl glass-surface flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary-col">{activity.action}</p>
                    <p className="text-[10px] text-muted-col truncate">{activity.detail}</p>
                  </div>
                  <span className="text-[10px] text-muted-col shrink-0">{activity.time}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="card-base p-5">
          <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--status-pending)]" />
            Pending Approvals
          </h2>
          <div className="space-y-2">
            {[
              { key: "Teachers", value: summary?.pendingTeachers ?? platformStats.pendingApprovals.teachers, link: "/admin/teachers", color: "text-[var(--status-teacher)]" },
              { key: "Content", value: summary?.pendingContent ?? platformStats.pendingApprovals.content, link: "/admin/grammar", color: "text-primary" },
              { key: "Exams", value: platformStats.pendingApprovals.exams, link: "/admin/exams", color: "text-[var(--status-pending)]" },
              { key: "Reports", value: platformStats.pendingApprovals.reports, link: "/admin/moderation", color: "text-[var(--status-suspended)]" },
            ].map(({ key, value, link, color }) => (
              <Link
                key={key}
                to={link}
                className="flex items-center justify-between p-3 rounded-xl glass-surface hover:bg-[var(--accent)] transition group"
              >
                <span className={`text-xs font-semibold ${color}`}>{key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--status-pending)]">{value}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-col group-hover:text-primary transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-base p-5">
        <h2 className="font-display font-bold text-sm text-primary-col mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Add Teacher", icon: GraduationCap, link: "/admin/teachers", color: "text-[var(--status-teacher)]" },
            { label: "Create Class", icon: BookUser, link: "/admin/class-management", color: "text-primary" },
            { label: "Add Exam", icon: ClipboardCheck, link: "/admin/exams", color: "text-[var(--status-pending)]" },
            { label: "Upload Content", icon: BookOpen, link: "/admin/grammar", color: "text-[var(--status-active)]" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.link}
                className="flex items-center gap-3 p-4 rounded-xl glass-surface hover:bg-[var(--accent)] transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition">
                  <Icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-sm font-semibold text-primary-col">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
