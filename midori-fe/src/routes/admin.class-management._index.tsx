import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Eye,
  Delete,
  BookUser,
  GraduationCap,
  Users,
  AlertTriangle,
  X,
  RotateCcw,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { adminApi, type AdminClassResponse } from "@/lib/api/admin";
import { classesApi } from "@/lib/api/classes";
import { ApiError, isApiError } from "@/lib/api/client";

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: {
      label: "Active",
      color: "text-[var(--status-active)]",
      bg: "bg-[var(--status-active)]",
    },
    DeleteD: {
      label: "Deleted",
      color: "text-[var(--status-suspended)]",
      bg: "bg-[var(--status-suspended)]",
    },
  };
  const cfg = configs[status] || configs["ACTIVE"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
      {cfg.label}
    </span>
  );
}

function JLPTBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    N5: "bg-[oklch(0.62_0.18_270)]/12 text-[oklch(0.62_0.18_270)] border-[oklch(0.62_0.18_270)]/20",
    N4: "bg-[oklch(0.72_0.15_230)]/12 text-[oklch(0.72_0.15_230)] border-[oklch(0.72_0.15_230)]/20",
    N3: "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border-[var(--status-pending)]/20",
    N2: "bg-[oklch(0.6_0.22_25)]/12 text-[oklch(0.6_0.22_25)] border-[oklch(0.6_0.22_25)]/20",
    N1: "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] border-[var(--status-rejected)]/20",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[level] || colors["N5"]}`}
    >
      {level}
    </span>
  );
}

export const Route = createFileRoute("/admin/class-management/_index")({
  component: ClassManagementPage,
});

function ClassManagementPage() {
  const queryClient = useQueryClient();

  // Action-level success/error (Delete/restore) — shown as inline banner above
  // the table so it doesn't hide the data the user is acting on.
  const [actionMessage, setActionMessage] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");

  // Delete Modal state
  const [deleteClass, setDeleteClass] = useState<AdminClassResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    data: classes = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ["admin", "classes"],
    queryFn: adminApi.getAdminClasses,
    staleTime: 5 * 60 * 1000,
  });

  const error = queryError ? (queryError as any).message || "Failed to load classes" : null;

  const fetchClasses = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "classes"] });
  }, [queryClient]);

  // Levels come from the data so the dropdown never shows options that don't exist.
  const availableLevels = useMemo(() => {
    const set = new Set<string>();
    for (const c of classes) {
      if (c.level) set.add(c.level);
    }
    return Array.from(set).sort();
  }, [classes]);

  // Same approach for statuses.
  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    for (const c of classes) {
      if (c.status) set.add(c.status);
    }
    return Array.from(set).sort();
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((cls) => {
      const matchesSearch =
        !q ||
        cls.name.toLowerCase().includes(q) ||
        (cls.teacher ?? "").toLowerCase().includes(q);
      const matchesLevel = !levelFilter || cls.level === levelFilter;
      const matchesStatus = !statusFilter || cls.status === statusFilter;
      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [classes, search, levelFilter, statusFilter]);

  // All statistics are derived from the data returned by the backend.
  const stats = useMemo(() => {
    const active = classes.filter((c) => c.status === "ACTIVE").length;
    const archived = classes.filter((c) => c.status === "ARCHIVED").length;
    const totalStudents = classes.reduce(
      (sum, c) => sum + (typeof c.students === "number" ? c.students : 0),
      0,
    );
    return {
      total: classes.length,
      active,
      archived,
      totalStudents,
    };
  }, [classes]);

  const clearFilters = () => {
    setSearch("");
    setLevelFilter("");
    setStatusFilter("ACTIVE");
  };

  const hasFilters = !!search || !!levelFilter || statusFilter !== "ACTIVE";

  // Handlers
  const handleDeleteClick = (cls: AdminClassResponse) => {
    setDeleteClass(cls);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteClass) return;

    // Optimistic UI update so the class disappears immediately
    queryClient.setQueryData(["admin", "classes"], (prev: AdminClassResponse[] | undefined) => {
      if (!prev) return [];
      return prev.filter((c) => c.id !== deleteClass.id);
    });

    setDeleteLoading(true);
    try {
      await classesApi.deleteClass(deleteClass.id);
      setDeleteClass(null);
      // Remove success notification as requested
      // setActionMessage({ kind: "success", text: `"${deleteClass.name}" deleted successfully.` });
      // Refresh from backend so all derived data stays in sync.
      await fetchClasses();
    } catch (err) {
      // Roll back optimistic change and surface the error.
      setClasses((prev) =>
        prev.map((c) => (c.id === archiveClass.id ? { ...c, status: "ACTIVE" } : c)),
      );
      const message =
        isApiError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to archive class.";
      setActionMessage({ kind: "error", text: `Archive failed: ${message}` });
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleRestoreClick = (cls: AdminClassResponse) => {
    setRestoreClass(cls);
  };

  const handleRestoreConfirm = async () => {
    if (!restoreClass) return;

    // Optimistic UI update so the status flips immediately on the table.
    setClasses((prev) =>
      prev.map((c) => (c.id === restoreClass.id ? { ...c, status: "ACTIVE" } : c)),
    );

    setRestoreLoading(true);
    try {
      await classesApi.restoreClass(restoreClass.id);
      setRestoreClass(null);
      setActionMessage({ kind: "success", text: `"${restoreClass.name}" restored successfully.` });
      await fetchClasses();
      const message =
        isApiError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete class.";
      setActionMessage({ kind: "error", text: `Delete failed: ${message}` });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Class Management</h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Manage classes, teachers, and student enrollment
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--status-active)]/10 text-[var(--status-active)] text-xs font-bold border border-[var(--status-active)]/20">
          <span className="w-2 h-2 rounded-full bg-[var(--status-active)] shadow-sm shadow-[var(--status-active)]/50" />
          {stats.active} active
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
            <BookUser className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Total Classes
            </p>
            <p className="font-display font-black text-xl text-primary-col">{stats.total}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-[var(--status-active)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Active Classes
            </p>
            <p className="font-display font-black text-xl text-primary-col">{stats.active}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.72_0.15_230)]/12 flex items-center justify-center">
            <Users className="w-5 h-5 text-[oklch(0.72_0.15_230)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Total Students
            </p>
            <p className="font-display font-black text-xl text-primary-col">
              {stats.totalStudents}
            </p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-suspended)]/12 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-[var(--status-suspended)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Archived
            </p>
            <p className="font-display font-black text-xl text-primary-col">{stats.archived}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-col" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search classes or teachers..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl search-input text-sm"
          />
        </div>

        {/* Level Filter */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl search-input text-sm min-w-[120px]"
        >
          <option value="">All Levels</option>
          {availableLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl search-input text-sm min-w-[140px]"
        >
          <option value="">All Status</option>
          {availableStatuses.map((status) => (
            <option key={status} value={status}>
              {status === "ACTIVE" ? "Active" : status === "ARCHIVED" ? "Archived" : status}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-secondary-col text-sm hover:bg-accent transition"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Action result banner — does NOT replace the table so the user keeps
          seeing data even if an action fails. */}
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
              actionMessage.kind === "success"
                ? "bg-[var(--status-active)]/10 text-[var(--status-active)] border-[var(--status-active)]/25"
                : "bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {actionMessage.kind === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span className="truncate">{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 transition shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Classes Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto min-w-[960px]">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
            <div className="col-span-3">Class</div>
            <div className="col-span-2">Teacher</div>
            <div className="col-span-1">Level</div>
            <div className="col-span-2">Students</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {loading && (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-col">Loading classes...</p>
            </div>
          )}

          {!loading && error && (
            <div className="py-16 flex flex-col items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-[var(--status-rejected)]/50" />
              <p className="text-sm font-bold text-[var(--status-rejected)]">{error}</p>
              <button
                onClick={fetchClasses}
                className="px-3 py-1.5 rounded-lg bg-primary/12 text-primary text-xs font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredClasses.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3">
              <BookUser className="w-10 h-10 text-muted-col/40" />
              <p className="text-sm font-bold text-secondary-col">No classes found</p>
              {hasFilters ? (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                  Clear filters
                </button>
              ) : (
                <p className="text-xs text-muted-col">No classes available.</p>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            filteredClasses.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
                className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center"
              >
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                    <BookUser className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-primary-col truncate">
                      {cls.name}
                    </div>
                  </div>
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                    {(cls.teacher || "?")
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <span className="text-sm text-secondary-col truncate">
                    {cls.teacher || "Unassigned"}
                  </span>
                </div>

                <div className="col-span-1">
                  <JLPTBadge level={cls.level} />
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-sm font-medium">
                    <span className="text-secondary-col">{cls.students}</span>
                    <span className="text-muted-col">/{cls.maxStudents}</span>
                  </span>
                </div>

                <div className="col-span-1">
                  <StatusBadge status={cls.status} />
                </div>

                <div className="col-span-2">
                  <span className="text-xs text-muted-col">
                    {cls.createdAt
                      ? new Date(cls.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>

                <div className="col-span-1 flex items-center justify-end gap-1">
                  <Link
                    to="/admin/class/$classId"
                    params={{ classId: cls.id }}
                    className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition"
                    title="View Class"
                    aria-label="View class"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(cls)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
                    title="Delete Class"
                    aria-label="Delete class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteClass} onOpenChange={() => setDeleteClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-bold text-primary-col">{deleteClass?.name}</span>?
              <br />
              <br />
              Deleted classes will no longer accept new students but historical data will be
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteClass(null)} disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              {deleteLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
