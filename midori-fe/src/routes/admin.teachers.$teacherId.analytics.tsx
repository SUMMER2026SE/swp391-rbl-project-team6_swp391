import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  BookOpen,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
  Eye,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type TeacherInfo = {
  id: string;
  name: string;
  email: string;
};

type ClassPerformance = {
  name: string;
  avgScore: number;
  completion: number;
  attendance: number;
};

type ProgressData = {
  month: string;
  students: number;
  score: number;
};

// Mock data
const mockTeacher: TeacherInfo = {
  id: "teacher-001",
  name: "Nguyen Van A",
  email: "nguyen.van.a@midori.edu",
};

const progressData: ProgressData[] = [
  { month: "Jan", students: 45, score: 72 },
  { month: "Feb", students: 52, score: 75 },
  { month: "Mar", students: 58, score: 78 },
  { month: "Apr", students: 65, score: 80 },
  { month: "May", students: 72, score: 82 },
  { month: "Jun", students: 80, score: 85 },
];

const completionData = [
  { name: "N5 Basic", rate: 92 },
  { name: "JLPT N4", rate: 85 },
  { name: "Conversation", rate: 78 },
  { name: "Business", rate: 88 },
];

const avgScoreData = [
  { name: "N5 Basic", score: 85 },
  { name: "JLPT N4", score: 78 },
  { name: "Conversation", score: 82 },
  { name: "Business", score: 80 },
];

const attendanceData = [
  { name: "Jan", rate: 90 },
  { name: "Feb", rate: 92 },
  { name: "Mar", rate: 88 },
  { name: "Apr", rate: 94 },
  { name: "May", rate: 95 },
  { name: "Jun", rate: 93 },
];

const classPerformance: ClassPerformance[] = [
  { name: "N5 Basic Japanese", avgScore: 85, completion: 92, attendance: 95 },
  { name: "JLPT N4 Prep", avgScore: 78, completion: 85, attendance: 90 },
  { name: "Conversational Japanese", avgScore: 82, completion: 78, attendance: 88 },
  { name: "Business Japanese", avgScore: 80, completion: 88, attendance: 93 },
];

// Avatar color helper
const AVATAR_COLORS = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-teal-500",
  "from-orange-500 to-yellow-500",
  "from-red-500 to-pink-500",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/teachers/$teacherId/analytics")({
  component: TeacherAnalyticsPage,
});

function TeacherAnalyticsPage() {
  const { teacherId } = Route.useParams();
  const [teacher] = useState<TeacherInfo>(mockTeacher);

  const initials = teacher.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  // Find best and lowest performing classes
  const sortedByScore = [...classPerformance].sort((a, b) => b.avgScore - a.avgScore);
  const bestClass = sortedByScore[0];
  const lowestClass = sortedByScore[sortedByScore.length - 1];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            to="/admin/teachers/$teacherId"
            params={{ teacherId }}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary hover:bg-accent transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`w-10 h-10 rounded-xl bg-linear-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}
              >
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-display font-black text-primary-col">
                  Teacher Analytics
                </h1>
                <p className="text-sm text-secondary-col">{teacher.name}</p>
              </div>
            </div>
          </div>
        </div>

        <Link
          to="/admin/teachers/$teacherId"
          params={{ teacherId }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:text-primary hover:bg-accent transition"
        >
          <Eye className="w-4 h-4" /> View Profile
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Classes</p>
            <p className="font-display font-black text-lg text-primary-col">4</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/12 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Students
            </p>
            <p className="font-display font-black text-lg text-primary-col">96</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.18_270)]/12 flex items-center justify-center">
            <Award className="w-5 h-5 text-[oklch(0.62_0.18_270)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Avg Score
            </p>
            <p className="font-display font-black text-lg text-primary-col">82%</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-[var(--status-active)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Completion
            </p>
            <p className="font-display font-black text-lg text-primary-col">88%</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/12 flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Attendance
            </p>
            <p className="font-display font-black text-lg text-primary-col">93%</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/12 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Homework
            </p>
            <p className="font-display font-black text-lg text-primary-col">87%</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Student Progress Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-base p-5"
        >
          <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Student Progress Over Time
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--status-active)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--status-active)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--status-teacher)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--status-teacher)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-col)" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "var(--muted-col)" }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[60, 100]}
                  tick={{ fontSize: 12, fill: "var(--muted-col)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="students"
                  stroke="var(--status-active)"
                  fillOpacity={1}
                  fill="url(#colorStudents)"
                  name="Students"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="score"
                  stroke="var(--status-teacher)"
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  name="Score %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Class Completion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-base p-5"
        >
          <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" /> Class Completion Rate
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: "var(--muted-col)" }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: "var(--muted-col)" }}
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="rate"
                  fill="var(--status-active)"
                  radius={[0, 4, 4, 0]}
                  name="Completion %"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Average Score by Class */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-base p-5"
        >
          <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Average Score by Class
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgScoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-col)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--muted-col)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="score"
                  fill="var(--status-teacher)"
                  radius={[4, 4, 0, 0]}
                  name="Avg Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Attendance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-base p-5"
        >
          <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Attendance Trend
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--status-teacher)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--status-teacher)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-col)" }} />
                <YAxis domain={[70, 100]} tick={{ fontSize: 12, fill: "var(--muted-col)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="var(--status-teacher)"
                  fillOpacity={1}
                  fill="url(#colorAttendance)"
                  name="Attendance %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Performance Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-base p-5"
      >
        <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> Performance Breakdown
        </h2>

        {/* Best & Lowest Performance Highlights */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl bg-[var(--status-active)]/8 border border-[var(--status-active)]/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[var(--status-active)]" />
              <span className="text-xs font-bold text-[var(--status-active)] uppercase">
                Best Performing Class
              </span>
            </div>
            <p className="text-sm font-semibold text-primary-col">{bestClass.name}</p>
            <div className="flex gap-4 mt-2">
              <span className="text-xs text-muted-col">
                Score: <span className="font-bold text-primary-col">{bestClass.avgScore}%</span>
              </span>
              <span className="text-xs text-muted-col">
                Completion:{" "}
                <span className="font-bold text-primary-col">{bestClass.completion}%</span>
              </span>
              <span className="text-xs text-muted-col">
                Attendance:{" "}
                <span className="font-bold text-primary-col">{bestClass.attendance}%</span>
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[var(--status-pending)]/8 border border-[var(--status-pending)]/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[var(--status-pending)]" />
              <span className="text-xs font-bold text-[var(--status-pending)] uppercase">
                Needs Improvement
              </span>
            </div>
            <p className="text-sm font-semibold text-primary-col">{lowestClass.name}</p>
            <div className="flex gap-4 mt-2">
              <span className="text-xs text-muted-col">
                Score: <span className="font-bold text-primary-col">{lowestClass.avgScore}%</span>
              </span>
              <span className="text-xs text-muted-col">
                Completion:{" "}
                <span className="font-bold text-primary-col">{lowestClass.completion}%</span>
              </span>
              <span className="text-xs text-muted-col">
                Attendance:{" "}
                <span className="font-bold text-primary-col">{lowestClass.attendance}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Performance Table */}
        <div className="overflow-x-auto min-w-[600px]">
          <div className="grid grid-cols-5 gap-2 px-4 py-2.5 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
            <div className="col-span-2">Class</div>
            <div className="text-center">Avg Score</div>
            <div className="text-center">Completion</div>
            <div className="text-center">Attendance</div>
          </div>
          {classPerformance.map((cls, i) => (
            <motion.div
              key={cls.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center"
            >
              <div className="col-span-2">
                <p className="text-sm font-semibold text-primary-col truncate">{cls.name}</p>
              </div>
              <div className="text-center">
                <span
                  className={`text-sm font-bold ${
                    cls.avgScore >= 80
                      ? "text-[var(--status-active)]"
                      : cls.avgScore >= 70
                        ? "text-[var(--status-pending)]"
                        : "text-[var(--status-rejected)]"
                  }`}
                >
                  {cls.avgScore}%
                </span>
              </div>
              <div className="text-center">
                <span className="text-sm font-bold text-primary-col">{cls.completion}%</span>
              </div>
              <div className="text-center">
                <span className="text-sm font-bold text-primary-col">{cls.attendance}%</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
