import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, ShieldCheck, TrendingUp, Clock, Eye } from "lucide-react";
import { adminApi } from "@/lib/api/admin";

export const Route = createFileRoute("/admin/students")({ component: StudentsPage });

function StatusBadge({ status }: { status: string }) {
  const getConfig = () => {
    switch (status.toLowerCase()) {
      case "active": return { label: "Active", color: "text-[var(--status-active)]", bg: "bg-[var(--status-active)]" };
      case "pending": return { label: "Pending", color: "text-[var(--status-pending)]", bg: "bg-[var(--status-pending)]" };
      case "suspended": return { label: "Suspended", color: "text-[var(--status-suspended)]", bg: "bg-[var(--status-suspended)]" };
      case "banned": return { label: "Banned", color: "text-[var(--status-rejected)]", bg: "bg-[var(--status-rejected)]" };
      default: return { label: status, color: "text-muted-col", bg: "bg-muted" };
    }
  };
  const cfg = getConfig();
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
      {cfg.label}
    </span>
  );
}

function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAllUsers({ role: "STUDENT", page, size: 20, keyword: search || undefined });
      setStudents(data.content);
    } catch (err: any) {
      setError(err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const activeCount = students.filter((s) => s.status === "ACTIVE").length;
  const pendingCount = students.filter((s) => s.status === "PENDING").length;
  const suspendedCount = students.filter((s) => s.status === "SUSPENDED" || s.status === "BANNED").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Student Management</h1>
          <p className="text-sm text-secondary-col mt-0.5">View and manage student accounts</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-secondary-col text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[var(--status-active)] shadow-sm shadow-[var(--status-active)]/50" />
          {activeCount} active
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="card-base p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Total Students</span>
          </div>
          <div className="font-display font-black text-xl text-primary-col">{students.length}</div>
        </div>
        <div className="card-base p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--status-active)]" />
            <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Active</span>
          </div>
          <div className="font-display font-black text-xl text-primary-col">{activeCount}</div>
        </div>
        <div className="card-base p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--status-pending)]" />
            <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Pending</span>
          </div>
          <div className="font-display font-black text-xl text-primary-col">{pendingCount}</div>
        </div>
        <div className="card-base p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--status-rejected)]" />
            <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Suspended</span>
          </div>
          <div className="font-display font-black text-xl text-primary-col">{suspendedCount}</div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-col" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl search-input text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto min-w-[700px]">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
            <div className="col-span-4">Student</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Joined</div>
            <div className="col-span-1">Actions</div>
          </div>

          {loading && (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-col">Loading students...</p>
            </div>
          )}

          {!loading && error && (
            <div className="py-16 flex flex-col items-center gap-3">
              <p className="text-sm font-bold text-[var(--status-rejected)]">{error}</p>
              <button onClick={fetchStudents} className="px-3 py-1.5 rounded-lg bg-primary/12 text-primary text-xs font-bold">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && students.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3">
              <Users className="w-10 h-10 text-muted-col/40" />
              <p className="text-sm font-bold text-secondary-col">No students found</p>
            </div>
          )}

          {!loading && !error && students.map((student, i) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center"
            >
              <div className="col-span-4 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--status-student)] flex items-center justify-center text-white font-bold text-sm">
                  {(student.displayName ?? student.email)[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-primary-col truncate">
                    {student.displayName ?? student.email.split("@")[0]}
                  </div>
                </div>
              </div>
              <div className="col-span-3 text-sm text-secondary-col truncate">{student.email}</div>
              <div className="col-span-2">
                <StatusBadge status={student.status?.toLowerCase() || "active"} />
              </div>
              <div className="col-span-2 text-xs text-muted-col">
                {new Date(student.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </div>
              <div className="col-span-1 flex justify-end">
                <button className="p-2 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
