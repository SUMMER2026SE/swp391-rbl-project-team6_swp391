import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  Eye,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { adminApi, type AdminTeacherResponse, type AdminClassResponse } from "@/lib/api/admin";
import { ApiError, isApiError } from "@/lib/api/client";

function displayNameOf(t: AdminTeacherResponse): string {
  const dn = t.displayName?.trim();
  if (dn) return dn;
  const emailName = t.email.split("@")[0];
  return emailName
    .split(/[._]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
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

export const Route = createFileRoute("/admin/teachers/$teacherId/analytics")({
  component: TeacherAnalyticsPage,
});

function TeacherAnalyticsPage() {
  const { teacherId } = Route.useParams();
  const [teacher, setTeacher] = useState<AdminTeacherResponse | null>(null);
  const [classes, setClasses] = useState<AdminClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await adminApi.getTeacherById(teacherId);
      if (!found) {
        setTeacher(null);
        setError("Teacher not found.");
        return;
      }
      setTeacher(found);
      const all = await adminApi.getAdminClasses();
      setClasses(all.filter((c) => c.teacherId === teacherId));
    } catch (err) {
      const msg =
        isApiError(err) ? err.message : "Failed to load teacher analytics.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Derived analytics from real class data ──
  const analytics = useMemo(() => {
    const teacherClasses = classes;
    const totalClasses = teacherClasses.length;
    const activeClasses = teacherClasses.filter((c) => c.status === "ACTIVE").length;
    const totalStudents = teacherClasses.reduce((sum, c) => sum + (c.students ?? 0), 0);
    const totalCapacity = teacherClasses.reduce((sum, c) => sum + (c.maxStudents ?? 0), 0);
    const utilization =
      totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;
    const studentsByLevel = teacherClasses.reduce<Record<string, { name: string; students: number }>>(
      (acc, c) => {
        const lvl = c.level || "—";
        if (!acc[lvl]) acc[lvl] = { name: lvl, students: 0 };
        acc[lvl].students += c.students ?? 0;
        return acc;
      },
      {},
    );
    const studentsByLevelData = Object.values(studentsByLevel).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return {
      totalClasses,
      activeClasses,
      totalStudents,
      totalCapacity,
      utilization,
      studentsByLevelData,
    };
  }, [classes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-col">Loading teacher analytics…</p>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-[var(--status-rejected)]/50" />
        <p className="text-primary-col font-bold">{error || "Teacher not found"}</p>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const displayName = displayNameOf(teacher);
  const initials = displayName
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
                <p className="text-sm text-secondary-col">{displayName}</p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Classes
            </p>
            <p className="font-display font-black text-lg text-primary-col">
              {analytics.totalClasses}
            </p>
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
            <p className="font-display font-black text-lg text-primary-col">
              {analytics.totalStudents}
            </p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-[var(--status-active)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Active Classes
            </p>
            <p className="font-display font-black text-lg text-primary-col">
              {analytics.activeClasses}
            </p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/12 flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Capacity Used
            </p>
            <p className="font-display font-black text-lg text-primary-col">
              {analytics.utilization}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart: Students by JLPT Level */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-base p-5"
      >
        <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Students by JLPT Level
        </h2>
        {analytics.studentsByLevelData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-col">
            <BookOpen className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm font-semibold">No class data available</p>
            <p className="text-xs mt-1">This teacher has no classes yet.</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.studentsByLevelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-col)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-col)" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="students"
                  fill="var(--status-teacher)"
                  radius={[4, 4, 0, 0]}
                  name="Students"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>
    </div>
  );
}
