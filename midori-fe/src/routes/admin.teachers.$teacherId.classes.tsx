import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  BookUser,
  AlertTriangle,
  Loader2,
  Eye,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { adminApi, type AdminTeacherResponse, type AdminClassResponse } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

type TeacherClass = {
  id: string;
  name: string;
  level: string;
  students: number;
  maxStudents: number;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
};

type StatusFilter = "" | "ACTIVE" | "ARCHIVED";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function displayNameOf(t: AdminTeacherResponse): string {
  const dn = t.displayName?.trim();
  if (dn) return dn;
  const emailName = t.email.split("@")[0];
  return emailName
    .split(/[._]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function classToRow(c: AdminClassResponse): TeacherClass {
  return {
    id: c.id,
    name: c.name,
    level: c.level,
    students: c.students,
    maxStudents: c.maxStudents,
    status: c.status,
    createdAt: c.createdAt,
  };
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
  const [teacher, setTeacher] = useState<AdminTeacherResponse | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");

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
      const teacherClasses = all
        .filter((c) => c.teacherId === teacherId)
        .map(classToRow);
      setClasses(teacherClasses);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to load teacher classes";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredClasses = useMemo(
    () => (statusFilter === "" ? classes : classes.filter((c) => c.status === statusFilter)),
    [classes, statusFilter],
  );

  const totalStudents = useMemo(
    () => classes.reduce((sum, c) => sum + (c.students ?? 0), 0),
    [classes],
  );
  const activeClasses = useMemo(
    () => classes.filter((c) => c.status === "ACTIVE").length,
    [classes],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-col">Loading teacher classes…</p>
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
            <BookUser className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Capacity
            </p>
            <p className="font-display font-black text-lg text-primary-col">
              {classes.reduce((sum, c) => sum + (c.maxStudents ?? 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Teacher Info & Filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 p-3 rounded-xl glass-surface">
          {teacher.avatarUrl ? (
            <img
              src={teacher.avatarUrl}
              alt={displayName}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-xl bg-linear-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}
            >
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-primary-col">{displayName}</p>
            <p className="text-[10px] text-muted-col">{teacher.email}</p>
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2.5 rounded-xl search-input text-sm"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Classes Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold min-w-[720px]">
            <div className="col-span-4">Class Name</div>
            <div className="col-span-2">Level</div>
            <div className="col-span-2 text-center">Students</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {filteredClasses.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3">
              <BookOpen className="w-10 h-10 text-muted-col/40" />
              <p className="text-sm font-bold text-secondary-col">
                {classes.length === 0
                  ? "This teacher has no classes yet."
                  : "No classes match the selected filter."}
              </p>
            </div>
          )}

          {filteredClasses.map((cls, i) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center min-w-[720px]"
            >
              <div className="col-span-4">
                <p className="text-sm font-semibold text-primary-col truncate">{cls.name}</p>
              </div>

              <div className="col-span-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/12 text-purple-500 border border-purple-500/20">
                  {cls.level}
                </span>
              </div>

              <div className="col-span-2 text-center">
                <span className="text-sm font-semibold text-primary-col">
                  {cls.students ?? 0}/{cls.maxStudents ?? 0}
                </span>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-col">
                  <Calendar className="w-3 h-3" />
                  {formatDate(cls.createdAt)}
                </div>
              </div>

              <div className="col-span-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    cls.status === "ACTIVE"
                      ? "bg-[var(--status-active)]/12 text-[var(--status-active)] border-[var(--status-active)]/20"
                      : "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border-[var(--status-pending)]/20"
                  }`}
                >
                  {cls.status === "ACTIVE" ? "Active" : "Archived"}
                </span>
              </div>

              <div className="col-span-1 flex justify-end">
                <Link
                  to="/admin/class/$classId"
                  params={{ classId: cls.id }}
                  className="p-2 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition"
                  title="View Class"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
