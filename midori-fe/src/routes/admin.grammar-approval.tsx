import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Loader2,
  X,
  ChevronLeft,
  BookOpen,
  FileText,
  User,
  RefreshCw,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";
import {
  getPendingGrammar,
  getGrammarApprovalDetail,
  approveGrammar,
  rejectGrammar,
  getGrammarApprovalStats,
} from "@/lib/api/contentApproval";
import {
  CONTENT_STATUS_CONFIG,
  type ContentApprovalSummary,
  type GrammarDetailContent,
  type GrammarApprovalStatsResponse,
} from "@/lib/api/contentApproval.types";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/admin/grammar-approval")({
  component: GrammarApprovalPage,
});

// ─── Toast ─────────────────────────────────────────────────────────────────────

type ToastData = { message: string; type: "success" | "error" };

function Toast({ message, type, visible }: ToastData & { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border shadow-xl glass-modal ${
            type === "success"
              ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25"
              : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
          }`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {type === "success" ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = CONTENT_STATUS_CONFIG[status as keyof typeof CONTENT_STATUS_CONFIG] ?? {
    label: status,
    bg: "bg-muted",
    text: "text-muted-col",
    border: "border-[var(--border)]",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Grammar Badge ─────────────────────────────────────────────────────────────

function GrammarBadge() {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/12 text-primary border border-primary/20">
      <BookOpen className="w-3 h-3 mr-1" />
      Grammar
    </span>
  );
}

// ─── Level Badge ──────────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: string }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--status-student)]/12 text-[var(--status-student)] border border-[var(--status-student)]/20">
      JLPT {level}
    </span>
  );
}

// ─── Approve Confirm Modal ─────────────────────────────────────────────────────

function ApproveConfirmModal({
  item,
  onConfirm,
  onClose,
}: {
  item: ContentApprovalSummary;
  onConfirm: (item: ContentApprovalSummary) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(item);
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
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--status-active)]/15 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-[var(--status-active)]" />
            </div>
            <h3 className="font-display font-bold text-primary-col text-base">Approve Grammar</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl glass-surface mb-4">
          <p className="text-sm font-semibold text-primary-col">{item.title}</p>
          <p className="text-xs text-muted-col mt-0.5">by {item.teacherName}</p>
        </div>

        <p className="text-xs text-secondary-col mb-5">
          This grammar lesson will be marked as{" "}
          <span className="text-[var(--status-active)] font-semibold">Approved</span> and made
          visible to students.
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
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/15 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/25 hover:bg-[var(--status-active)]/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Approving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Confirm Approve
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({
  item,
  onConfirm,
  onClose,
}: {
  item: ContentApprovalSummary;
  onConfirm: (item: ContentApprovalSummary, reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onConfirm(item, reason.trim());
    } finally {
      setLoading(false);
    }
  };

  const isValid = reason.trim().length > 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--status-rejected)]/15 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-[var(--status-rejected)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary-col text-base">Reject Grammar</h3>
              <p className="text-xs text-muted-col">Provide a reason for rejection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mx-6 mt-4 p-3 rounded-xl glass-surface">
          <p className="text-sm font-semibold text-primary-col">{item.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <GrammarBadge />
            <span className="text-xs text-muted-col">by {item.teacherName}</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Rejection Reason{" "}
              <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this grammar lesson is being rejected..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl input-glass text-sm placeholder:text-muted-col resize-none"
            />
            {reason.length > 0 && reason.length < 10 && (
              <p className="text-[10px] text-[var(--status-rejected)] mt-1">
                Please provide a more detailed reason.
              </p>
            )}
          </div>

          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--status-rejected)]/10 border border-[var(--status-rejected)]/20">
            <AlertTriangle className="w-4 h-4 text-[var(--status-rejected)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--status-rejected)] leading-relaxed">
              The teacher will be notified of this rejection. They can revise and resubmit the
              grammar lesson.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/25 hover:bg-[var(--status-rejected)]/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Rejecting...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" /> Confirm Reject
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({
  detail,
  loading,
  error,
  onClose,
  onApprove,
  onReject,
  approving,
  rejecting,
}: {
  detail: GrammarDetailContent | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const exampleCount = detail?.examples?.length ?? detail?.cardCount ?? 0;
  const isPending = detail?.status?.toUpperCase() === "PENDING";

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      </motion.div>

      <motion.div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl glass-modal rounded-l-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-right"
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-muted-col uppercase tracking-wider">
              Grammar Details
            </span>
          </div>
          {detail && (
            <div className="flex items-center gap-2">
              <StatusBadge status={detail.status ?? "PENDING"} />
              <GrammarBadge />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-col">Loading grammar details...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <XCircle className="w-8 h-8 text-[var(--status-rejected)]/60" />
              <p className="text-sm text-[var(--status-rejected)]">{error}</p>
            </div>
          )}

          {detail && !loading && !error && (
            <>
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-black text-primary-col text-xl leading-tight">
                    {detail.title || "—"}
                  </h2>
                  <p className="text-xs text-muted-col mt-0.5">Grammar Pattern</p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl glass-surface">
                  <div className="flex items-center gap-1.5 mb-2">
                    <User className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
                      Teacher
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary-col">
                    {detail.teacherName || "Unknown"}
                  </p>
                </div>
                <div className="p-3 rounded-xl glass-surface">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-3 h-3 text-[var(--status-student)]" />
                    <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
                      Level
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary-col">
                    {detail.level || "—"}
                  </p>
                </div>
                <div className="p-3 rounded-xl glass-surface">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
                      Examples
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary-col">
                    {exampleCount}
                  </p>
                </div>
                <div className="p-3 rounded-xl glass-surface">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-3 h-3 text-muted-col" />
                    <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
                      Submitted
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary-col">
                    {detail.createdAt
                      ? new Date(detail.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Rejection Reason */}
              {detail.rejectReason && (
                <div className="p-4 rounded-xl bg-[var(--status-rejected)]/8 border border-[var(--status-rejected)]/15">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-[var(--status-rejected)]" />
                    <span className="text-xs font-bold text-[var(--status-rejected)]">
                      Previous Rejection Reason
                    </span>
                  </div>
                  <p className="text-sm text-secondary-col leading-relaxed">
                    {detail.rejectReason}
                  </p>
                </div>
              )}

              {/* Grammar-specific content */}
              <div className="space-y-4">
                {detail.pattern && (
                  <div className="p-4 rounded-xl bg-primary/8 border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        Pattern
                      </span>
                    </div>
                    <p className="font-display font-black text-lg text-primary">
                      {detail.pattern}
                    </p>
                  </div>
                )}

                {detail.meaning && (
                  <div className="p-3 rounded-xl glass-surface">
                    <p className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-1">
                      Meaning
                    </p>
                    <p className="text-sm text-secondary-col">{detail.meaning}</p>
                  </div>
                )}

                {detail.structure && (
                  <div className="p-3 rounded-xl glass-surface">
                    <p className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-1">
                      Structure
                    </p>
                    <p className="text-sm text-secondary-col font-mono">{detail.structure}</p>
                  </div>
                )}

                {detail.usage && (
                  <div className="p-3 rounded-xl glass-surface">
                    <p className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-1">
                      Usage
                    </p>
                    <p className="text-sm text-secondary-col leading-relaxed">{detail.usage}</p>
                  </div>
                )}

                {detail.examples && detail.examples.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
                      Example Sentences
                    </p>
                    <div className="space-y-2">
                      {detail.examples.map((ex, i) => (
                        <div key={i} className="p-3 rounded-xl glass-surface">
                          <p className="text-sm text-primary-col font-medium mb-1">{ex}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Bar */}
        {detail && !loading && !error && isPending && (
          <div className="px-6 py-4 border-t separator bg-[var(--glass-bg)]">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
              >
                Close
              </button>
              <button
                onClick={onReject}
                disabled={rejecting}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/20 hover:bg-[var(--status-rejected)]/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" /> Reject
                  </>
                )}
              </button>
              <button
                onClick={onApprove}
                disabled={approving}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {approving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Approve
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {detail && !loading && !error && !isPending && (
          <div className="px-6 py-4 border-t separator bg-[var(--glass-bg)]">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabType = "pending" | "approved";

function GrammarApprovalPage() {
  const [items, setItems] = useState<ContentApprovalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("pending");

  // Stats state — always initialized, never null
  const [stats, setStats] = useState<GrammarApprovalStatsResponse>({
    pendingReview: 0,
    totalGrammar: 0,
    approved: 0,
    rejected: 0,
    draft: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [viewingItem, setViewingItem] = useState<ContentApprovalSummary | null>(null);
  const [detail, setDetail] = useState<GrammarDetailContent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [approveTarget, setApproveTarget] = useState<ContentApprovalSummary | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ContentApprovalSummary | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Filter items by status based on active tab
  const displayedItems = useMemo(() => {
    if (activeTab === "pending") {
      return items.filter(item => item.status?.toUpperCase() === "PENDING");
    }
    return items.filter(item => item.status?.toUpperCase() === "APPROVED");
  }, [items, activeTab]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await getGrammarApprovalStats();
      console.log("[Grammar Approval] Stats fetched:", data);
      setStats(data);
    } catch (err) {
      console.error("[Grammar Approval] Stats error:", err);
      setStatsError(err instanceof ApiError ? err.message : "Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch all grammar approvals
  const fetchAllGrammar = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await getPendingGrammar();
      setItems(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load grammar approvals.";
      setError(msg);
      setItems([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchAllGrammar();
  }, [fetchStats, fetchAllGrammar]);

  // Fetch detail
  const fetchDetail = useCallback(async (item: ContentApprovalSummary) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    try {
      console.log("[Grammar Approval] Fetching detail for grammar ID:", item.contentId, item);
      const data = await getGrammarApprovalDetail(item.contentId);
      console.log("[Grammar Approval] Detail response:", data);
      setDetail(data);
    } catch (err) {
      console.error("[Grammar Approval] Error fetching detail:", err);
      const msg = err instanceof ApiError ? err.message : "Failed to load grammar details.";
      setDetailError(msg);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Handle view
  const handleView = useCallback(
    (item: ContentApprovalSummary) => {
      setViewingItem(item);
      fetchDetail(item);
    },
    [fetchDetail],
  );

  const handleCloseDetail = useCallback(() => {
    setViewingItem(null);
    setDetail(null);
    setDetailError(null);
  }, []);

  // Show toast
  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Handle approve
  const handleApprove = useCallback(
    async (item: ContentApprovalSummary) => {
      setApprovingId(item.contentId);
      try {
        await approveGrammar(item.contentId);
        showToast(`"${item.title}" has been approved.`, "success");
        setApproveTarget(null);
        if (viewingItem?.contentId === item.contentId) handleCloseDetail();
        await Promise.all([fetchAllGrammar(false), fetchStats()]);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Failed to approve grammar.";
        showToast(msg, "error");
      } finally {
        setApprovingId(null);
      }
    },
    [showToast, viewingItem, handleCloseDetail, fetchAllGrammar, fetchStats],
  );

  // Handle reject
  const handleReject = useCallback(
    async (item: ContentApprovalSummary, reason: string) => {
      setRejectingId(item.contentId);
      try {
        await rejectGrammar(item.contentId, reason);
        showToast(`"${item.title}" has been rejected.`, "success");
        setRejectTarget(null);
        if (viewingItem?.contentId === item.contentId) handleCloseDetail();
        await Promise.all([fetchAllGrammar(false), fetchStats()]);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Failed to reject grammar.";
        showToast(msg, "error");
      } finally {
        setRejectingId(null);
      }
    },
    [showToast, viewingItem, handleCloseDetail, fetchAllGrammar, fetchStats],
  );

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchStats();
    fetchAllGrammar(true);
  }, [fetchStats, fetchAllGrammar]);

  // Get stats values — safe numbers with fallback 0
  const pendingReviewCount = stats?.pendingReview ?? 0;
  const totalGrammarCount = stats?.totalGrammar ?? 0;
  const approvedCount = stats?.approved ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Grammar Approvals</h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Review and approve teacher-submitted grammar lessons
          </p>
        </div>
        {pendingReviewCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--status-pending)]/10 text-[var(--status-pending)] text-xs font-bold border border-[var(--status-pending)]/20">
            <Clock className="w-3 h-3" />
            {pendingReviewCount} lesson{pendingReviewCount > 1 ? "s" : ""} need review
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          {
            label: "Pending Review",
            value: pendingReviewCount,
            loading: statsLoading,
            icon: Clock,
            color: "text-[var(--status-pending)]",
            bg: "bg-[var(--status-pending)]/12",
          },
          {
            label: "Total Grammar",
            value: totalGrammarCount,
            loading: statsLoading,
            icon: GraduationCap,
            color: "text-primary",
            bg: "bg-primary/12",
          },
          {
            label: "Approved",
            value: approvedCount,
            loading: statsLoading,
            icon: CheckCircle,
            color: "text-[var(--status-active)]",
            bg: "bg-[var(--status-active)]/12",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-base p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  {stat.label}
                </span>
              </div>
              <div className="font-display font-black text-xl text-primary-col">
                {stat.loading ? (
                  <span className="opacity-40">...</span>
                ) : (
                  <span>{stat.value ?? 0}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs - Match Reports Center style */}
      <div className="flex gap-1 glass-card p-1 w-fit">
        {(["pending", "approved"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
              activeTab === t
                ? "bg-gradient-hero text-white shadow-md"
                : "text-secondary-col nav-item"
            }`}
          >
            {t === "pending"
              ? `Pending Review (${pendingReviewCount})`
              : `Approved (${approvedCount})`}
          </button>
        ))}
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-col">Loading grammar lessons...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <XCircle className="w-10 h-10 text-[var(--status-rejected)]/60" />
            <p className="text-sm text-[var(--status-rejected)]">{error}</p>
            <button
              onClick={() => fetchAllGrammar(true)}
              className="px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && displayedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 empty-state">
            <CheckCircle className="w-12 h-12 text-[var(--status-active)]/40 mb-3" />
            <p className="text-secondary-col font-semibold text-sm">
              {activeTab === "pending"
                ? "All caught up — no pending grammar!"
                : "No approved grammar lessons yet."}
            </p>
            <p className="text-xs text-muted-col mt-1">
              {activeTab === "pending"
                ? "Check back later for new submissions."
                : "Approved lessons will appear here."}
            </p>
          </div>
        )}

        {!loading &&
          !error &&
          displayedItems.map((item, i) => {
            const isApproving = approvingId === item.contentId;
            const isRejecting = rejectingId === item.contentId;
            const isPending = item.status?.toUpperCase() === "PENDING";

            return (
              <motion.div
                key={item.contentId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`card-base p-5 transition ${
                  isPending ? "border-[var(--status-pending)]/25" : "border-[var(--glass-border)]"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Grammar Icon */}
                  <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title and Badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display font-bold text-primary-col text-sm">
                        {item.title}
                      </span>
                      <StatusBadge status={item.status} />
                      <GrammarBadge />
                      {item.level && <LevelBadge level={item.level} />}
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-4 text-[10px] text-muted-col mb-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.teacherName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.submittedAt
                          ? new Date(item.submittedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>

                    {/* Rejection Reason */}
                    {item.rejectReason && (
                      <div className="flex items-center gap-1 text-[var(--status-rejected)] text-[10px]">
                        <XCircle className="w-3 h-3" />
                        Rejected: {item.rejectReason}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    {isPending && (
                      <>
                        <button
                          onClick={() => setApproveTarget(item)}
                          disabled={isApproving || isRejecting}
                          className="p-2 rounded-xl bg-[var(--status-active)]/10 text-[var(--status-active)] hover:bg-[var(--status-active)]/20 transition disabled:opacity-40"
                          title="Approve"
                        >
                          {isApproving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setRejectTarget(item)}
                          disabled={isApproving || isRejecting}
                          className="p-2 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/20 transition disabled:opacity-40"
                          title="Reject"
                        >
                          {isRejecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleView(item)}
                      disabled={isApproving || isRejecting}
                      className="p-2 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition disabled:opacity-40"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {viewingItem && (
          <DetailDrawer
            detail={detail}
            loading={detailLoading}
            error={detailError}
            onClose={handleCloseDetail}
            onApprove={() => handleApprove(viewingItem)}
            onReject={() => setRejectTarget(viewingItem)}
            approving={approvingId === viewingItem.contentId}
            rejecting={rejectingId === viewingItem.contentId}
          />
        )}
      </AnimatePresence>

      {/* Approve Confirm Modal */}
      <AnimatePresence>
        {approveTarget && (
          <ApproveConfirmModal
            item={approveTarget}
            onConfirm={handleApprove}
            onClose={() => setApproveTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            item={rejectTarget}
            onConfirm={handleReject}
            onClose={() => setRejectTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toast?.message ?? ""} type={toast?.type ?? "success"} visible={!!toast} />
    </div>
  );
}
