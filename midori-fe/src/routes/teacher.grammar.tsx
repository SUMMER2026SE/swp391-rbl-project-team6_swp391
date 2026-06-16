import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  GraduationCap,
  Mic,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Users,
  TrendingUp,
  Volume2,
  Loader2,
  X,
  Send,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  teacherGrammarApi,
  type GrammarResponse,
  type GrammarCreateRequest,
  type GrammarUpdateRequest,
  type GrammarStatus,
  type GrammarStatsResponse,
} from "@/lib/api/teacherGrammar";
import { ApiError } from "@/lib/api/client";
import { RejectReasonBox } from "@/components/reject-reason-box";

export const Route = createFileRoute("/teacher/grammar")({ component: GrammarPage });

// ─── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_FILTERS = ["All", "N5", "N4", "N3", "N2", "N1"];

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const PAGE_SIZE = 8;

// ─── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = "list" | "preview" | "edit";
type EditMode = "create" | "edit";

// ─── Config ───────────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<string, string> = {
  N5: "bg-blue-50 text-blue-500 dark:bg-blue-950/30",
  N4: "bg-green-50 text-green-500 dark:bg-green-950/30",
  N3: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
  N2: "bg-orange-50 text-orange-500 dark:bg-orange-950/30",
  N1: "bg-red-50 text-red-500 dark:bg-red-950/30",
};

const STATUS_COLORS: Record<GrammarStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  PENDING: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30",
  APPROVED: "bg-green-50 text-green-600 dark:bg-green-950/30",
  REJECTED: "bg-red-50 text-red-500 dark:bg-red-950/30",
};

const STATUS_LABELS: Record<GrammarStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function speakJapanese(text: string) {
  if (!text?.trim() || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toFormGrammar(grammar: GrammarResponse): {
  title: string;
  level: string;
  meaning: string;
  formation: string;
  usage: string;
  examples: { japanese: string; english: string }[];
} {
  return {
    title: grammar.title,
    level: grammar.level,
    meaning: grammar.meaning,
    formation: grammar.structure,
    usage: grammar.usage,
    examples:
      grammar.examples?.length > 0
        ? grammar.examples.map((ex, i) => ({
            japanese: ex,
            english: grammar.exampleMeanings?.[i] ?? "",
          }))
        : [
            { japanese: "", english: "" },
            { japanese: "", english: "" },
            { japanese: "", english: "" },
          ],
  };
}

function toCreatePayload(form: ReturnType<typeof toFormGrammar>): GrammarCreateRequest {
  return {
    title: form.title.trim(),
    level: form.level,
    meaning: form.meaning.trim(),
    structure: form.formation.trim(),
    usage: form.usage.trim(),
    examples: form.examples.map((e) => e.japanese.trim()).filter(Boolean),
    exampleMeanings: form.examples.map((e) => e.english.trim()).filter(Boolean),
    pattern: form.title.trim(),
  };
}

function toUpdatePayload(form: ReturnType<typeof toFormGrammar>): GrammarUpdateRequest {
  const payload: GrammarUpdateRequest = {};
  if (form.title.trim()) payload.title = form.title.trim();
  payload.level = form.level;
  if (form.meaning.trim()) payload.meaning = form.meaning.trim();
  if (form.formation.trim()) payload.structure = form.formation.trim();
  if (form.usage.trim()) payload.usage = form.usage.trim();
  const examples = form.examples.map((e) => e.japanese.trim()).filter(Boolean);
  if (examples.length > 0) payload.examples = examples;
  const exampleMeanings = form.examples.map((e) => e.english.trim()).filter(Boolean);
  if (exampleMeanings.length > 0) payload.exampleMeanings = exampleMeanings;
  if (form.title.trim()) payload.pattern = form.title.trim();
  return payload;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { message: string; type: "success" | "error" };

function ToastBar({ toast }: { toast: Toast | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border shadow-xl glass-modal ${
            toast.type === "success"
              ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25"
              : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
          }`}
          initial={{ opacity: 0, x: 40, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 40, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({
  grammar,
  onConfirm,
  onClose,
}: {
  grammar: GrammarResponse;
  onConfirm: (g: GrammarResponse) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(grammar);
    } finally {
      setLoading(false);
    }
  };
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-sm glass-modal rounded-2xl shadow-2xl p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[var(--status-rejected)]/15 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-[var(--status-rejected)]" />
          </div>
          <h3 className="font-display font-bold text-primary-col text-base">Delete Grammar</h3>
        </div>
        <p className="text-sm text-secondary-col mb-1">Are you sure you want to delete</p>
        <p className="text-sm font-semibold text-primary-col mb-4">"{grammar.title}"?</p>
        <p className="text-xs text-muted-col mb-5">
          This action cannot be undone. The grammar lesson and all its content will be permanently
          removed.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/25 hover:bg-[var(--status-rejected)]/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" /> Delete
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({
  current,
  total,
  onPage,
}: {
  current: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  const pageNums = Array.from({ length: pages }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-muted-foreground">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {Math.min((current - 1) * PAGE_SIZE + 1, total)}
        </span>
        {" – "}
        <span className="font-semibold text-foreground">
          {Math.min(current * PAGE_SIZE, total)}
        </span>
        {" of "}
        <span className="font-semibold text-foreground">{total}</span>
        {" grammars"}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageNums.map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-9 h-9 rounded-xl text-sm font-semibold transition ${
              p === current
                ? "bg-gradient-hero text-white shadow"
                : "border border-slate-200 dark:border-slate-700 text-muted-foreground hover:bg-muted"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPage(current + 1)}
          disabled={current === pages}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function GrammarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editMode, setEditMode] = useState<EditMode>("create");

  // List state
  const [grammars, setGrammars] = useState<GrammarResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Detail/edit state
  const [selectedGrammar, setSelectedGrammar] = useState<GrammarResponse | null>(null);
  const [formData, setFormData] = useState<ReturnType<typeof toFormGrammar>>({
    title: "",
    level: "N5",
    meaning: "",
    formation: "",
    usage: "",
    examples: [
      { japanese: "", english: "" },
      { japanese: "", english: "" },
      { japanese: "", english: "" },
    ],
  });

  // Action state
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GrammarResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  // Stats state (for preview view)
  const [grammarStats, setGrammarStats] = useState<GrammarStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch grammars
  const fetchGrammars = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const params: { level?: string; search?: string; status?: string } = {};
        if (levelFilter !== "All") params.level = levelFilter;
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (statusFilter !== "ALL") params.status = statusFilter;
        const data = await teacherGrammarApi.getGrammarList(
          Object.keys(params).length > 0 ? params : undefined,
        );
        setGrammars(data);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Failed to load grammar lessons.";
        setError(msg);
        setGrammars([]);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [levelFilter, debouncedSearch, statusFilter],
  );

  useEffect(() => {
    fetchGrammars();
  }, [fetchGrammars]);

  // Toast helper
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch stats for preview
  const fetchGrammarStats = useCallback(async (grammarId: string) => {
    setStatsLoading(true);
    setStatsError(false);
    try {
      const data = await teacherGrammarApi.getGrammarStats(grammarId);
      setGrammarStats(data);
    } catch {
      setStatsError(true);
      setGrammarStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Paginate (no client-side status filter — done server-side via API)
  const totalPages = Math.ceil(grammars.length / PAGE_SIZE);
  const paginated = grammars.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Open preview
  const openPreview = (grammar: GrammarResponse) => {
    setSelectedGrammar(grammar);
    setGrammarStats(null);
    setStatsError(false);
    setViewMode("preview");
    fetchGrammarStats(grammar.id);
  };

  // Open edit (create or update)
  const openEdit = (grammar?: GrammarResponse) => {
    if (grammar) {
      setFormData(toFormGrammar(grammar));
      setEditMode("edit");
      setSelectedGrammar(grammar);
    } else {
      setFormData({
        title: "",
        level: "N5",
        meaning: "",
        formation: "",
        usage: "",
        examples: [
          { japanese: "", english: "" },
          { japanese: "", english: "" },
          { japanese: "", english: "" },
        ],
      });
      setEditMode("create");
      setSelectedGrammar(null);
    }
    setViewMode("edit");
  };

  // Submit form (create or update)
  const handleFormSubmit = async () => {
    if (!formData.title.trim() || !formData.meaning.trim()) {
      showToast("Please fill in the required fields.", "error");
      return;
    }
    setSubmitting(true);
    try {
      if (editMode === "create") {
        const payload = toCreatePayload(formData);
        const created = await teacherGrammarApi.createGrammar(payload);
        showToast("Grammar lesson created successfully!", "success");
        openPreview(created);
        await fetchGrammars(false);
      } else if (selectedGrammar) {
        const payload = toUpdatePayload(formData);
        const updated = await teacherGrammarApi.updateGrammar(selectedGrammar.id, payload);
        showToast("Grammar lesson updated successfully!", "success");
        setViewMode("list");
        setSelectedGrammar(null);
        await fetchGrammars(false);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save grammar lesson.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete
  const handleDelete = async (grammar: GrammarResponse) => {
    setDeleting(true);
    try {
      await teacherGrammarApi.deleteGrammar(grammar.id);
      showToast(`"${grammar.title}" has been deleted.`, "success");
      setDeleteTarget(null);
      if (selectedGrammar?.id === grammar.id) {
        setSelectedGrammar(null);
        setViewMode("list");
      }
      await fetchGrammars(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete grammar.";
      showToast(msg, "error");
    } finally {
      setDeleting(false);
    }
  };

  // Submit from list view (refetch stays on list)
  const handleListSubmit = async (grammar: GrammarResponse) => {
    setSubmitting(true);
    try {
      await teacherGrammarApi.submitGrammar(grammar.id);
      showToast("Grammar submitted for review!", "success");
      await fetchGrammars(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit grammar.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit for review
  const handleSubmit = async (grammar: GrammarResponse) => {
    setSubmitting(true);
    try {
      await teacherGrammarApi.submitGrammar(grammar.id);
      showToast("Grammar submitted for review!", "success");
      // Navigate back to list and refresh
      setViewMode("list");
      setSelectedGrammar(null);
      await fetchGrammars(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit grammar.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Example helpers
  const updateExample = (index: number, field: "japanese" | "english", value: string) => {
    const newExamples = [...formData.examples];
    newExamples[index] = { ...newExamples[index], [field]: value };
    setFormData({ ...formData, examples: newExamples });
  };

  const addExample = () =>
    setFormData({ ...formData, examples: [...formData.examples, { japanese: "", english: "" }] });

  const isFormValid =
    formData.title.trim() &&
    formData.meaning.trim() &&
    formData.examples.some((e) => e.japanese.trim());

  // ─────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-black">Grammar Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Create, edit and manage your grammar lessons
            </p>
          </div>
          <button
            onClick={() => openEdit()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> New Lesson
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-80">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search grammar patterns..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            {LEVEL_FILTERS.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLevelFilter(l);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  levelFilter === l
                    ? "bg-gradient-hero text-white shadow"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold outline-none"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_80px_1.5fr_100px_120px] gap-3 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
            <div className="flex items-center gap-1 cursor-pointer hover:text-foreground select-none">
              Title <ArrowUpDown className="w-3 h-3" />
            </div>
            <div>Level</div>
            <div>Meaning</div>
            <div className="text-center">Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="py-16 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading grammar lessons...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="py-16 flex flex-col items-center gap-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={() => fetchGrammars(true)}
                className="px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && paginated.length === 0 && (
            <div className="py-16 flex flex-col items-center gap-3">
              <GraduationCap className="w-10 h-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {search ? `No results for "${search}"` : "No grammar lessons yet."}
              </p>
              {!search && (
                <button
                  onClick={() => openEdit()}
                  className="px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
                >
                  Create your first lesson
                </button>
              )}
            </div>
          )}

          {/* Rows */}
          {!loading &&
            !error &&
            paginated.map((grammar, i) => (
              <motion.div
                key={grammar.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-[2fr_80px_1.5fr_100px_120px] gap-3 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition cursor-pointer items-center"
                onClick={() => openPreview(grammar)}
              >
                {/* Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-500 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{grammar.title}</div>
                    <div className="text-[10px] text-muted-foreground">{grammar.level} JLPT</div>
                  </div>
                </div>

                {/* Level */}
                <div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      LEVEL_COLORS[grammar.level] ?? "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {grammar.level}
                  </span>
                </div>

                {/* Meaning */}
                <div className="text-sm text-muted-foreground truncate pr-2">{grammar.meaning}</div>

                {/* Status */}
                <div className="text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      STATUS_COLORS[grammar.status as GrammarStatus] ??
                      "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {STATUS_LABELS[grammar.status as GrammarStatus] ?? grammar.status}
                  </span>
                  {grammar.status === "APPROVED" && grammar.hasPendingUpdate && (
                    <div className="mt-1">
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-500 dark:bg-purple-950/30">
                        Update Pending
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div
                  className="text-right flex justify-end gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => openEdit(grammar)}
                    title={
                      grammar.status === "PENDING"
                        ? "This content is currently under review."
                        : grammar.status === "APPROVED" && grammar.hasPendingUpdate
                          ? "An update is already pending review."
                          : "Edit"
                    }
                    disabled={
                      grammar.status === "PENDING" ||
                      (grammar.status === "APPROVED" && grammar.hasPendingUpdate)
                    }
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
                      grammar.status === "PENDING" ||
                      (grammar.status === "APPROVED" && grammar.hasPendingUpdate)
                        ? "opacity-40 cursor-not-allowed text-blue-300"
                        : "hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(grammar)}
                    title={
                      grammar.status === "PENDING"
                        ? "This content is currently under review."
                        : "Delete"
                    }
                    disabled={grammar.status === "PENDING"}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition ${
                      grammar.status === "PENDING"
                        ? "opacity-40 cursor-not-allowed text-red-300"
                        : "hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400"
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openPreview(grammar)}
                    title="View"
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}

          {/* Pagination */}
          {totalPages > 1 && !loading && !error && (
            <div className="px-6 pb-5">
              <Pagination current={page} total={grammars.length} onPage={setPage} />
            </div>
          )}
        </div>

        {/* Delete Modal */}
        <AnimatePresence>
          {deleteTarget && (
            <DeleteModal
              grammar={deleteTarget}
              onConfirm={handleDelete}
              onClose={() => setDeleteTarget(null)}
            />
          )}
        </AnimatePresence>

        <ToastBar toast={toast} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PREVIEW VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === "preview" && selectedGrammar) {
    const g = selectedGrammar;
    const status = g.status as GrammarStatus;
    // Backend allows submit from DRAFT or REJECTED (re-submit after editing)
    const canSubmit = g.status === "DRAFT" || g.status === "REJECTED";
    // Teacher can edit APPROVED grammar, but cannot if already has pending update
    const canEdit = g.status !== "PENDING" && !(g.status === "APPROVED" && g.hasPendingUpdate);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setViewMode("list");
                setSelectedGrammar(null);
              }}
              className="p-2 rounded-xl hover:bg-muted transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-black">Grammar Preview</h1>
              <p className="text-sm text-muted-foreground mt-0.5">View lesson details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canSubmit && (
              <button
                onClick={() => handleSubmit(g)}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send for Review
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => openEdit(g)}
              disabled={!canEdit}
              title={
                g.status === "PENDING"
                  ? "This content is currently under review."
                  : g.status === "APPROVED" && g.hasPendingUpdate
                    ? "An update is already pending review."
                    : "Edit"
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                canEdit
                  ? "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 text-blue-500"
                  : "opacity-40 cursor-not-allowed bg-blue-50/60 text-blue-300"
              }`}
            >
              <Edit3 className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => {
                setViewMode("list");
                setSelectedGrammar(null);
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold hover:bg-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Rejection notice */}
        {g.status === "REJECTED" && (
          <RejectReasonBox reason={g.rejectReason} />
        )}

        {/* Metadata Grid */}
        <div className="grid md:grid-cols-3 gap-5">
          {/* Lesson Info */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Lesson Info
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Pattern</div>
                <div className="font-display font-black text-lg">{g.title}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Level</div>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                    LEVEL_COLORS[g.level] ?? "bg-slate-100 text-slate-500"
                  }`}
                >
                  {g.level}
                </span>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Meaning</div>
                <div className="text-sm font-semibold">{g.meaning}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Status</div>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                    STATUS_COLORS[status] ?? "bg-slate-100 text-slate-500"
                  }`}
                >
                  {STATUS_LABELS[status] ?? g.status}
                </span>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Last Updated</div>
                <div className="text-sm">{formatDate(g.updatedAt)}</div>
              </div>
            </div>
          </div>

          {/* Student Engagement */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Student Engagement
            </h3>
            {statsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              </div>
            ) : statsError ? (
              <p className="text-xs text-muted-foreground text-center">Stats unavailable</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                    <div className="font-display font-black text-xl text-blue-500">
                      {grammarStats?.views ?? 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">Views</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                    <div className="font-display font-black text-xl text-green-500">
                      {grammarStats?.completions ?? 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">Completions</div>
                  </div>
                </div>
                {grammarStats && grammarStats.views > 0 && (
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
                      <span>Completion Rate</span>
                      <span className="font-semibold">
                        {Math.round((grammarStats.completions / grammarStats.views) * 100)}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min((grammarStats.completions / grammarStats.views) * 100, 100)}%`,
                        }}
                        className="h-full bg-gradient-hero rounded-full"
                      />
                    </div>
                  </div>
                )}
                {(!grammarStats ||
                  (grammarStats.views === 0 && grammarStats.completions === 0)) && (
                  <p className="text-xs text-muted-foreground text-center">
                    No engagement data yet
                  </p>
                )}
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Teacher</span>
                </div>
                <span className="text-sm font-semibold">{g.teacherName}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span>Examples</span>
                </div>
                <span className="text-sm font-semibold">{g.examples?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Created</span>
                </div>
                <span className="text-sm font-semibold">{formatDate(g.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-display font-bold">Lesson Content</h3>
            <button className="px-3 py-1.5 rounded-lg bg-muted text-xs font-semibold hover:bg-muted/80 transition">
              <Eye className="w-3.5 h-3.5 inline mr-1" /> Student View
            </button>
          </div>
          <div className="p-6 space-y-6">
            {/* Formation */}
            {g.structure && (
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">
                  Formation
                </div>
                <div className="font-display font-black text-lg text-purple-700 dark:text-purple-300">
                  {g.structure}
                </div>
              </div>
            )}

            {/* Usage */}
            {g.usage && (
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Explanation
                </div>
                <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {g.usage}
                </div>
              </div>
            )}

            {/* Examples */}
            {g.examples && g.examples.length > 0 && (
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Example Sentences
                </div>
                <div className="space-y-3">
                  {g.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-xl bg-muted/50 dark:bg-slate-700/30"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {ex}
                        </div>
                        {g.exampleMeanings?.[i] && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {g.exampleMeanings[i]}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => speakJapanese(ex)}
                        title="Play pronunciation"
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition self-start"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Update Preview */}
            {g.hasPendingUpdate && (
              <div className="border-t-2 border-purple-200 dark:border-purple-800 pt-5 mt-5">
                <div className="flex items-center gap-2 mb-4">
                  <RefreshCw className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">
                    Pending Update Preview
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    (Waiting for admin approval)
                  </span>
                </div>
                <div className="space-y-4">
                  {g.pendingTitle && (
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
                      <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Title</div>
                      <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">{g.pendingTitle}</div>
                    </div>
                  )}
                  {g.pendingPattern && (
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
                      <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Pattern</div>
                      <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">{g.pendingPattern}</div>
                    </div>
                  )}
                  {g.pendingMeaning && (
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
                      <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Meaning</div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">{g.pendingMeaning}</div>
                    </div>
                  )}
                  {g.pendingStructure && (
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
                      <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Structure</div>
                      <div className="text-sm text-purple-700 dark:text-purple-300 font-mono">{g.pendingStructure}</div>
                    </div>
                  )}
                  {g.pendingUsage && (
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
                      <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Usage</div>
                      <div className="text-sm text-purple-700 dark:text-purple-300">{g.pendingUsage}</div>
                    </div>
                  )}
                  {g.pendingLevel && (
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
                      <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Level</div>
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                        {g.pendingLevel}
                      </span>
                    </div>
                  )}
                  {g.pendingExamples && g.pendingExamples.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-2">Example Sentences</div>
                      <div className="space-y-2">
                        {g.pendingExamples.map((ex, i) => (
                          <div key={i} className="flex gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">{ex}</div>
                              {g.pendingExampleMeanings?.[i] && (
                                <div className="text-xs text-purple-500 dark:text-purple-400 mt-0.5">
                                  {g.pendingExampleMeanings[i]}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <ToastBar toast={toast} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // EDIT VIEW — Split Pane
  // ─────────────────────────────────────────────────────────────────────────
  if (viewMode === "edit") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode("list")}
                className="p-2 rounded-xl hover:bg-muted transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-display font-black">
                  {editMode === "edit" ? "Edit Grammar Lesson" : "Create Grammar Lesson"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {editMode === "edit"
                    ? `Editing: ${selectedGrammar?.title}`
                    : "Create a new grammar lesson"}
                </p>
              </div>
            </div>
          </div>

          {/* Rejection notice */}
          {editMode === "edit" && selectedGrammar?.status === "REJECTED" && (
            <>
              <RejectReasonBox reason={selectedGrammar.rejectReason} />
              <p className="text-xs text-muted-foreground">
                Please fix the issues above and resubmit for review.
              </p>
            </>
          )}

          {/* Approved edit warning */}
          {editMode === "edit" && selectedGrammar?.status === "APPROVED" && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/30">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                  Editing an approved lesson
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                  Your changes will be saved as a pending update and sent for admin review. Students will continue seeing the current approved version until the update is approved.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Split Pane */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: Form Editor */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 space-y-5">
              <h3 className="font-display font-bold text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-500" /> Form Editor
              </h3>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Grammar Pattern <span className="text-red-400">*</span>
                </label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. 〜ながらも"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    JLPT Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none"
                  >
                    <option>N5</option>
                    <option>N4</option>
                    <option>N3</option>
                    <option>N2</option>
                    <option>N1</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Meaning <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={formData.meaning}
                    onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                    placeholder="e.g. although / while"
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Formation
                </label>
                <input
                  value={formData.formation}
                  onChange={(e) => setFormData({ ...formData, formation: e.target.value })}
                  placeholder="e.g. Verb (ます-stem) + めながら"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Explanation
                </label>
                <textarea
                  value={formData.usage}
                  onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
                  rows={4}
                  placeholder="Write a detailed explanation of the grammar pattern..."
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                  Example Sentences
                </label>
                <div className="space-y-2">
                  {formData.examples.map((ex, n) => (
                    <div key={n} className="flex gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-2.5">
                        {n + 1}
                      </div>
                      <div className="flex-1">
                        <input
                          value={ex.japanese}
                          onChange={(e) => updateExample(n, "japanese", e.target.value)}
                          placeholder="Japanese sentence"
                          className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 mb-1"
                        />
                        <input
                          value={ex.english}
                          onChange={(e) => updateExample(n, "english", e.target.value)}
                          placeholder="Vietnamese translation"
                          className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <button
                        onClick={() => speakJapanese(ex.japanese)}
                        title="Play pronunciation"
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition self-start mt-1.5"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addExample}
                    className="w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition"
                  >
                    + Add Example
                  </button>
                </div>
              </div>
            </div>

            {/* Validation */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Validation
              </h4>
              <div className="space-y-1.5">
                {[
                  { ok: !!formData.title.trim(), label: "Pattern filled" },
                  { ok: !!formData.meaning.trim(), label: "Meaning filled" },
                  {
                    ok: formData.examples.some((e) => e.japanese.trim()),
                    label: "At least 1 example",
                  },
                  {
                    ok: formData.examples.filter((e) => e.japanese.trim()).length >= 2,
                    label: "2+ examples (recommended)",
                  },
                ].map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {v.ok ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    )}
                    <span
                      className={
                        v.ok
                          ? "text-green-600 dark:text-green-400 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {v.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Live Preview */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-display font-bold text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" /> Live Preview
                </h3>
              </div>

              <div className="p-5 space-y-5">
                {/* Formation Preview */}
                {formData.formation ? (
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                    <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">
                      Formation
                    </div>
                    <div className="font-display font-black text-lg text-purple-700 dark:text-purple-300">
                      {formData.formation}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-xs text-muted-foreground">
                      Formation will appear here...
                    </div>
                  </div>
                )}

                {/* Meaning Preview */}
                {formData.meaning ? (
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        LEVEL_COLORS[formData.level] ?? "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {formData.level}
                    </span>
                    <span className="text-sm font-semibold">{formData.meaning}</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Meaning will appear here...</div>
                )}

                {/* Explanation Preview */}
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Explanation
                  </div>
                  <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 min-h-[60px]">
                    {formData.usage || (
                      <span className="text-muted-foreground italic">
                        Explanation will appear here...
                      </span>
                    )}
                  </div>
                </div>

                {/* Examples Preview */}
                <div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Examples
                  </div>
                  <div className="space-y-2">
                    {formData.examples.map((ex, i) =>
                      ex.japanese ? (
                        <div
                          key={i}
                          className="flex gap-3 p-3 rounded-xl bg-muted/50 dark:bg-slate-700/30"
                        >
                          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {ex.japanese}
                            </div>
                            {ex.english && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {ex.english}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => speakJapanese(ex.japanese)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition self-start"
                          >
                            <Mic className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null,
                    )}
                    {formData.examples.every((e) => !e.japanese) && (
                      <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                        <div className="text-xs text-muted-foreground">
                          Examples will appear here...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setViewMode("list")}
            className="px-5 py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
          >
            Cancel
          </button>
          {selectedGrammar?.status === "REJECTED" && (
            <button
              onClick={handleFormSubmit}
              disabled={!isFormValid || submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow disabled:opacity-40 transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Resubmitting...
                </>
              ) : (
                "Resubmit for Review"
              )}
            </button>
          )}
          <button
            onClick={handleFormSubmit}
            disabled={!isFormValid || submitting}
            className="px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition disabled:opacity-40"
          >
            {submitting && editMode === "edit" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : editMode === "edit" ? (
              "Save Draft"
            ) : (
              "Create Lesson"
            )}
          </button>
        </div>

        <ToastBar toast={toast} />
      </div>
    );
  }

  return null;
}
