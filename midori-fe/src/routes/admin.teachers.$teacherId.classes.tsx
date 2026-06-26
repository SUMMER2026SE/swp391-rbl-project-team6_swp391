import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  BookUser,
  TrendingUp,
  Plus,
  X,
  Loader2,
  Eye,
  RefreshCw,
  Calendar,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TeacherClass = {
  id: string;
  name: string;
  level: string;
  students: number;
  completionRate: number;
  avgScore: number;
  status: "active" | "inactive" | "completed";
  startDate: string;
  endDate?: string;
};

type TeacherInfo = {
  id: string;
  name: string;
  email: string;
};

// Mock classes database
const MOCK_CLASSES: Record<string, TeacherClass[]> = {
  "00000000-0000-0000-0000-000000000011": [
    {
      id: "cls-001",
      name: "JLPT N5 Intensive",
      level: "N5",
      students: 28,
      completionRate: 92,
      avgScore: 85,
      status: "active",
      startDate: "Jan 15, 2026",
    },
    {
      id: "cls-002",
      name: "JLPT N4 Prep Course",
      level: "N4",
      students: 22,
      completionRate: 85,
      avgScore: 78,
      status: "active",
      startDate: "Feb 1, 2026",
    },
    {
      id: "cls-003",
      name: "Business Japanese",
      level: "N2",
      students: 18,
      completionRate: 78,
      avgScore: 82,
      status: "active",
      startDate: "Mar 10, 2026",
    },
    {
      id: "cls-004",
      name: "Advanced Grammar",
      level: "N1",
      students: 28,
      completionRate: 88,
      avgScore: 80,
      status: "active",
      startDate: "Apr 5, 2026",
    },
  ],
  "00000000-0000-0000-0000-000000000012": [
    {
      id: "cls-005",
      name: "Conversational Japanese",
      level: "Mixed",
      students: 24,
      completionRate: 95,
      avgScore: 88,
      status: "active",
      startDate: "Jan 20, 2026",
    },
    {
      id: "cls-006",
      name: "Japanese Culture & Customs",
      level: "Mixed",
      students: 20,
      completionRate: 88,
      avgScore: 85,
      status: "active",
      startDate: "Feb 15, 2026",
    },
    {
      id: "cls-007",
      name: "Beginner Japanese",
      level: "N5",
      students: 28,
      completionRate: 90,
      avgScore: 82,
      status: "active",
      startDate: "Mar 1, 2026",
    },
  ],
  "00000000-0000-0000-0000-000000000013": [
    {
      id: "cls-008",
      name: "Beginner Japanese A1",
      level: "N5",
      students: 24,
      completionRate: 85,
      avgScore: 80,
      status: "active",
      startDate: "Feb 1, 2026",
    },
    {
      id: "cls-009",
      name: "Listening Practice",
      level: "N4",
      students: 24,
      completionRate: 80,
      avgScore: 78,
      status: "active",
      startDate: "Mar 15, 2026",
    },
  ],
  "00000000-0000-0000-0000-000000000014": [
    {
      id: "cls-010",
      name: "Grammar Masterclass",
      level: "N3",
      students: 18,
      completionRate: 72,
      avgScore: 75,
      status: "completed",
      startDate: "Oct 1, 2025",
      endDate: "Dec 31, 2025",
    },
    {
      id: "cls-011",
      name: "JLPT Reading Prep",
      level: "N2",
      students: 18,
      completionRate: 78,
      avgScore: 72,
      status: "completed",
      startDate: "Oct 1, 2025",
      endDate: "Dec 31, 2025",
    },
  ],
};

// Mock teachers database
const MOCK_TEACHERS: Record<string, TeacherInfo> = {
  "00000000-0000-0000-0000-000000000011": {
    id: "00000000-0000-0000-0000-000000000011",
    name: "Minato Watanabe",
    email: "minato.watanabe@example.com",
  },
  "00000000-0000-0000-0000-000000000012": {
    id: "00000000-0000-0000-0000-000000000012",
    name: "Rin Nakamura",
    email: "rin.nakamura@example.com",
  },
  "00000000-0000-0000-0000-000000000013": {
    id: "00000000-0000-0000-0000-000000000013",
    name: "Haruki Suzuki",
    email: "haruki.suzuki@example.com",
  },
  "00000000-0000-0000-0000-000000000014": {
    id: "00000000-0000-0000-0000-000000000014",
    name: "Aoi Kobayashi",
    email: "aoi.kobayashi@example.com",
  },
};

function getTeacherInfo(id: string): TeacherInfo {
  return MOCK_TEACHERS[id] || { id, name: `Teacher ${id.slice(-4)}`, email: "unknown@example.com" };
}

function getTeacherClasses(id: string): TeacherClass[] {
  return MOCK_CLASSES[id] || [];
}

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

export const Route = createFileRoute("/admin/teachers/$teacherId/classes")({
  component: TeacherClassesPage,
});

function TeacherClassesPage() {
  const { teacherId } = Route.useParams();
  const classes = getTeacherClasses(teacherId);
  const teacher = getTeacherInfo(teacherId);
  const [statusFilter, setStatusFilter] = useState("");

  const filteredClasses = classes.filter((c) => !statusFilter || c.status === statusFilter);

  const totalStudents = classes.reduce((sum, c) => sum + c.students, 0);
  const activeClasses = classes.filter((c) => c.status === "active").length;

  const initials = teacher.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

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
            <h1 className="text-2xl font-display font-black text-primary-col">Teacher Classes</h1>
            <p className="text-sm text-secondary-col mt-0.5">
              View all classes assigned to this teacher
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Total Classes
            </p>
            <p className="font-display font-black text-lg text-primary-col">{classes.length}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-[var(--status-active)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Active</p>
            <p className="font-display font-black text-lg text-primary-col">{activeClasses}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/12 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Total Students
            </p>
            <p className="font-display font-black text-lg text-primary-col">{totalStudents}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/12 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Avg Completion
            </p>
            <p className="font-display font-black text-lg text-primary-col">
              {Math.round(classes.reduce((sum, c) => sum + c.completionRate, 0) / classes.length)}%
            </p>
          </div>
        </div>
      </div>

      {/* Teacher Info & Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 p-3 rounded-xl glass-surface">
          <div
            className={`w-10 h-10 rounded-xl bg-linear-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-col">{teacher.name}</p>
            <p className="text-[10px] text-muted-col">{teacher.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl search-input text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition">
            <Plus className="w-4 h-4" /> Assign Class
          </button>
        </div>
      </div>

      {/* Classes Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto min-w-[900px]">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
            <div className="col-span-3">Class Name</div>
            <div className="col-span-1">Level</div>
            <div className="col-span-1 text-center">Students</div>
            <div className="col-span-2 text-center">Avg Score</div>
            <div className="col-span-2 text-center">Completion</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {filteredClasses.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3">
              <BookOpen className="w-10 h-10 text-muted-col/40" />
              <p className="text-sm font-bold text-secondary-col">No classes found</p>
            </div>
          )}

          {filteredClasses.map((cls, i) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center"
            >
              <div className="col-span-3">
                <p className="text-sm font-semibold text-primary-col truncate">{cls.name}</p>
                <div className="flex items-center gap-1 text-[10px] text-muted-col">
                  <Calendar className="w-3 h-3" />
                  {cls.startDate} {cls.endDate ? `- ${cls.endDate}` : ""}
                </div>
              </div>

              <div className="col-span-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/12 text-purple-500 border border-purple-500/20">
                  {cls.level}
                </span>
              </div>

              <div className="col-span-1 text-center">
                <span className="text-sm font-semibold text-primary-col">{cls.students}</span>
              </div>

              <div className="col-span-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[oklch(0.62_0.18_270)]" />
                  <span className="text-xs font-bold text-primary-col">{cls.avgScore}%</span>
                </div>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 glass-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cls.completionRate === 100
                          ? "bg-[var(--status-active)]"
                          : "bg-[var(--status-pending)]"
                      }`}
                      style={{ width: `${cls.completionRate}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-primary-col w-7">
                    {cls.completionRate}%
                  </span>
                </div>
              </div>

              <div className="col-span-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cls.status === "active"
                      ? "bg-[var(--status-active)]/12 text-[var(--status-active)] border border-[var(--status-active)]/20"
                      : cls.status === "completed"
                        ? "bg-purple-500/12 text-purple-500 border border-purple-500/20"
                        : "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border border-[var(--status-pending)]/20"
                  }`}
                >
                  {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                </span>
              </div>

              <div className="col-span-2 flex justify-end gap-1">
                <button
                  className="p-2 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition"
                  title="View Class"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  className="p-2 rounded-xl text-secondary-col/60 hover:text-secondary-col hover:bg-accent transition"
                  title="Reassign"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
