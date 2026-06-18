import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, GraduationCap, BookOpen, TrendingUp, Award, BarChart3,
  AlertTriangle, Loader2, Search, Eye, ShieldCheck, Calendar,
  BookUser, Star, CheckCircle
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell
} from "recharts";

// Mock data
const mockTeachers = [
  { id: "t001", name: "Sakura Tanaka", email: "sakura.t@example.com", avatar: null, classes: 3, students: 86, avgScore: 84, completionRate: 78, status: "ACTIVE", joinedDate: "2023-06-15" },
  { id: "t002", name: "Kenji Yamamoto", email: "kenji.y@example.com", avatar: null, classes: 2, students: 52, avgScore: 79, completionRate: 72, status: "ACTIVE", joinedDate: "2023-08-20" },
  { id: "t003", name: "Yuki Sato", email: "yuki.s@example.com", avatar: null, classes: 2, students: 44, avgScore: 88, completionRate: 85, status: "ACTIVE", joinedDate: "2023-09-01" },
  { id: "t004", name: "Akiko Suzuki", email: "akiko.s@example.com", avatar: null, classes: 1, students: 20, avgScore: 76, completionRate: 68, status: "ACTIVE", joinedDate: "2024-01-10" },
  { id: "t005", name: "Takeshi Kimura", email: "takeshi.k@example.com", avatar: null, classes: 1, students: 15, avgScore: 91, completionRate: 90, status: "ACTIVE", joinedDate: "2024-02-01" },
];

const performanceData = mockTeachers.map(t => ({
  name: t.name.split(" ")[0],
  avgScore: t.avgScore,
  completion: t.completionRate,
  students: t.students,
}));

const teacherRanking = [...mockTeachers].sort((a, b) => b.avgScore - a.avgScore);

const COLORS = ["oklch(0.62 0.18 270)", "oklch(0.72 0.15 230)", "oklch(0.72 0.18 340)", "oklch(0.6 0.22 25)", "oklch(0.6 0.2 25)"];

function getAvatarColor(id: string) {
  const AVATAR_COLORS = ["from-purple-500 to-pink-500", "from-blue-500 to-cyan-500", "from-green-500 to-teal-500", "from-orange-500 to-yellow-500", "from-red-500 to-pink-500"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) { hash = ((hash << 5) - hash) + id.charCodeAt(i); hash |= 0; }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const Route = createFileRoute("/admin/teacher-analytics")({ component: TeacherAnalyticsPage });

function TeacherAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredTeachers = mockTeachers.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalTeachers = mockTeachers.length;
  const totalStudents = mockTeachers.reduce((sum, t) => sum + t.students, 0);
  const totalClasses = mockTeachers.reduce((sum, t) => sum + t.classes, 0);
  const avgOverallScore = Math.round(mockTeachers.reduce((sum, t) => sum + t.avgScore, 0) / totalTeachers);
  const avgCompletionRate = Math.round(mockTeachers.reduce((sum, t) => sum + t.completionRate, 0) / totalTeachers);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-col">Loading teacher analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Teacher Analytics</h1>
          <p className="text-sm text-secondary-col mt-0.5">Monitor teacher performance and class metrics</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Total Teachers</p>
              <p className="font-display font-black text-2xl text-primary-col">{totalTeachers}</p>
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.72_0.15_230)]/12 flex items-center justify-center">
              <Users className="w-5 h-5 text-[oklch(0.72_0.15_230)]" />
            </div>
            <div>
              <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Total Students</p>
              <p className="font-display font-black text-2xl text-primary-col">{totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.18_270)]/12 flex items-center justify-center">
              <Award className="w-5 h-5 text-[oklch(0.62_0.18_270)]" />
            </div>
            <div>
              <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Avg Score</p>
              <p className="font-display font-black text-2xl text-primary-col">{avgOverallScore}%</p>
            </div>
          </div>
        </div>
        <div className="card-base p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[var(--status-active)]" />
            </div>
            <div>
              <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Completion</p>
              <p className="font-display font-black text-2xl text-primary-col">{avgCompletionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Performance by Teacher */}
        <div className="card-base p-5">
          <h3 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Performance by Teacher
          </h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#F3F4F6", backdropFilter: "blur(12px)" }} />
                <Bar dataKey="avgScore" fill="oklch(0.62 0.18 270)" radius={[4, 4, 0, 0]} name="Avg Score %" />
                <Bar dataKey="completion" fill="oklch(0.72 0.15 230)" radius={[4, 4, 0, 0]} name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[oklch(0.62_0.18_270)]" />
              <span className="text-xs text-muted-col">Avg Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[oklch(0.72_0.15_230)]" />
              <span className="text-xs text-muted-col">Completion</span>
            </div>
          </div>
        </div>

        {/* Teacher Ranking */}
        <div className="card-base p-5">
          <h3 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-[oklch(0.62_0.18_270)]" />
            Teacher Ranking
          </h3>
          <div className="space-y-3">
            {teacherRanking.map((teacher, i) => (
              <div key={teacher.id} className="flex items-center gap-3 p-3 rounded-xl glass-surface hover:bg-[var(--accent)] transition">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 ${
                  i === 0 ? "bg-[oklch(0.62_0.18_270)]" : i === 1 ? "bg-[oklch(0.72_0.15_230)]" : i === 2 ? "bg-[oklch(0.72_0.18_340)]" : "bg-[var(--accent)]"
                }`}>
                  {i + 1}
                </div>
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {teacher.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-col truncate">{teacher.name}</p>
                  <p className="text-[10px] text-muted-col">{teacher.classes} classes • {teacher.students} students</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4 text-[oklch(0.62_0.18_270)]" />
                    <span className="text-sm font-bold text-primary-col">{teacher.avgScore}%</span>
                  </div>
                  <p className="text-[10px] text-muted-col">{teacher.completionRate}% completion</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teacher List */}
      <div className="card-base overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b separator">
          <h3 className="font-display font-bold text-sm text-primary-col">All Teachers</h3>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-col" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search teachers..."
              className="w-full pl-9 pr-4 py-2 rounded-xl search-input text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-w-[900px]">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
            <div className="col-span-4">Teacher</div>
            <div className="col-span-1 text-center">Classes</div>
            <div className="col-span-1 text-center">Students</div>
            <div className="col-span-2 text-center">Avg Score</div>
            <div className="col-span-2 text-center">Completion</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          {filteredTeachers.map((teacher, i) => (
            <motion.div
              key={teacher.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center"
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {teacher.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-primary-col truncate">{teacher.name}</p>
                  <p className="text-[10px] text-muted-col truncate">{teacher.email}</p>
                </div>
              </div>

              <div className="col-span-1 text-center">
                <span className="text-sm font-semibold text-primary-col">{teacher.classes}</span>
              </div>

              <div className="col-span-1 text-center">
                <span className="text-sm font-semibold text-primary-col">{teacher.students}</span>
              </div>

              <div className="col-span-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Award className="w-4 h-4 text-[oklch(0.62_0.18_270)]" />
                  <span className="text-sm font-bold text-primary-col">{teacher.avgScore}%</span>
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 glass-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--status-active)]"
                      style={{ width: `${teacher.completionRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-primary-col w-8">{teacher.completionRate}%</span>
                </div>
              </div>

              <div className="col-span-2 flex justify-center gap-1">
                <button className="p-2 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition" title="View">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-xl text-secondary-col/60 hover:text-secondary-col hover:bg-accent transition" title="Analytics">
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
