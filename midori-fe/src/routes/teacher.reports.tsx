import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, FileBarChart, Send, Plus, AlertTriangle,
  Search, MessageSquare, CheckCircle2, Clock, Shield,
  ChevronRight, BookOpen, Eye
} from "lucide-react";
import { Card, LevelBadge, PageHeader } from "@/components/page-ui";
import { cn } from "@/lib/utils";
import { MOCK_CLASSES } from "@/data/teacher-classes";
import {
  MOCK_REPORTS,
  type TeacherReport,
  type ReportType,
  type ReportStatus,
  type ReportPriority,
  REPORT_TYPES,
  REPORT_STATUSES,
  REPORT_PRIORITIES,
} from "@/data/teacher-reports";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function typeBadge(type: ReportType) {
  const cfg: Record<string, { cls: string }> = {
    "Content issue":   "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",
    "System issue":    "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    "Student issue":   "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    "Class issue":     "bg-sky-blue/15 text-sky-blue",
    "Request content": "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    "Other":           "bg-muted/80 text-muted-col",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold", cfg[type] ?? "bg-muted text-muted-col")}>
      {type}
    </span>
  );
}

function statusBadge(status: ReportStatus) {
  const cfg: Record<string, { cls: string; label: string }> = {
    "Open":       { cls: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",   label: "Open" },
    "In Progress":{ cls: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400", label: "In Progress" },
    "Resolved":   { cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400", label: "Resolved" },
    "Rejected":   { cls: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",   label: "Rejected" },
  };
  const c = cfg[status];
  return <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold", c.cls)}>{c.label}</span>;
}

function priorityBadge(priority: ReportPriority) {
  const cfg: Record<string, { cls: string }> = {
    "Low":   "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    "Medium":"bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    "High":  "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-bold", cfg[priority])}>
      {priority}
    </span>
  );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */

export const Route = createFileRoute("/teacher/reports")({ component: TeacherReportsPage });

function TeacherReportsPage() {
  const [reports, setReports] = useState<TeacherReport[]>(MOCK_REPORTS);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");

  // form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReportType>("Other");
  const [classId, setClassId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [priority, setPriority] = useState<ReportPriority>("Medium");
  const [desc, setDesc] = useState("");
  const [errors, setErrors] = useState<{ title?: string; type?: string; description?: string }>({});

  const reportStats = useMemo(() => ({
    total: reports.length,
    open: reports.filter((r) => r.status === "Open").length,
    inProgress: reports.filter((r) => r.status === "In Progress").length,
    resolved: reports.filter((r) => r.status === "Resolved").length,
    highPriority: reports.filter((r) => r.priority === "High").length,
  }), [reports]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "All" && r.type !== typeFilter) return false;
      if (statusFilter !== "All" && r.status !== statusFilter) return false;
      if (priorityFilter !== "All" && r.priority !== priorityFilter) return false;
      return true;
    });
  }, [reports, search, typeFilter, statusFilter, priorityFilter]);

  const handleSubmit = () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = "Report title is required.";
    if (!type) e.type = "Please select a report type.";
    if (!desc.trim()) e.description = "Please describe the issue.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const newReport: TeacherReport = {
      id: `report-${Date.now()}`,
      title: title.trim(),
      type,
      status: "Open",
      priority,
      relatedClassId: classId || undefined,
      relatedClassName: classId
        ? MOCK_CLASSES.find((c) => c.id === classId)?.name
        : undefined,
      relatedLessonTitle: lessonTitle || undefined,
      description: desc.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setReports((prev) => [newReport, ...prev]);
    setTitle("");
    setType("Other");
    setClassId("");
    setLessonTitle("");
    setPriority("Medium");
    setDesc("");
    setErrors({});
    setShowForm(false);
    alert("Report submitted. Admin will review and respond.");
  };

  return (
    <div className="space-y-5">
      {/* ── A. Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Reports"
        subtitle="Send reports to Admin and track report status."
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-col">
            Reports are reviewed and handled by Admin.
          </p>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[10px] font-semibold bg-[var(--primary)] text-white hover:opacity-90 shadow-sm transition"
          >
            <Plus className="w-3 h-3" />
            Create Report
          </button>
        </div>
      </Card>

      {/* ── B. Permission Notice ──────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-foreground">Teacher Access — Reports</h3>
          <p className="text-[11px] text-muted-col mt-0.5">
            Teachers can send reports to Admin and track their own report status.
            Admin handles reports at system level.
          </p>
        </div>
      </div>

      {/* ── D. Create Report Form ─────────────────────────────────────── */}
      {showForm && (
        <Card className="p-5 space-y-4">
          <h2 className="font-display font-bold text-sm flex items-center gap-2 text-foreground">
            <Send className="w-4 h-4 text-primary" />
            Create Report
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Title */}
            <div>
              <label className="text-[10px] text-muted-col font-semibold block mb-1">Report title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief title describing the issue"
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-col focus:outline-none focus:border-primary/50 transition"
              />
              {errors.title && <p className="text-[10px] text-[var(--jp-red)] mt-1 font-semibold">{errors.title}</p>}
            </div>
            {/* Type */}
            <div>
              <label className="text-[10px] text-muted-col font-semibold block mb-1">Report type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ReportType)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground focus:outline-none focus:border-primary/50 transition"
              >
                <option value="" disabled>Select type</option>
                {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.type && <p className="text-[10px] text-[var(--jp-red)] mt-1 font-semibold">{errors.type}</p>}
            </div>
            {/* Related class */}
            <div>
              <label className="text-[10px] text-muted-col font-semibold block mb-1">Related class (optional)</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground focus:outline-none focus:border-primary/50 transition"
              >
                <option value="">Select class</option>
                {MOCK_CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {/* Related lesson */}
            <div>
              <label className="text-[10px] text-muted-col font-semibold block mb-1">Related lesson (optional)</label>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g. Lesson 1: あいさつ"
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-col focus:outline-none focus:border-primary/50 transition"
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-[10px] text-muted-col font-semibold block mb-1">Priority</label>
            <div className="flex flex-wrap gap-2">
              {REPORT_PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition",
                    priority === p
                      ? p === "High"
                        ? "bg-red-500 text-white"
                        : p === "Medium"
                          ? "bg-amber-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-foreground"
                      : "bg-muted/40 text-muted-col hover:bg-muted/60"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] text-muted-col font-semibold block mb-1">Description *</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
              placeholder="Describe the issue in detail…"
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-col focus:outline-none focus:border-primary/50 transition resize-none"
            />
            {errors.description && <p className="text-[10px] text-[var(--jp-red)] mt-1 font-semibold">{errors.description}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-2 rounded-xl text-[10px] font-semibold bg-muted/40 text-muted-col hover:bg-muted/60 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-semibold bg-[var(--primary)] text-white hover:opacity-90 shadow-sm transition"
            >
              <Send className="w-3 h-3" />
              Submit Report
            </button>
          </div>
        </Card>
      )}

      {/* ── C. Overview Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { label: "Total Reports",  value: reportStats.total,     icon: <FileBarChart className="w-3.5 h-3.5" /> },
          { label: "Open",           value: reportStats.open,      icon: <AlertTriangle className="w-3.5 h-3.5" /> },
          { label: "In Progress",    value: reportStats.inProgress, icon: <Clock className="w-3.5 h-3.5" /> },
          { label: "Resolved",       value: reportStats.resolved,  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          { label: "High Priority",  value: reportStats.highPriority, icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        ].map((stat) => (
          <Card key={stat.label} className="p-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary grid place-items-center">{stat.icon}</div>
              <div className="font-display font-black text-sm leading-tight">{stat.value}</div>
              <div className="text-[9px] text-muted-col uppercase tracking-wider font-bold leading-tight">{stat.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── E. Search / Filter ────────────────────────────────────────── */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Search className="w-3.5 h-3.5 text-primary" />
          Search & Filter
        </div>
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-col" />
            <input
              type="text"
              placeholder="Search by report title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground placeholder:text-muted-col focus:outline-none focus:border-primary/50 transition"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-muted-col font-semibold block mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground focus:outline-none focus:border-primary/50 transition"
              >
                <option value="All">All</option>
                {REPORT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-col font-semibold block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground focus:outline-none focus:border-primary/50 transition"
              >
                <option value="All">All</option>
                {REPORT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-col font-semibold block mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#1e2330] border border-slate-200 dark:border-white/10 text-foreground focus:outline-none focus:border-primary/50 transition"
              >
                <option value="All">All</option>
                {REPORT_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* ── F. Report List ────────────────────────────────────────────── */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-sm flex items-center gap-2 text-foreground">
            <FileBarChart className="w-4 h-4 text-primary" />
            Your Reports
          </h2>
          <span className="text-[10px] text-muted-col font-semibold">{filtered.length} report(s)</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-muted-col">No reports match your filters.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition"
              >
                {/* Meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{report.title}</p>
                  <p className="text-[10px] text-muted-col mt-0.5 line-clamp-1">{report.description}</p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {typeBadge(report.type)}
                  {statusBadge(report.status)}
                  {priorityBadge(report.priority)}
                </div>

                {/* Class / Lesson */}
                <div className="flex items-center gap-2 text-[10px] text-muted-col flex-shrink-0">
                  {report.relatedClassName && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/80">
                      <BookOpen className="w-2.5 h-2.5" />
                      {report.relatedClassName}
                    </span>
                  )}
                </div>

                {/* Dates */}
                <div className="text-[10px] text-muted-col flex-shrink-0">
                  <div>Created {report.createdAt}</div>
                  <div>Updated {report.updatedAt}</div>
                </div>

                {/* Admin response */}
                {report.adminResponse && (
                  <div className="text-[10px] text-muted-col italic flex-shrink-0">
                    Admin: "{report.adminResponse}"
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-col transition" title="View detail">
                    <Eye className="w-3 h-3" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-muted/40 text-muted-col transition" title="Add comment">
                    <MessageSquare className="w-3 h-3" />
                  </button>
                  {report.adminResponse && (
                    <button className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition" title="Mark as read">
                      <CheckCircle2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* ── G. Status Flow ───────────────────────────────────────────── */}
      <Card className="p-4">
        <h2 className="font-display font-bold text-sm flex items-center gap-2 text-foreground mb-3">
          <ChevronRight className="w-4 h-4 text-primary" />
          Report Status Flow
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {REPORT_STATUSES.map((s, i) => (
            <span key={s} className="flex items-center gap-1">
              {statusBadge(s)}
              {i < REPORT_STATUSES.length - 1 && <span className="text-muted-col text-xs">→</span>}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-muted-col mt-2">
          Open → In Progress → Resolved / Rejected
        </p>
      </Card>

      {/* ── H. Rules / Info ───────────────────────────────────────────── */}
      <Card className="p-4 space-y-3">
        <h2 className="font-display font-bold text-sm flex items-center gap-2 text-foreground">
          <Shield className="w-4 h-4 text-primary" />
          Reports Rules
        </h2>
        <ul className="grid sm:grid-cols-2 gap-2">
          {[
            "Teacher sends reports.",
            "Admin handles reports.",
            "Teacher can only track their own reports.",
            "Reports can be linked to a class or lesson.",
            "Reports do not directly modify Data Bank or class data.",
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-px text-[9px] font-bold">
                {i + 1}
              </span>
              {rule}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
