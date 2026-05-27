import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Users, BookOpen, TrendingUp, CheckCircle, BarChart3,
  Headphones, GraduationCap, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  BarChart, Bar, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid
} from "recharts";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const teacherStats = {
  totalStudents: 248,
  activeStudents: 186,
  lessonCompletionRate: 78,
  listeningAvgAccuracy: 71,
  vocabularyUploaded: 1240,
  shadowingSessions: 89,
  totalExams: 34,
};

const weeklyData = [
  { day: "Mon", students: 145, lessons: 38, exams: 5 },
  { day: "Tue", students: 162, lessons: 42, exams: 8 },
  { day: "Wed", students: 138, lessons: 35, exams: 3 },
  { day: "Thu", students: 178, lessons: 48, exams: 12 },
  { day: "Fri", students: 155, lessons: 40, exams: 6 },
  { day: "Sat", students: 98, lessons: 25, exams: 2 },
  { day: "Sun", students: 67, lessons: 18, exams: 1 },
];

const recentUploads = [
  { id: 1, type: "vocabulary", title: "N2 Kanji — 環境", level: "N2", views: 342, completions: 156, date: "2 days ago" },
  { id: 2, type: "grammar", title: "〜たところで", level: "N3", views: 218, completions: 89, date: "3 days ago" },
  { id: 3, type: "listening", title: "Business Phone Manners", level: "N3", views: 445, completions: 203, date: "5 days ago" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, delta, icon, color, sublabel }: {
  label: string; value: string | number; delta?: string; icon: React.ElementType; color: string; sublabel?: string;
}) {
  const Icon = icon;
  const up = delta?.startsWith("+");
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card text-card-foreground border border-border/50 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="font-display font-black text-2xl">{value}</div>
      <div className="flex items-center justify-between mt-1.5">
        {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
        {delta && (
          <span className={`text-[10px] font-bold flex items-center gap-0.5 ${up ? "text-green-500" : "text-red-400"}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {delta}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export const Route = createFileRoute("/teacher/")({ component: TeacherDashboard });

function TeacherDashboard() {
  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-display font-black text-foreground">Teacher Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome back, Sensei Taro — here's your teaching overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Students" value={teacherStats.totalStudents} delta="+12" icon={Users} color="bg-blue-50 text-blue-500" sublabel="enrolled" />
        <StatCard label="Active Students" value={teacherStats.activeStudents} delta="+8" icon={TrendingUp} color="bg-green-50 text-green-500" sublabel="this week" />
        <StatCard label="Lesson Completion" value={`${teacherStats.lessonCompletionRate}%`} delta="+5%" icon={CheckCircle} color="bg-purple-50 text-purple-500" sublabel="avg rate" />
      </div>

      {/* Main grid: Weekly Activity + Recent Uploads */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Weekly activity chart */}
        <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display font-bold text-base flex items-center gap-2 text-foreground">
              <BarChart3 className="w-4 h-4 text-primary" />
              Weekly Activity
            </h2>
            <div className="flex gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Students</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Lessons</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Student engagement over the past 7 days</p>
          <div className="h-[260px] min-h-[240px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 300)" opacity={0.3} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", backgroundColor: "var(--card)" }} />
                <Bar dataKey="students" fill="oklch(0.62 0.18 270)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lessons" fill="oklch(0.72 0.18 340)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent uploads */}
        <div className="bg-card text-card-foreground border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base text-foreground">Your Recent Uploads</h2>
            <button className="text-xs text-primary font-semibold hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {recentUploads.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.type === "vocabulary" ? "bg-blue-50 text-blue-500 dark:bg-blue-950/30" :
                  item.type === "grammar" ? "bg-purple-50 text-purple-500 dark:bg-purple-950/30" :
                  "bg-green-50 text-green-500 dark:bg-green-950/30"
                }`}>
                  {item.type === "vocabulary" ? <BookOpen className="w-4 h-4" /> :
                   item.type === "grammar" ? <GraduationCap className="w-4 h-4" /> :
                   <Headphones className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground">{item.title}</div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <span className="px-1.5 py-0.5 rounded-full bg-muted font-bold">{item.level}</span>
                    <span>{item.views} views</span>
                    <span>·</span>
                    <span>{item.completions} completions</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] text-muted-foreground">{item.date}</div>
                  <button className="text-[10px] text-primary font-semibold hover:underline mt-0.5">Edit</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
