import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
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
  Layers,
  FileText,
  User,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  getPendingContent,
  getContentDetail,
  approveContent,
  rejectContent,
} from "@/lib/api/contentApproval";
import {
  CONTENT_STATUS_CONFIG,
  CONTENT_TYPE_CONFIG,
  type ContentApprovalSummary,
  type ContentApprovalDetail,
  type ContentRejectPayload,
} from "@/lib/api/contentApproval.types";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/admin/content-approval")({
  component: AdminContentApprovalPage,
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

// ─── Content Type Badge ────────────────────────────────────────────────────────

function ContentTypeBadge({ contentType }: { contentType: string }) {
  const cfg = CONTENT_TYPE_CONFIG[contentType as keyof typeof CONTENT_TYPE_CONFIG] ?? {
    label: contentType,
    bg: "bg-muted",
    text: "text-muted-col",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${cfg.bg} ${cfg.text}`}
    >
      {contentType === "GRAMMAR" ? (
        <BookOpen className="w-3 h-3 mr-1" />
      ) : (
        <Layers className="w-3 h-3 mr-1" />
      )}
      {cfg.label}
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
            <h3 className="font-display font-bold text-primary-col text-base">Approve Content</h3>
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
          This content will be marked as{" "}
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
              <h3 className="font-display font-bold text-primary-col text-base">Reject Content</h3>
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
            <ContentTypeBadge contentType={item.contentType} />
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
              placeholder="Explain why this content is being rejected..."
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
              content.
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
  detail: ContentApprovalDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const grammar = detail?.grammar ?? null;
  const flashcard = detail?.flashcard ?? null;

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
              Content Details
            </span>
          </div>
          {detail && (
            <div className="flex items-center gap-2">
              <StatusBadge
                status={
                  detail.contentType === "GRAMMAR"
                    ? (grammar?.status ?? "PENDING")
                    : (flashcard?.status ?? "PENDING")
                }
              />
              <ContentTypeBadge contentType={detail.contentType} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-col">Loading content details...</p>
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
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    detail.contentType === "GRAMMAR"
                      ? "bg-primary/15 text-primary"
                      : "bg-[var(--status-teacher)]/15 text-[var(--status-teacher)]"
                  }`}
                >
                  {detail.contentType === "GRAMMAR" ? (
                    <BookOpen className="w-5 h-5" />
                  ) : (
                    <Layers className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-black text-primary-col text-xl leading-tight">
                    {grammar?.title ?? flashcard?.title ?? "—"}
                  </h2>
                  <p className="text-xs text-muted-col mt-0.5">
                    {detail.contentType === "GRAMMAR" ? "Grammar Pattern" : "Flashcard Set"}
                  </p>
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
                    {grammar?.teacherName ?? flashcard?.teacherName ?? "—"}
                  </p>
                </div>
                <div className="p-3 rounded-xl glass-surface">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Layers className="w-3 h-3 text-[var(--status-student)]" />
                    <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
                      Level
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary-col">
                    {grammar?.level ?? flashcard?.level ?? "—"}
                  </p>
                </div>
                <div className="p-3 rounded-xl glass-surface">
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
                      Cards
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary-col">
                    {grammar?.cardCount ?? flashcard?.cardCount ?? 0}
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
                    {detail.contentType === "GRAMMAR"
                      ? grammar?.createdAt
                        ? new Date(grammar.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"
                      : flashcard?.createdAt
                        ? new Date(flashcard.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                  </p>
                </div>
              </div>

              {/* Rejection Reason */}
              {(grammar?.rejectReason || flashcard?.rejectReason) && (
                <div className="p-4 rounded-xl bg-[var(--status-rejected)]/8 border border-[var(--status-rejected)]/15">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-4 h-4 text-[var(--status-rejected)]" />
                    <span className="text-xs font-bold text-[var(--status-rejected)]">
                      Previous Rejection Reason
                    </span>
                  </div>
                  <p className="text-sm text-secondary-col leading-relaxed">
                    {grammar?.rejectReason ?? flashcard?.rejectReason}
                  </p>
                </div>
              )}

              {/* Grammar-specific content */}
              {grammar && (
                <div className="space-y-4">
                  {grammar.pattern && (
                    <div className="p-4 rounded-xl bg-primary/8 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          Pattern
                        </span>
                      </div>
                      <p className="font-display font-black text-lg text-primary">
                        {grammar.pattern}
                      </p>
                    </div>
                  )}

                  {grammar.meaning && (
                    <div className="p-3 rounded-xl glass-surface">
                      <p className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-1">
                        Meaning
                      </p>
                      <p className="text-sm text-secondary-col">{grammar.meaning}</p>
                    </div>
                  )}

                  {grammar.structure && (
                    <div className="p-3 rounded-xl glass-surface">
                      <p className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-1">
                        Structure
                      </p>
                      <p className="text-sm text-secondary-col font-mono">{grammar.structure}</p>
                    </div>
                  )}

                  {grammar.usage && (
                    <div className="p-3 rounded-xl glass-surface">
                      <p className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-1">
                        Usage
                      </p>
                      <p className="text-sm text-secondary-col leading-relaxed">{grammar.usage}</p>
                    </div>
                  )}

                  {grammar.examples && grammar.examples.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
                        Example Sentences
                      </p>
                      <div className="space-y-2">
                        {grammar.examples.map((ex, i) => (
                          <div key={i} className="p-3 rounded-xl glass-surface">
                            <p className="text-sm text-primary-col font-medium mb-1">{ex}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Flashcard-specific content */}
              {flashcard && (
                <div className="space-y-4">
                  {flashcard.description && (
                    <div className="p-3 rounded-xl glass-surface">
                      <p className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-1">
                        Description
                      </p>
                      <p className="text-sm text-secondary-col leading-relaxed">
                        {flashcard.description}
                      </p>
                    </div>
                  )}

                  {flashcard.cards && flashcard.cards.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
                        Flashcards ({flashcard.cards.length})
                      </p>
                      <div className="space-y-2 max-h-80 overflow-auto">
                        {flashcard.cards.map((card, i) => (
                          <div key={card.id} className="p-3 rounded-xl glass-surface">
                            <div className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {i + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-primary-col">
                                  {card.frontText}
                                </p>
                                <p className="text-xs text-muted-col mt-0.5">{card.backText}</p>
                                {card.example && (
                                  <p className="text-[10px] text-muted-col/70 mt-1 italic">
                                    {card.example}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Bar */}
        {detail && !loading && !error && (
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
      </motion.div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdminContentApprovalPage() {
  const [items, setItems] = useState<ContentApprovalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [toast, setToast] = useState<ToastData | null>(null);

  const [viewingItem, setViewingItem] = useState<ContentApprovalSummary | null>(null);
  const [detail, setDetail] = useState<ContentApprovalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [approveTarget, setApproveTarget] = useState<ContentApprovalSummary | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ContentApprovalSummary | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Fetch pending content
  const fetchPending = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError(null);
      try {
        const contentType = typeFilter === "ALL" ? undefined : typeFilter;
        const data = await getPendingContent(contentType);
        setItems(data);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Failed to load pending content.";
        setError(msg);
        setItems([]);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [typeFilter],
  );

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Fetch detail
  const fetchDetail = useCallback(async (item: ContentApprovalSummary) => {
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    try {
      const data = await getContentDetail(item.contentType, item.contentId);
      setDetail(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load content details.";
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
        await approveContent(item.contentType, item.contentId);
        showToast(`"${item.title}" has been approved.`, "success");
        setApproveTarget(null);
        if (viewingItem?.contentId === item.contentId) handleCloseDetail();
        await fetchPending(false);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Failed to approve content.";
        showToast(msg, "error");
      } finally {
        setApprovingId(null);
      }
    },
    [showToast, viewingItem, handleCloseDetail, fetchPending],
  );

  // Handle reject
  const handleReject = useCallback(
    async (item: ContentApprovalSummary, reason: string) => {
      setRejectingId(item.contentId);
      try {
        const payload: ContentRejectPayload = { reason };
        await rejectContent(item.contentType, item.contentId, payload);
        showToast(`"${item.title}" has been rejected.`, "success");
        setRejectTarget(null);
        if (viewingItem?.contentId === item.contentId) handleCloseDetail();
        await fetchPending(false);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Failed to reject content.";
        showToast(msg, "error");
      } finally {
        setRejectingId(null);
      }
    },
    [showToast, viewingItem, handleCloseDetail, fetchPending],
  );

  // Filter items
  const filteredItems =
    typeFilter === "ALL" ? items : items.filter((item) => item.contentType === typeFilter);

  const pendingGrammar = items.filter((i) => i.contentType === "GRAMMAR").length;
  const pendingFlashcard = items.filter((i) => i.contentType === "FLASHCARD").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Content Approvals</h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Review and approve teacher-submitted content
          </p>
        </div>
        <button
          onClick={() => fetchPending(true)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl glass-surface text-sm font-bold text-secondary-col hover:text-primary-col transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          {
            label: "Total Pending",
            value: items.length,
            icon: Clock,
            color: "text-[var(--status-pending)]",
            bg: "bg-[var(--status-pending)]/12",
          },
          {
            label: "Grammar",
            value: pendingGrammar,
            icon: BookOpen,
            color: "text-primary",
            bg: "bg-primary/12",
          },
          {
            label: "Flashcard",
            value: pendingFlashcard,
            icon: Layers,
            color: "text-[var(--status-teacher)]",
            bg: "bg-[var(--status-teacher)]/12",
          },
          {
            label: "Approved",
            value: 0,
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
                {loading ? <span className="opacity-40">{stat.value}</span> : stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 glass-card p-1 w-fit">
        {(["ALL", "GRAMMAR", "FLASHCARD"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
              typeFilter === t
                ? "bg-gradient-hero text-white shadow-md"
                : "text-secondary-col nav-item"
            }`}
          >
            {t === "ALL"
              ? `All (${items.length})`
              : t === "GRAMMAR"
                ? `Grammar (${pendingGrammar})`
                : `Flashcard (${pendingFlashcard})`}
          </button>
        ))}
      </div>

      {/* Content List */}
      <div className="space-y-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-col">Loading pending content...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <XCircle className="w-10 h-10 text-[var(--status-rejected)]/60" />
            <p className="text-sm text-[var(--status-rejected)]">{error}</p>
            <button
              onClick={() => fetchPending(true)}
              className="px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 empty-state">
            <CheckCircle className="w-12 h-12 text-[var(--status-active)]/40 mb-3" />
            <p className="text-secondary-col font-semibold text-sm">
              {typeFilter === "ALL"
                ? "All caught up — no pending content!"
                : `No pending ${typeFilter.toLowerCase()} content.`}
            </p>
            <p className="text-xs text-muted-col mt-1">Check back later for new submissions.</p>
          </div>
        )}

        {!loading &&
          !error &&
          filteredItems.map((item, i) => {
            const isApproving = approvingId === item.contentId;
            const isRejecting = rejectingId === item.contentId;
            return (
              <motion.div
                key={item.contentId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card-base p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Type badge */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.contentType === "GRAMMAR"
                        ? "bg-primary/15 text-primary"
                        : "bg-[var(--status-teacher)]/15 text-[var(--status-teacher)]"
                    }`}
                  >
                    {item.contentType === "GRAMMAR" ? (
                      <BookOpen className="w-5 h-5" />
                    ) : (
                      <Layers className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display font-bold text-primary-col text-sm">
                        {item.title}
                      </span>
                      <StatusBadge status={item.status} />
                      <ContentTypeBadge contentType={item.contentType} />
                      {item.level && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-col border border-[var(--border)]">
                          {item.level}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-muted-col">
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
                      {item.rejectReason && (
                        <span className="flex items-center gap-1 text-[var(--status-rejected)]">
                          <XCircle className="w-3 h-3" />
                          Rejected before
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleView(item)}
                      disabled={isApproving || isRejecting}
                      className="p-2 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition disabled:opacity-40"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
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
