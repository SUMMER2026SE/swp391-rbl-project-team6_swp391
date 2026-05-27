import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookMarked, CheckCircle, XCircle, Eye, AlertTriangle,
  Clock, ChevronLeft, User, Flag, Loader2,
  FileText, MessageSquare, Ban, Trash2,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ReportSeverity = "critical" | "high" | "medium" | "low";
type ReportStatus = "pending" | "resolved" | "dismissed";
type ReportType = "content" | "user";

type GrammarContent = {
  pattern: string;
  meaning: string;
  jlptLevel: string;
  examples: { sentence: string; translation: string }[];
  usageNotes: string;
};

type Report = {
  id: number;
  type: ReportType;
  title: string;
  reason: string;
  reporter: string;
  reporterEmail: string;
  reported: string;
  reportedEmail: string;
  severity: ReportSeverity;
  status: ReportStatus;
  date: string;
  grammar?: GrammarContent;
  description: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialReports: Report[] = [
  {
    id: 1,
    type: "content",
    title: "Grammar: ~ながらも",
    reason: "Inaccurate explanation of the grammar pattern",
    reporter: "Yuki Tanaka",
    reporterEmail: "yuki.t@mail.com",
    reported: "Sakura Hayashi",
    reportedEmail: "sakura.h@mail.com",
    severity: "medium",
    status: "pending",
    date: "2h ago",
    grammar: {
      pattern: "~ながらも",
      meaning: "Even though ~ / Despite ~",
      jlptLevel: "N3",
      examples: [
        { sentence: "雨天ながらも、彼は試合に出た。", translation: "Even though it was raining, he played in the match." },
        { sentence: "小さいながらも、立派な家だ。", translation: "It is a fine house, even though it is small." },
        { sentence: "狭いながらも、居心地の良い部屋だ。", translation: "It is a comfortable room, even though it is small." },
      ],
      usageNotes: "~ながらも is used to express 'even though' or 'despite'. It attaches to the stem of verbs/adjectives.",
    },
    description: "The grammar explanation states that めながら only attaches to nouns, but it actually works with verbs (stem + ながらも) and adjectives as well.",
  },
  {
    id: 2,
    type: "content",
    title: "Grammar: ~そばから",
    reason: "Confusing example sentences — wrong context",
    reporter: "Anna Kowalski",
    reporterEmail: "anna.k@mail.com",
    reported: "Kenji Yamamoto",
    reportedEmail: "kenji.y@mail.com",
    severity: "high",
    status: "pending",
    date: "4h ago",
    grammar: {
      pattern: "~そばから",
      meaning: "As soon as ~ / Right after ~",
      jlptLevel: "N3",
      examples: [
        { sentence: "覚えるそばから忘れてしまう。", translation: "I forget as soon as I memorize." },
        { sentence: "子供は片付けるそばから散らかす。", translation: "Children mess things up as soon as I clean them." },
        { sentence: "届いたそばから、開けてしまった。", translation: "As soon as it arrived, I opened it." },
      ],
      usageNotes: "~そばから expresses that one action happens immediately after another.",
    },
    description: "Example sentences use formal written context when そばから is typically used in casual speech.",
  },
  {
    id: 3,
    type: "user",
    title: "User harassment in chat",
    reason: "Harassment — offensive messages in study group",
    reporter: "Anna Kowalski",
    reporterEmail: "anna.k@mail.com",
    reported: "Ravi Sharma",
    reportedEmail: "ravi.s@mail.com",
    severity: "high",
    status: "pending",
    date: "5h ago",
    description: "Ravi Sharma has been repeatedly sending offensive messages in the N4 study group chat.",
  },
  {
    id: 4,
    type: "content",
    title: "Grammar: typo in example sentence",
    reason: "Typo in example sentence — already corrected",
    reporter: "Mei Lin Chen",
    reporterEmail: "mei.lin@mail.com",
    reported: "Park Joon-ho",
    reportedEmail: "joonho.p@midori.jp",
    severity: "low",
    status: "resolved",
    date: "3d ago",
    grammar: {
      pattern: "~わけがない",
      meaning: "There is no way ~ / It is impossible that ~",
      jlptLevel: "N2",
      examples: [{ sentence: "彼が犯人なわけがない。", translation: "There is no way he is the culprit." }],
      usageNotes: "Expresses strong denial or impossibility.",
    },
    description: "Typo in the second example sentence. Already corrected.",
  },
  {
    id: 5,
    type: "content",
    title: "Grammar: ~だらけ missing nuance explanation",
    reason: "Incomplete grammar explanation — missing nuance details",
    reporter: "Lucas Weber",
    reporterEmail: "lucas.w@mail.com",
    reported: "Shinji Abe",
    reportedEmail: "shinji.a@mail.com",
    severity: "medium",
    status: "pending",
    date: "1d ago",
    grammar: {
      pattern: "~だらけ",
      meaning: "Full of ~ / Covered in ~",
      jlptLevel: "N2",
      examples: [
        { sentence: "この文章はエラーだらけだ。", translation: "This text is full of errors." },
        { sentence: "血だらけのナイフが見つかった。", translation: "A knife covered in blood was found." },
      ],
      usageNotes: "~だらけ expresses that something is covered in or full of something undesirable.",
    },
    description: "The explanation does not mention that だらけ is almost always used with negative things.",
  },
  {
    id: 6,
    type: "user",
    title: "Fake teacher account",
    reason: "Duplicate/fake account — certificates match existing teacher",
    reporter: "System",
    reporterEmail: "system@midori.jp",
    reported: "Fake Teacher",
    reportedEmail: "fake.t@midori.jp",
    severity: "critical",
    status: "pending",
    date: "2d ago",
    description: "Account detected as duplicate. The teacher submitted certificates matching another existing teacher (Kenji Yamamoto).",
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<ReportSeverity, { label: string; bg: string; text: string; border: string }> = {
  critical: { label: "Critical", bg: "bg-[var(--status-rejected)]/12",  text: "text-[var(--status-rejected)]",  border: "border-[var(--status-rejected)]/25"  },
  high:     { label: "High",    bg: "bg-[var(--status-pending)]/12",  text: "text-[var(--status-pending)]",   border: "border-[var(--status-pending)]/25"  },
  medium:   { label: "Medium",  bg: "bg-[var(--status-pending)]/10", text: "text-[var(--status-pending)]",   border: "border-[var(--status-pending)]/20"  },
  low:      { label: "Low",     bg: "bg-primary/10",                   text: "text-primary",                    border: "border-primary/20"                    },
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; bg: string; text: string; border: string }> = {
  pending:   { label: "Pending",   bg: "badge-pending",   text: "text-[var(--status-pending)]", border: "border-[var(--status-pending)]/25" },
  resolved:  { label: "Resolved",  bg: "badge-approved",  text: "text-[var(--status-approved)]", border: "border-[var(--status-approved)]/25" },
  dismissed: { label: "Dismissed", bg: "bg-muted",       text: "text-muted-col",                border: "border-[var(--border)]"         },
};

const REJECT_REASONS = [
  "Content is accurate",
  "Report lacks sufficient detail",
  "Already resolved",
  "Duplicate report",
  "Wrong category",
  "Not a violation",
  "Other",
];

// ─── Toast ───────────────────────────────────────────────────────────────────

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
          {type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Approve Confirm Modal ───────────────────────────────────────────────────

function ApproveConfirmModal({ report, onConfirm, onClose }: {
  report: Report;
  onConfirm: (id: number) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onConfirm(report.id);
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
            <h3 className="font-display font-bold text-primary-col text-base">Resolve Report</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl glass-surface mb-4">
          <p className="text-sm font-semibold text-primary-col">{report.title}</p>
          <p className="text-xs text-muted-col mt-0.5">Reported by {report.reporter}</p>
        </div>

        <p className="text-xs text-secondary-col mb-5">
          This report will be marked as <span className="text-[var(--status-active)] font-semibold">Resolved</span>. The content will be reviewed and corrected.
        </p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/15 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/25 hover:bg-[var(--status-active)]/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resolving...</> : <><CheckCircle className="w-4 h-4" /> Confirm Resolve</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reject Modal ────────────────────────────────────────────────────────────

function RejectModal({ report, onConfirm, onClose }: {
  report: Report;
  onConfirm: (id: number, reason: string) => void;
  onClose: () => void;
}) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleReason = (r: string) => {
    setSelectedReasons(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const isOtherSelected = selectedReasons.includes("Other");
  const isValid = selectedReasons.length > 0 && (!isOtherSelected || detail.trim().length > 0);

  const handleConfirm = async () => {
    if (!isValid) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const reason = [
      ...selectedReasons.filter(r => r !== "Other"),
      isOtherSelected && detail.trim() ? `Other: ${detail}` : "",
    ].filter(Boolean).join("; ");
    onConfirm(report.id, reason);
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg max-h-[90vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div>
            <h3 className="font-display font-bold text-primary-col text-base">Dismiss Report</h3>
            <p className="text-xs text-muted-col mt-0.5">{report.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Report Info */}
          <div className="p-3 rounded-xl glass-surface">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${SEVERITY_CONFIG[report.severity].bg} ${SEVERITY_CONFIG[report.severity].text} ${SEVERITY_CONFIG[report.severity].border}`}>
                {report.severity}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-secondary-col capitalize border border-[var(--border)]">{report.type}</span>
            </div>
            <p className="text-sm font-semibold text-primary-col mb-1">{report.title}</p>
            <p className="text-xs text-muted-col">{report.reason}</p>
          </div>

          {/* Reason Checklist */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
              Select reason <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REJECT_REASONS.map(reason => {
                const checked = selectedReasons.includes(reason);
                return (
                  <button
                    key={reason}
                    onClick={() => toggleReason(reason)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition text-left ${
                        checked
                          ? "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
                          : "glass-surface text-secondary-col"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          checked ? "bg-[var(--status-rejected)] border-[var(--status-rejected)]" : "border-[var(--border)]"
                        }`}>
                        {checked && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      {reason}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Other detail */}
          {isOtherSelected && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                Description <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
              </label>
              <textarea
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="Please describe the issue in detail..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl input-glass text-sm placeholder:text-muted-col resize-none"
              />
            </motion.div>
          )}
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/25 hover:bg-[var(--status-rejected)]/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Dismissing...</>
              : <><XCircle className="w-4 h-4" /> Confirm Dismiss</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Report View Drawer ─────────────────────────────────────────────────────

function ReportViewDrawer({ report, onClose, onResolve, onDismiss }: {
  report: Report;
  onClose: () => void;
  onResolve: (id: number) => void;
  onDismiss: (id: number) => void;
}) {
  const sevCfg = SEVERITY_CONFIG[report.severity];
  const staCfg = STATUS_CONFIG[report.status];

  return (
    <>
      <motion.div className="fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      </motion.div>

      <motion.div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl glass-modal rounded-l-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-right"
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-muted-col uppercase tracking-wider">Report Details</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${sevCfg.bg} ${sevCfg.text} ${sevCfg.border}`}>
              {sevCfg.label}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${staCfg.bg} ${staCfg.text} ${staCfg.border}`}>
              {staCfg.label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-5">

          {/* Title & Type */}
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                report.type === "content" ? "bg-primary/15 text-primary" : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)]"
              }`}>
              {report.type === "content" ? <FileText className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-black text-primary-col text-xl leading-tight">{report.title}</h2>
              <p className="text-xs text-muted-col mt-0.5 capitalize">{report.type} Report</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl glass-surface">
              <div className="flex items-center gap-1.5 mb-2">
                <Flag className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">Reporter</span>
              </div>
              <p className="text-sm font-semibold text-primary-col">{report.reporter}</p>
              <p className="text-[10px] text-muted-col">{report.reporterEmail}</p>
            </div>
            <div className="p-3 rounded-xl glass-surface">
              <div className="flex items-center gap-1.5 mb-2">
                <Ban className="w-3 h-3 text-[var(--status-rejected)]" />
                <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">Reported</span>
              </div>
              <p className="text-sm font-semibold text-primary-col">{report.reported}</p>
              <p className="text-[10px] text-muted-col">{report.reportedEmail}</p>
            </div>
          </div>

          {/* Reason */}
          <div className="p-4 rounded-xl bg-[var(--status-rejected)]/8 border border-[var(--status-rejected)]/15">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-[var(--status-rejected)]" />
              <span className="text-xs font-bold text-[var(--status-rejected)]">Report Reason</span>
            </div>
            <p className="text-sm text-secondary-col leading-relaxed">{report.reason}</p>
          </div>

          {/* Description */}
          {report.description && (
            <div className="p-4 rounded-xl glass-surface">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-secondary-col">Additional Details</span>
              </div>
              <p className="text-sm text-secondary-col leading-relaxed">{report.description}</p>
            </div>
          )}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl glass-surface">
              <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Submitted</p>
              <p className="text-sm font-semibold text-primary-col">{report.date}</p>
            </div>
            <div className="p-3 rounded-xl glass-surface">
              <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Status</p>
              <p className={`text-sm font-semibold ${staCfg.text}`}>{staCfg.label}</p>
            </div>
          </div>

          {/* Grammar Content */}
          {report.grammar && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold text-secondary-col uppercase tracking-wider">Grammar Content</h4>
              </div>

              {/* Pattern Header */}
              <div className="p-4 rounded-xl bg-primary/8 border border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-1 rounded-xl bg-primary/20 text-primary text-sm font-black font-display">{report.grammar.pattern}</span>
                  <span className="px-2.5 py-1 rounded-xl bg-[var(--status-student)]/15 text-[var(--status-student)] text-xs font-bold">JLPT {report.grammar.jlptLevel}</span>
                </div>
                <p className="text-sm text-secondary-col font-medium">{report.grammar.meaning}</p>
              </div>

              {/* Examples */}
              <div>
                <h5 className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">Example Sentences</h5>
                <div className="space-y-2">
                  {report.grammar.examples.map((ex, i) => (
                    <div key={i} className="p-3 rounded-xl glass-surface">
                      <p className="text-sm text-primary-col font-medium mb-1">{ex.sentence}</p>
                      <p className="text-xs text-muted-col">{ex.translation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Notes */}
              {report.grammar.usageNotes && (
                <div className="p-3 rounded-xl bg-primary/8 border border-primary/15">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Usage Notes</span>
                  </div>
                  <p className="text-xs text-secondary-col leading-relaxed">{report.grammar.usageNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Bar */}
        {report.status === "pending" && (
          <div className="px-6 py-4 border-t separator bg-[var(--glass-bg)] backdrop-filter: blur(12px)">
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
                Close
              </button>
              <button
                onClick={() => onDismiss(report.id)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/20 hover:bg-[var(--status-rejected)]/20 transition flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Dismiss
              </button>
              <button
                onClick={() => onResolve(report.id)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Resolve
              </button>
            </div>
          </div>
        )}

        {report.status !== "pending" && (
          <div className="px-6 py-4 border-t separator bg-[var(--glass-bg)] backdrop-filter: blur(12px)">
            <button onClick={onClose} className="w-full py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
              Close
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/moderation")({ component: ModerationPage });

function ModerationPage() {
  const [reports, setReports] = useState(initialReports);
  const [tab, setTab] = useState<"pending" | "resolved">("pending");
  const [viewing, setViewing] = useState<Report | null>(null);
  const [approveTarget, setApproveTarget] = useState<Report | null>(null);
  const [dismissTarget, setDismissTarget] = useState<Report | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleResolve = useCallback((id: number) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "resolved" as ReportStatus } : r));
    showToast("Report resolved successfully!", "success");
  }, [showToast]);

  const handleDismiss = useCallback((id: number, _reason: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: "dismissed" as ReportStatus } : r));
    showToast("Report dismissed.", "error");
  }, [showToast]);

  const handleResolveConfirm = useCallback((id: number) => {
    handleResolve(id);
    setApproveTarget(null);
  }, [handleResolve]);

  const handleDismissConfirm = useCallback((id: number, reason: string) => {
    handleDismiss(id, reason);
    setDismissTarget(null);
  }, [handleDismiss]);

  const pendingReports = reports.filter(r => r.status === "pending");
  const resolvedReports = reports.filter(r => r.status !== "pending");
  const displayedReports = tab === "pending" ? pendingReports : resolvedReports;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Reports Center</h1>
          <p className="text-sm text-secondary-col mt-0.5">Handle user reports and flagged content</p>
        </div>
        {pendingReports.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-xs font-bold border border-[var(--status-rejected)]/20">
            <AlertTriangle className="w-3 h-3" />
            {pendingReports.length} report{pendingReports.length > 1 ? "s" : ""} need attention
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: "Total Reports",  value: reports.length,             color: "text-muted-col",       bg: "bg-muted" },
          { label: "Pending",        value: pendingReports.length,      color: "text-[var(--status-pending)]", bg: "bg-[var(--status-pending)]/12" },
          { label: "Resolved",       value: resolvedReports.filter(r => r.status === "resolved").length, color: "text-[var(--status-active)]",  bg: "bg-[var(--status-active)]/12" },
          { label: "Dismissed",      value: resolvedReports.filter(r => r.status === "dismissed").length, color: "text-muted-col",            bg: "bg-muted" },
        ].map(stat => {
          const Icon = stat.label === "Pending" ? AlertTriangle
                       : stat.label === "Resolved" ? CheckCircle
                       : stat.label === "Dismissed" ? XCircle : Flag;
          return (
            <div key={stat.label} className="card-base p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className={`w-7 h-7 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold">{stat.label}</span>
              </div>
              <div className="font-display font-black text-xl text-primary-col">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass-card p-1 w-fit">
        {(["pending", "resolved"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
              tab === t
                ? "bg-gradient-hero text-white shadow-md"
                : "text-secondary-col nav-item"
            }`}
          >
            {t === "pending" ? `Pending (${pendingReports.length})` : `Resolved (${resolvedReports.length})`}
          </button>
        ))}
      </div>

      {/* Report list */}
      <div className="space-y-3">
        {displayedReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 empty-state">
            <CheckCircle className="w-12 h-12 text-[var(--status-active)]/40 mb-3" />
            <p className="text-secondary-col font-semibold text-sm">
              {tab === "pending" ? "All caught up — no pending reports!" : "No resolved reports yet."}
            </p>
          </div>
        ) : (
          displayedReports.map((report, i) => {
            const sevCfg = SEVERITY_CONFIG[report.severity];
            const staCfg = STATUS_CONFIG[report.status];
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`card-base p-5 transition ${
                  report.severity === "critical" ? "border-[var(--status-rejected)]/30"
                  : report.severity === "high" ? "border-[var(--status-pending)]/25"
                  : "border-[var(--glass-border)]"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Severity badge */}
                  <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex-shrink-0 mt-0.5 ${sevCfg.bg} ${sevCfg.text} ${sevCfg.border}`}>
                    {sevCfg.label}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display font-bold text-primary-col text-sm">{report.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${staCfg.bg} ${staCfg.text} ${staCfg.border}`}>
                        {staCfg.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-secondary-col capitalize border border-[var(--border)]">{report.type}</span>
                    </div>
                    <p className="text-xs text-muted-col mb-2 line-clamp-1">{report.reason}</p>
                    <div className="flex items-center gap-4 text-[10px] text-muted-col">
                      <span className="flex items-center gap-1"><Flag className="w-3 h-3" />{report.reporter}</span>
                      <span className="flex items-center gap-1"><Ban className="w-3 h-3" />{report.reported}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{report.date}</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    {report.status === "pending" && (
                      <>
                        <button
                          onClick={() => setApproveTarget(report)}
                          className="p-2 rounded-xl bg-[var(--status-active)]/10 text-[var(--status-active)] hover:bg-[var(--status-active)]/20 transition"
                          title="Resolve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDismissTarget(report)}
                          className="p-2 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/20 transition"
                          title="Dismiss"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setViewing(report)}
                      className="p-2 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* View Drawer */}
      <AnimatePresence>
        {viewing && (
          <ReportViewDrawer
            report={viewing}
            onClose={() => setViewing(null)}
            onResolve={id => {
              const r = reports.find(x => x.id === id);
              if (r) setApproveTarget(r);
              setViewing(null);
            }}
            onDismiss={id => {
              const r = reports.find(x => x.id === id);
              if (r) setDismissTarget(r);
              setViewing(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Resolve Confirm Modal */}
      <AnimatePresence>
        {approveTarget && (
          <ApproveConfirmModal
            report={approveTarget}
            onConfirm={handleResolveConfirm}
            onClose={() => setApproveTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Dismiss Modal */}
      <AnimatePresence>
        {dismissTarget && (
          <RejectModal
            report={dismissTarget}
            onConfirm={handleDismissConfirm}
            onClose={() => setDismissTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toast?.message ?? ""} type={toast?.type ?? "success"} visible={!!toast} />
    </div>
  );
}
