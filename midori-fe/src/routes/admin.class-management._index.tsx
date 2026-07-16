import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Eye,
  Archive,
  Trash2,
  Plus,
  BookUser,
  GraduationCap,
  Users,
  ChevronRight,
  AlertTriangle,
  Loader2,
  MoreHorizontal,
  Filter,
  X,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { adminApi, type AdminTeacherResponse } from "@/lib/api/admin";
import { adminClassesApi, type AdminClassResponse } from "@/lib/api/admin";

type ClassStatus = "ACTIVE" | "ARCHIVED";

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: {
      label: "Active",
      color: "text-[var(--status-active)]",
      bg: "bg-[var(--status-active)]",
    },
    ARCHIVED: {
      label: "Archived",
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
  // Data state
  const [classes, setClasses] = useState<AdminClassResponse[]>([]);
  const [teachers, setTeachers] = useState<AdminTeacherResponse[]>([]);

  // Loading states
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(0);

  // Archive Modal state
  const [archiveClass, setArchiveClass] = useState<AdminClassResponse | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Restore Modal state
  const [restoreClass, setRestoreClass] = useState<AdminClassResponse | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Create Class Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLevel, setCreateLevel] = useState("N5");
  const [createTeacherId, setCreateTeacherId] = useState("");
  const [createCapacity, setCreateCapacity] = useState(25);
  const [createDescription, setCreateDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Success toast
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Load classes from real API
  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    setError(null);
    try {
      const data = await adminClassesApi.getAdminClasses();
      setClasses(data);
    } catch (err: any) {
      setError(err.message || "Failed to load classes");
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  // Load teachers from real API
  const fetchTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    try {
      const data = await adminApi.getActiveTeachers();
      setTeachers(data);
    } catch {
      // Silently fail for teachers - create modal won't work but list is fine
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, [fetchClasses, fetchTeachers]);

  // Filtered classes (search + level + status) — done client-side since BE returns all
  const filteredClasses = classes.filter((cls) => {
    const matchesSearch =
      !search ||
      cls.name.toLowerCase().includes(search.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = !levelFilter || cls.level === levelFilter;
    const matchesStatus = !statusFilter || cls.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredClasses.length / PAGE_SIZE);
  const paginatedClasses = filteredClasses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const activeCount = classes.filter((c) => c.status === "ACTIVE").length;
  const archivedCount = classes.filter((c) => c.status === "ARCHIVED").length;
  const totalStudents = classes.reduce((sum, c) => sum + (c.students || 0), 0);

  const clearFilters = () => {
    setSearch("");
    setLevelFilter("");
    setStatusFilter("");
    setPage(0);
  };

  const hasFilters = search || levelFilter || statusFilter;

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Archive handler
  const handleArchiveClick = (cls: AdminClassResponse) => setArchiveClass(cls);

  const handleArchiveConfirm = async () => {
    if (!archiveClass) return;
    setArchiveLoading(true);
    try {
      await adminClassesApi.archiveAdminClass(archiveClass.id);
      // Update local state
      setClasses((prev) =>
        prev.map((c) => (c.id === archiveClass.id ? { ...c, status: "ARCHIVED" as const } : c)),
      );
      setArchiveClass(null);
      showToast("Class archived successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to archive class");
    } finally {
      setArchiveLoading(false);
    }
  };

  // Restore handler
  const handleRestoreClick = (cls: AdminClassResponse) => setRestoreClass(cls);

  const handleRestoreConfirm = async () => {
    if (!restoreClass) return;
    setRestoreLoading(true);
    try {
      await adminClassesApi.restoreAdminClass(restoreClass.id);
      // Update local state
      setClasses((prev) =>
        prev.map((c) => (c.id === restoreClass.id ? { ...c, status: "ACTIVE" as const } : c)),
      );
      setRestoreClass(null);
      showToast("Class restored successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to restore class");
    } finally {
      setRestoreLoading(false);
    }
  };

  // Create handler
  const handleCreateClick = () => {
    setCreateName("");
    setCreateLevel("N5");
    setCreateTeacherId("");
    setCreateCapacity(25);
    setCreateDescription("");
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async () => {
    if (!createName.trim()) {
      setCreateError("Class name is required");
      return;
    }
    if (!createTeacherId) {
      setCreateError("Please select a teacher");
      return;
    }
    if (!createCapacity || createCapacity <= 0) {
      setCreateError("Capacity must be greater than 0");
      return;
    }

    setCreateLoading(true);
    try {
      const created = await adminClassesApi.createAdminClass({
        name: createName.trim(),
        level: createLevel,
        maxStudents: createCapacity,
        teacherId: createTeacherId,
        description: createDescription.trim(),
      });
      // Prepend new class to list (backend returns ClassResponse, which maps from ClassResponse)
      setClasses((prev) => [
        {
          id: (created as any).id,
          name: (created as any).name,
          teacher: (created as any).teacher || "",
          teacherId: createTeacherId,
          level: (created as any).level || createLevel,
          students: 0,
          maxStudents: createCapacity,
          status: (created as any).status || "ACTIVE",
          createdAt: (created as any).createdAt || new Date().toISOString(),
          description: createDescription.trim(),
        },
        ...prev,
      ]);
      setShowCreateModal(false);
      showToast("Class created successfully.");
    } catch (err: any) {
      setCreateError(err.message || "Failed to create class");
    } finally {
      setCreateLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, levelFilter, statusFilter]);

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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--status-active)]/10 text-[var(--status-active)] text-xs font-bold border border-[var(--status-active)]/20">
            <span className="w-2 h-2 rounded-full bg-[var(--status-active)] shadow-sm shadow-[var(--status-active)]/50" />
            {activeCount} active
          </div>
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
          >
            <Plus className="w-4 h-4" /> Create Class
          </button>
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
            <p className="font-display font-black text-xl text-primary-col">{classes.length}</p>
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
            <p className="font-display font-black text-xl text-primary-col">{activeCount}</p>
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
            <p className="font-display font-black text-xl text-primary-col">{totalStudents}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-suspended)]/12 flex items-center justify-center">
            <Archive className="w-5 h-5 text-[var(--status-suspended)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Archived
            </p>
            <p className="font-display font-black text-xl text-primary-col">{archivedCount}</p>
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
          <option value="N5">N5</option>
          <option value="N4">N4</option>
          <option value="N3">N3</option>
          <option value="N2">N2</option>
          <option value="N1">N1</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl search-input text-sm min-w-[140px]"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
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

      {/* Classes Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto min-w-[900px]">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
            <div className="col-span-4">Class</div>
            <div className="col-span-2">Teacher</div>
            <div className="col-span-1">Level</div>
            <div className="col-span-2">Students</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Created</div>
          </div>

          {loadingClasses && (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-col">Loading classes...</p>
            </div>
          )}

          {!loadingClasses && error && (
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

          {!loadingClasses && !error && filteredClasses.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3">
              <BookUser className="w-10 h-10 text-muted-col/40" />
              <p className="text-sm font-bold text-secondary-col">No classes found</p>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!loadingClasses && !error && filteredClasses.length > 0 && paginatedClasses.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3">
              <p className="text-sm font-bold text-secondary-col">
                No classes on this page
              </p>
            </div>
          )}

          {!loadingClasses &&
            !error &&
            paginatedClasses.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
                className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center"
              >
                {/* Class name */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                    <BookUser className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-primary-col truncate">
                      {cls.name}
                    </div>
                    {cls.description && (
                      <div className="text-[10px] text-muted-col truncate">{cls.description}</div>
                    )}
                  </div>
                </div>

                {/* Teacher */}
                <div className="col-span-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                    {(cls.teacher || "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <span className="text-sm text-secondary-col truncate">{cls.teacher || "N/A"}</span>
                </div>

                {/* Level */}
                <div className="col-span-1">
                  <JLPTBadge level={cls.level || "N5"} />
                </div>

                {/* Students */}
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-sm font-medium">
                    <span className="text-secondary-col">{cls.students ?? 0}</span>
                    <span className="text-muted-col">/{cls.maxStudents}</span>
                  </span>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <StatusBadge status={cls.status} />
                </div>

                {/* Created + Actions */}
                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-xs text-muted-col">
                    {cls.createdAt
                      ? new Date(cls.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Link
                      to="/admin/class/$classId"
                      params={{ classId: cls.id }}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition"
                      title="View Class"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {cls.status === "ACTIVE" ? (
                      <button
                        onClick={() => handleArchiveClick(cls)}
                        className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 transition"
                        title="Archive Class"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    ) : cls.status === "ARCHIVED" ? (
                      <button
                        onClick={() => handleRestoreClick(cls)}
                        className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition"
                        title="Restore Class"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ))}

          {/* Pagination */}
          {!loadingClasses && !error && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-xs text-muted-col">
                Page {page + 1} of {totalPages} ({filteredClasses.length} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-secondary-col hover:bg-accent transition disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-secondary-col hover:bg-accent transition disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
          <div className="bg-[var(--status-active)] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      <AlertDialog open={!!archiveClass} onOpenChange={() => setArchiveClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive this class?
              <br />
              <br />
              Archived classes will no longer accept new students but historical data will be
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setArchiveClass(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={archiveLoading}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              {archiveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Modal */}
      <AlertDialog open={!!restoreClass} onOpenChange={() => setRestoreClass(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this class?
              <br />
              <br />
              The class will be returned to active status and can accept new students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoreClass(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreConfirm}
              disabled={restoreLoading}
              className="bg-green-500 hover:bg-green-600"
            >
              {restoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Class Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>Add a new class to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Class Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                Class Name <span className="text-[var(--status-rejected)]">*</span>
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g., N5 Morning"
                className="w-full px-4 py-2.5 rounded-xl glass-surface border border-glass-border text-sm text-primary-col placeholder:text-muted-col focus:outline-none focus:border-primary/40 transition"
              />
            </div>

            {/* JLPT Level */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                JLPT Level <span className="text-[var(--status-rejected)]">*</span>
              </label>
              <select
                value={createLevel}
                onChange={(e) => setCreateLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl glass-surface border border-glass-border text-sm text-primary-col focus:outline-none focus:border-primary/40 transition appearance-none"
              >
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
            </div>

            {/* Teacher */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                Teacher <span className="text-[var(--status-rejected)]">*</span>
              </label>
              {loadingTeachers ? (
                <div className="w-full px-4 py-2.5 rounded-xl glass-surface border border-glass-border text-sm text-muted-col">
                  Loading teachers...
                </div>
              ) : (
                <select
                  value={createTeacherId}
                  onChange={(e) => setCreateTeacherId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-surface border border-glass-border text-sm text-primary-col focus:outline-none focus:border-primary/40 transition appearance-none"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.displayName || teacher.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                Capacity <span className="text-[var(--status-rejected)]">*</span>
              </label>
              <input
                type="number"
                value={createCapacity}
                onChange={(e) => setCreateCapacity(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full px-4 py-2.5 rounded-xl glass-surface border border-glass-border text-sm text-primary-col focus:outline-none focus:border-primary/40 transition"
              />
              <p className="text-[10px] text-muted-col">Must be greater than 0</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                Description <span className="text-muted-col">(Optional)</span>
              </label>
              <textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="e.g., JLPT N5 preparation course for beginners."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl glass-surface border border-glass-border text-sm text-primary-col placeholder:text-muted-col focus:outline-none focus:border-primary/40 transition resize-none"
              />
            </div>

            {/* Error */}
            {createError && (
              <div className="px-3 py-2 rounded-lg bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-xs font-medium">
                {createError}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={createLoading}
                className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                disabled={createLoading}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Class
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
