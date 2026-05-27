import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Users, BookOpen, GraduationCap, ClipboardCheck,
  Activity, Bot, Zap, AlertTriangle
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid
} from "recharts";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const platformStats = {
  totalUsers: 12847,
  activeUsers: 3842,
  teachers: 128,
  totalContent: 4832,
  totalExams: 245,
  dailyActiveUsers: [
    { day: "Mon", users: 3200 }, { day: "Tue", users: 3650 }, { day: "Wed", users: 3400 },
    { day: "Thu", users: 3890 }, { day: "Fri", users: 4100 }, { day: "Sat", users: 2950 }, { day: "Sun", users: 2200 },
  ],
  contentBreakdown: [
    { type: "Grammar", count: 1240, color: "oklch(0.62 0.18 270)" },
    { type: "Vocabulary", count: 1850, color: "oklch(0.72 0.15 230)" },
    { type: "Listening", count: 820, color: "oklch(0.75 0.18 340)" },
    { type: "Shadowing", count: 542, color: "oklch(0.6 0.22 25)" },
    { type: "Exams", count: 380, color: "oklch(0.72 0.15 230)" },
  ],
  aiRequests: [
    { day: "Mon", requests: 3200 }, { day: "Tue", requests: 4100 }, { day: "Wed", requests: 3800 },
    { day: "Thu", requests: 4500 }, { day: "Fri", requests: 5200 }, { day: "Sat", requests: 3100 }, { day: "Sun", requests: 2400 },
  ],
  pendingApprovals: {
    teachers: 7,
    exams: 12,
    content: 23,
    reports: 5,
  },
  topContent: [
    { title: "JLPT N5 Grammar — 〜ても", type: "Grammar", views: 28420, completion: 78 },
    { title: "N3 Vocabulary Set", type: "Vocabulary", views: 19820, completion: 65 },
    { title: "Business Listening", type: "Listening", views: 15430, completion: 72 },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, icon }: {
  label: string; value: string | number; icon: React.ElementType;
}) {
  const Icon = icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-base p-3.5"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-7 h-7 rounded-lg glass-surface flex items-center justify-center">
          <Icon className={`w-3.5 h-3.5 text-primary`} />
        </div>
        <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold">{label}</span>
      </div>
      <div className="font-display font-black text-xl text-primary-col">{value}</div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Platform Overview</h1>
          <p className="text-sm text-secondary-col mt-0.5">Real-time monitoring and system health</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-secondary-col text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[var(--status-active)] shadow-sm shadow-[var(--status-active)]/50" />
          All systems operational
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="Total Users" value={platformStats.totalUsers.toLocaleString()} icon={Users} />
        <MetricCard label="Active Today" value={platformStats.activeUsers.toLocaleString()} icon={Activity} />
        <MetricCard label="Teachers" value={platformStats.teachers} icon={GraduationCap} />
        <MetricCard label="Total Lessons" value={platformStats.totalContent.toLocaleString()} icon={BookOpen} />
        <MetricCard label="Total Exams" value={platformStats.totalExams} icon={ClipboardCheck} />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* DAU chart */}
        <div className="lg:col-span-3 card-base p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display font-bold text-sm text-primary-col flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Daily Active Users
            </h2>
            <span className="text-xs text-muted-col">Last 7 days</span>
          </div>
          <div className="h-[260px] min-h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={platformStats.dailyActiveUsers}>
                <defs>
                  <linearGradient id="dauFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.18 270)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.62 0.18 270)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#F3F4F6", backdropFilter: "blur(12px)" }} />
                <Area type="monotone" dataKey="users" stroke="oklch(0.62 0.18 270)" fill="url(#dauFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Requests chart */}
        <div className="lg:col-span-2 card-base p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display font-bold text-sm text-primary-col flex items-center gap-2">
              <Bot className="w-4 h-4 text-[var(--status-teacher)]" />
              AI Request Volume
            </h2>
            <div className="text-xs text-muted-col">Total today: <strong className="text-primary-col">24,300</strong></div>
          </div>
          <div className="h-[260px] min-h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformStats.aiRequests} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#F3F4F6", backdropFilter: "blur(12px)" }} />
                <Bar dataKey="requests" fill="oklch(0.72 0.15 230)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content breakdown */}
        <div className="card-base p-5">
          <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Content Breakdown
          </h2>
          <div className="space-y-3">
            {platformStats.contentBreakdown.map(item => (
              <div key={item.type}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-secondary-col">{item.type}</span>
                  <span className="text-primary-col font-bold">{item.count.toLocaleString()}</span>
                </div>
                <div className="h-1.5 glass-surface rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.count / 2000) * 100}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending approvals */}
        <div className="card-base p-5">
          <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--status-pending)]" />
            Pending Approvals
          </h2>
          <div className="space-y-2">
            {Object.entries(platformStats.pendingApprovals).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl glass-surface">
                <span className="text-xs font-semibold text-secondary-col capitalize">{key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--status-pending)]">{value}</span>
                  <button className="px-2 py-1 rounded-lg bg-[var(--status-pending)]/10 text-[var(--status-pending)] text-[10px] font-bold hover:bg-[var(--status-pending)]/20 transition">Review</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top content */}
        <div className="lg:col-span-2 card-base p-5">
          <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Top Performing Content
          </h2>
          <div className="space-y-2">
            {platformStats.topContent.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass-surface hover:bg-[var(--accent)] transition">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-xs font-black flex-shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-primary-col truncate">{item.title}</div>
                  <div className="text-[10px] text-muted-col">{item.type} · {item.views.toLocaleString()} views</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-[var(--status-active)]">{item.completion}%</div>
                  <div className="text-[10px] text-muted-col">completion</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
