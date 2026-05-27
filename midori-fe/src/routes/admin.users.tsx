import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, Shield, AlertTriangle, CheckCircle, XCircle,
  Eye, Ban, X, ChevronDown, UserCheck, UserX,
  Clock, RotateCcw, Check, AlertOctagon, Info,
  Loader2,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type UserStatus = "active" | "suspended" | "banned";
type UserRole = "student" | "teacher";
type Severity = "low" | "medium" | "high";
type ToastType = "success" | "error" | "warning" | "info";

type Warning = {
  id: string;
  reason: string;
  severity: Severity;
  note: string;
  date: string;
  admin: string;
};

type ModAction = {
  id: string;
  type: "suspend" | "ban" | "restore";
  duration?: string;
  reason: string;
  date: string;
  admin: string;
};

type Activity = {
  id: string;
  title: string;
  desc: string;
  time: string;
  xp?: number;
  icon: string;
  type: "lesson" | "exam" | "warning" | "login" | "suspend" | "restore";
};

type UserData = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  xp: number;
  joined: string;
  lastActive: string;
  lessons: number;
  streak: number;
  examsCompleted: number;
  warnings: Warning[];
  modHistory: ModAction[];
  activities: Activity[];
  adminNotes: string;
  suspendedUntil?: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialUsers: UserData[] = [
  {
    id: "u1", name: "Yuki Tanaka", email: "yuki.t@mail.com", role: "student",
    status: "active", xp: 9840, joined: "Mar 2024", lastActive: "2h ago",
    lessons: 45, streak: 32, examsCompleted: 12,
    warnings: [
      { id: "w1", reason: "Spam activity", severity: "low", note: "Repeatedly posted the same content.", date: "Jan 2025", admin: "Admin" }
    ],
    modHistory: [],
    activities: [
      { id: "a1", title: "JLPT N3 Grammar", desc: "Completed りながら pattern", time: "2h ago", xp: 120, icon: "📖", type: "lesson" },
      { id: "a2", title: "N3 Vocab — 30 cards", desc: "Flashcard session", time: "4h ago", xp: 80, icon: "📚", type: "lesson" },
      { id: "a3", title: "Login", desc: "Web app", time: "5h ago", icon: "🔓", type: "login" },
    ],
    adminNotes: "",
  },
  {
    id: "u2", name: "Taro Yamamoto", email: "taro.y@midori.jp", role: "teacher",
    status: "active", xp: 12400, joined: "Jan 2023", lastActive: "1h ago",
    lessons: 87, streak: 210, examsCompleted: 0,
    warnings: [],
    modHistory: [
      { id: "m1", type: "restore", reason: "Appealed successfully — content verified safe.", date: "Nov 2024", admin: "Admin" }
    ],
    activities: [
      { id: "a1", title: "Content upload", desc: "Uploaded 5 grammar cards", time: "1h ago", icon: "📝", type: "lesson" },
      { id: "a2", title: "Student feedback", desc: "Reviewed 12 submissions", time: "3h ago", icon: "💬", type: "lesson" },
    ],
    adminNotes: "Trusted teacher. Previously suspended for impersonation claim — resolved.",
  },
  {
    id: "u3", name: "Sakura Hayashi", email: "sakura.h@mail.com", role: "student",
    status: "active", xp: 18420, joined: "Nov 2023", lastActive: "30m ago",
    lessons: 120, streak: 89, examsCompleted: 28,
    warnings: [
      { id: "w2", reason: "Harassment", severity: "high", note: "Targeted another student in chat.", date: "Dec 2024", admin: "Admin" }
    ],
    modHistory: [],
    activities: [
      { id: "a1", title: "Exam passed", desc: "N3 Mock Exam — Score: 78%", time: "30m ago", xp: 200, icon: "🏆", type: "exam" },
      { id: "a2", title: "Shadowing session", desc: "Dialogue 14 completed", time: "2h ago", xp: 150, icon: "🎤", type: "lesson" },
    ],
    adminNotes: "High-value user. Active contributor.",
  },
  {
    id: "u4", name: "Kenji Yamamoto", email: "kenji.y@mail.com", role: "teacher",
    status: "active", xp: 17250, joined: "Feb 2023", lastActive: "3h ago",
    lessons: 94, streak: 0, examsCompleted: 0,
    warnings: [], modHistory: [],
    activities: [{ id: "a1", title: "Vocabulary set", desc: "Created N2 vocab set", time: "3h ago", icon: "📝", type: "lesson" }],
    adminNotes: "",
  },
  {
    id: "u5", name: "Mei Lin Chen", email: "mei.lin@mail.com", role: "student",
    status: "suspended", xp: 16580, joined: "Dec 2023", lastActive: "2d ago",
    lessons: 78, streak: 65, examsCompleted: 18,
    suspendedUntil: "Jun 2025",
    warnings: [
      { id: "w3", reason: "Cheating", severity: "medium", note: "Screen-sharing during exam.", date: "May 2025", admin: "Admin" }
    ],
    modHistory: [
      { id: "m2", type: "suspend", duration: "30 days", reason: "Caught using screen-share during N3 mock exam.", date: "May 2025", admin: "Admin" }
    ],
    activities: [
      { id: "a1", title: "Suspension applied", desc: "30-day suspension", time: "2d ago", icon: "⏸", type: "suspend" },
    ],
    adminNotes: "Appeal pending — investigating.",
  },
  {
    id: "u6", name: "Alex Kim", email: "alex.k@mail.com", role: "student",
    status: "active", xp: 8750, joined: "Jun 2024", lastActive: "5h ago",
    lessons: 28, streak: 18, examsCompleted: 6,
    warnings: [], modHistory: [],
    activities: [{ id: "a1", title: "Grammar lesson", desc: "N4 Grammar — て form", time: "5h ago", xp: 80, icon: "📖", type: "lesson" }],
    adminNotes: "",
  },
  {
    id: "u7", name: "Sofia Martinez", email: "sofia.m@mail.com", role: "student",
    status: "active", xp: 7620, joined: "Apr 2024", lastActive: "1h ago",
    lessons: 38, streak: 22, examsCompleted: 8,
    warnings: [
      { id: "w4", reason: "Inappropriate content", severity: "low", note: "Shared off-topic media in discussion.", date: "Feb 2025", admin: "Admin" }
    ],
    modHistory: [],
    activities: [{ id: "a1", title: "Flashcard session", desc: "N4 Vocabulary 50 cards", time: "1h ago", xp: 100, icon: "📚", type: "lesson" }],
    adminNotes: "",
  },
  {
    id: "u8", name: "Ravi Sharma", email: "ravi.s@mail.com", role: "student",
    status: "banned", xp: 0, joined: "Jul 2024", lastActive: "1w ago",
    lessons: 5, streak: 0, examsCompleted: 0,
    warnings: [
      { id: "w5", reason: "Fake account", severity: "high", note: "Confirmed fake identity.", date: "Aug 2024", admin: "Admin" },
      { id: "w6", reason: "Spam activity", severity: "medium", note: "Bulk unsolicited messages.", date: "Aug 2024", admin: "Admin" }
    ],
    modHistory: [
      { id: "m3", type: "ban", reason: "Fake account with intent to spam.", date: "Aug 2024", admin: "Admin" }
    ],
    activities: [{ id: "a1", title: "Account banned", desc: "Permanent ban", time: "1w ago", icon: "🚫", type: "suspend" }],
    adminNotes: "Permanent ban — multiple fake accounts detected.",
  },
  {
    id: "u9", name: "Park Joon-ho", email: "joonho.p@midori.jp", role: "teacher",
    status: "active", xp: 14890, joined: "Mar 2023", lastActive: "2h ago",
    lessons: 112, streak: 0, examsCompleted: 0,
    warnings: [], modHistory: [],
    activities: [{ id: "a1", title: "Content review", desc: "Approved 8 grammar entries", time: "2h ago", icon: "✅", type: "lesson" }],
    adminNotes: "",
  },
  {
    id: "u10", name: "Anna Kowalski", email: "anna.k@mail.com", role: "student",
    status: "active", xp: 5820, joined: "Feb 2024", lastActive: "3h ago",
    lessons: 52, streak: 28, examsCompleted: 10,
    warnings: [], modHistory: [],
    activities: [{ id: "a1", title: "Listening practice", desc: "Business Japanese", time: "3h ago", xp: 60, icon: "🎧", type: "lesson" }],
    adminNotes: "",
  },
];

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

// ─── Toast ───────────────────────────────────────────────────────────────────

type Toast = { id: string; type: ToastType; title: string; message: string };

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl glass-modal min-w-72 max-w-96"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
              toast.type === "success" ? "bg-[var(--status-active)]/20 text-[var(--status-active)]"
              : toast.type === "error" ? "bg-[var(--status-rejected)]/20 text-[var(--status-rejected)]"
              : toast.type === "warning" ? "bg-[var(--status-pending)]/20 text-[var(--status-pending)]"
              : "bg-primary/20 text-primary"
            }`}>
              {toast.type === "success" ? <CheckCircle className="w-4 h-4" />
               : toast.type === "error" ? <XCircle className="w-4 h-4" />
               : toast.type === "warning" ? <AlertTriangle className="w-4 h-4" />
               : <Info className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary-col">{toast.title}</p>
              <p className="text-xs text-secondary-col mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => remove(toast.id)} className="flex-shrink-0 text-muted-col hover:text-primary transition p-0.5 -mr-1 -mt-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Severity Badge ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = severity === "high"
    ? { label: "High",    bg: "bg-[var(--status-rejected)]/12",  text: "text-[var(--status-rejected)]",  border: "border-[var(--status-rejected)]/25" }
    : severity === "medium"
    ? { label: "Medium", bg: "bg-[var(--status-pending)]/12",    text: "text-[var(--status-pending)]",    border: "border-[var(--status-pending)]/25" }
    : { label: "Low",    bg: "bg-primary/10",                    text: "text-primary",                    border: "border-primary/20" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {severity === "high" ? <AlertOctagon className="w-2.5 h-2.5" />
       : severity === "medium" ? <AlertTriangle className="w-2.5 h-2.5" />
       : <Info className="w-2.5 h-2.5" />}
      {cfg.label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: UserStatus }) {
  const cfg = {
    active:    { label: "Active",    dot: "bg-[var(--status-active)]" },
    suspended: { label: "Suspended", dot: "bg-[var(--status-suspended)]" },
    banned:    { label: "Banned",    dot: "bg-[var(--status-rejected)]" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold capitalize border rounded-full px-2.5 py-1 badge-${status}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border badge-${role}`}>
      {role}
    </span>
  );
}

// ─── Warning Modal ────────────────────────────────────────────────────────────

function WarningModal({ user, onClose, onSend }: {
  user: UserData;
  onClose: () => void;
  onSend: (user: UserData, reason: string, severity: Severity, note: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const sevCfg = {
    low:    { label: "Low",    bg: "bg-primary/10",        text: "text-primary",       border: "border-primary/20",    icon: Info },
    medium: { label: "Medium", bg: "bg-[var(--status-pending)]/12", text: "text-[var(--status-pending)]", border: "border-[var(--status-pending)]/25", icon: AlertTriangle },
    high:   { label: "High",   bg: "bg-[var(--status-rejected)]/12", text: "text-[var(--status-rejected)]", border: "border-[var(--status-rejected)]/25", icon: AlertOctagon },
  } as const;

  const handleSend = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onSend(user, reason.trim(), severity, note.trim());
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--status-pending)]/15 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[var(--status-pending)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary-col text-base">Send Warning</h3>
              <p className="text-xs text-muted-col">Issue a warning to this user</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User chip */}
        <div className="mx-6 mt-4 p-3 rounded-xl glass-surface flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
            user.role === "teacher" ? "avatar-teacher" : "avatar-student"
          }`}>
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-col truncate">{user.name}</p>
            <p className="text-xs text-muted-col truncate">{user.email}</p>
          </div>
          <StatusBadge status={user.status} />
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Severity */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2.5">
              Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as Severity[]).map(s => {
                const cfg2 = sevCfg[s];
                const Icon = cfg2.icon;
                return (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 border ${
                      severity === s
                        ? `${cfg2.bg} ${cfg2.text} ${cfg2.border} shadow-sm`
                        : "glass-surface text-secondary-col"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cfg2.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Reason <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl input-glass text-sm appearance-none cursor-pointer"
            >
              <option value="">Select a reason…</option>
              <option value="Spam activity">Spam activity</option>
              <option value="Inappropriate content">Inappropriate content</option>
              <option value="Harassment">Harassment</option>
              <option value="Fake account">Fake account</option>
              <option value="Cheating">Cheating</option>
              <option value="Abuse of platform">Abuse of platform</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Note <span className="normal-case font-normal text-muted-col/60">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Additional context about this warning…"
              className="w-full px-4 py-3 rounded-xl input-glass text-sm placeholder:text-muted-col resize-none"
            />
          </div>

          {/* Preview */}
          {reason && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${sevCfg[severity].bg} ${sevCfg[severity].text} ${sevCfg[severity].border}`}
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="text-xs font-bold">
                {sevCfg[severity].label} warning — {reason}
              </span>
            </motion.div>
          )}
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-pending)]/15 text-[var(--status-pending)] text-sm font-bold border border-[var(--status-pending)]/25 hover:bg-[var(--status-pending)]/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
              : <><AlertTriangle className="w-4 h-4" /> Send Warning</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Suspend Modal ────────────────────────────────────────────────────────────

const DURATIONS = [
  { label: "1 day",   days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
];

function SuspendModal({ user, onClose, onConfirm }: {
  user: UserData;
  onClose: () => void;
  onConfirm: (user: UserData, duration: string, reason: string) => void;
}) {
  const [duration, setDuration] = useState("7 days");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onConfirm(user, duration, reason.trim());
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--status-suspended)]/15 flex items-center justify-center">
              <UserX className="w-5 h-5 text-[var(--status-suspended)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary-col text-base">Suspend User</h3>
              <p className="text-xs text-muted-col">Temporarily restrict access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mx-6 mt-4 p-3 rounded-xl glass-surface flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
            user.role === "teacher" ? "avatar-teacher" : "avatar-student"
          }`}>
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-col truncate">{user.name}</p>
            <p className="text-xs text-muted-col truncate">{user.email}</p>
          </div>
          <StatusBadge status={user.status} />
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Duration */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2.5">
              Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.label}
                  onClick={() => setDuration(d.label)}
                  className={`py-2.5 rounded-xl text-xs font-bold capitalize transition-all duration-200 border ${
                    duration === d.label
                      ? "bg-[var(--status-pending)]/15 text-[var(--status-pending)] border-[var(--status-pending)]/40 shadow-sm"
                      : "glass-surface text-secondary-col"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Reason <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Describe the reason for suspension…"
              className="w-full px-4 py-3 rounded-xl input-glass text-sm placeholder:text-muted-col resize-none"
            />
          </div>

          {/* Info box */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--status-pending)]/10 border border-[var(--status-pending)]/20">
            <AlertTriangle className="w-4 h-4 text-[var(--status-pending)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--status-pending)] leading-relaxed">
              User will lose access for <strong>{duration}</strong>. Can be restored at any time from the Users panel.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-pending)]/15 text-[var(--status-pending)] text-sm font-bold border border-[var(--status-pending)]/25 hover:bg-[var(--status-pending)]/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Suspending…</>
              : <><UserX className="w-4 h-4" /> Suspend User</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Ban Modal ────────────────────────────────────────────────────────────────

function BanModal({ user, onClose, onConfirm }: {
  user: UserData;
  onClose: () => void;
  onConfirm: (user: UserData, reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onConfirm(user, reason.trim());
    setLoading(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--status-rejected)]/15 flex items-center justify-center">
              <Ban className="w-5 h-5 text-[var(--status-rejected)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary-col text-base">Permanently Ban User</h3>
              <p className="text-xs text-muted-col">This action cannot be easily undone</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mx-6 mt-4 p-3 rounded-xl glass-surface flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
            user.role === "teacher" ? "avatar-teacher" : "avatar-student"
          }`}>
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-col truncate">{user.name}</p>
            <p className="text-xs text-muted-col truncate">{user.email}</p>
          </div>
          <StatusBadge status={user.status} />
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Reason <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder="Explain why this account is being permanently banned…"
              className="w-full px-4 py-3 rounded-xl input-glass text-sm placeholder:text-muted-col resize-none"
            />
          </div>

          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--status-rejected)]/10 border border-[var(--status-rejected)]/20">
            <Ban className="w-4 h-4 text-[var(--status-rejected)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--status-rejected)] leading-relaxed">
              This will <strong>permanently ban</strong> the account. The user will lose all access immediately. This action can be reversed by another admin.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/25 hover:bg-[var(--status-rejected)]/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Banning…</>
              : <><Ban className="w-4 h-4" /> Ban User</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Restore Modal ────────────────────────────────────────────────────────────

function RestoreModal({ user, onClose, onConfirm }: {
  user: UserData;
  onClose: () => void;
  onConfirm: (user: UserData) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onConfirm(user);
    setLoading(false);
  };

  const wasBanned = user.status === "banned";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--status-active)]/15 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-[var(--status-active)]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-primary-col text-base">Restore Account</h3>
              <p className="text-xs text-muted-col">Reactivate this user's access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mx-6 mt-4 p-3 rounded-xl glass-surface flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
            user.role === "teacher" ? "avatar-teacher" : "avatar-student"
          }`}>
            {user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-col truncate">{user.name}</p>
            <p className="text-xs text-muted-col truncate">{user.email}</p>
          </div>
          <StatusBadge status={user.status} />
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--status-active)]/10 border border-[var(--status-active)]/20">
            <CheckCircle className="w-4 h-4 text-[var(--status-active)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--status-active)] leading-relaxed">
              {wasBanned
                ? "This will lift the permanent ban. User will regain full access immediately."
                : "This will lift the suspension. User's access will be restored immediately."
              }
            </p>
          </div>

          <div className="p-3 rounded-xl glass-surface space-y-1.5">
            {[
              { label: "Status change", value: `${user.status} → active` },
              { label: "XP", value: user.xp.toLocaleString() },
              { label: "Warnings", value: `${user.warnings.length} on record` },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-col">{row.label}</span>
                <span className="text-xs font-semibold text-primary-col">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/15 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/25 hover:bg-[var(--status-active)]/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Restoring…</>
              : <><CheckCircle className="w-4 h-4" /> Restore Account</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────

function UserDetailDrawer({ user, onClose, onWarning, onSuspend, onRestore, onSaveNote, notes, setNotes }: {
  user: UserData;
  onClose: () => void;
  onWarning: () => void;
  onSuspend: () => void;
  onRestore: () => void;
  onSaveNote: (userId: string, note: string) => void;
  notes: Record<string, string>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const noteVal = notes[user.id] ?? user.adminNotes;
  const [activeSection, setActiveSection] = useState<"overview" | "activity" | "moderation">("overview");

  const actCfg: Record<Activity["type"], string> = {
    lesson:   "bg-primary/15 text-primary",
    exam:     "bg-[var(--status-active)]/15 text-[var(--status-active)]",
    warning:  "bg-[var(--status-pending)]/15 text-[var(--status-pending)]",
    login:    "bg-muted text-muted-col",
    suspend:  "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)]",
    restore:  "bg-[var(--status-active)]/15 text-[var(--status-active)]",
  };

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 overlay-dark" onClick={onClose} />
      </motion.div>

      <motion.div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md glass-modal rounded-l-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-right"
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b separator">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-muted-col uppercase tracking-wider">User Details</span>
            <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-start gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0 ${
              user.role === "teacher" ? "avatar-teacher" : "avatar-student"
            }`}>
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-display font-black text-primary-col text-lg">{user.name}</h2>
                <RoleBadge role={user.role} />
              </div>
              <p className="text-xs text-muted-col mb-2">{user.email}</p>
              <StatusBadge status={user.status} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { label: "XP", value: user.xp.toLocaleString() },
              { label: "Lessons", value: user.lessons },
              { label: "Streak", value: `${user.streak}d` },
              { label: "Exams", value: user.examsCompleted },
            ].map(s => (
              <div key={s.label} className="glass-surface rounded-xl p-2.5 text-center">
                <div className="font-display font-black text-base text-primary-col">{s.value}</div>
                <div className="text-[9px] text-muted-col uppercase tracking-wider font-bold mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <button onClick={onWarning}
              className="flex-1 py-2.5 rounded-xl bg-[var(--status-pending)]/12 text-[var(--status-pending)] text-xs font-bold border border-[var(--status-pending)]/20 hover:bg-[var(--status-pending)]/20 transition flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Warn
            </button>
            {user.status === "active" ? (
              <button onClick={onSuspend}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] text-xs font-bold border border-[var(--status-rejected)]/20 hover:bg-[var(--status-rejected)]/20 transition flex items-center justify-center gap-1.5">
                <UserX className="w-4 h-4" /> Suspend
              </button>
            ) : (
              <button onClick={onRestore}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-xs font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition flex items-center justify-center gap-1.5">
                <RotateCcw className="w-4 h-4" /> Restore
              </button>
            )}
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex items-end gap-1 px-6 pt-3 pb-0 border-b separator">
          {([
            { id: "overview" as const, label: "Overview" },
            { id: "activity" as const, label: "Activity" },
            { id: "moderation" as const, label: "Moderation", count: user.warnings.length },
          ]).map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`px-3 pb-2.5 text-xs font-bold transition-all duration-150 border-b-2 ${
                activeSection === s.id
                  ? "text-primary border-primary"
                  : "text-muted-col border-transparent hover:text-secondary-col"
              }`}
            >
              {s.label}
              {s.count ? (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--status-pending)]/20 text-[var(--status-pending)] text-[9px] font-black">
                  {s.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">

          {activeSection === "overview" && (
            <div className="space-y-4">
              <div className="rounded-xl glass-surface border border-glass-border p-3 space-y-2">
                {[
                  { label: "Joined",     value: user.joined },
                  { label: "Last Active", value: user.lastActive },
                  { label: "Warnings",   value: `${user.warnings.length} issued` },
                  { label: "Mod Actions", value: `${user.modHistory.length} on record` },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-col">{row.label}</span>
                    <span className="text-xs font-semibold text-primary-col">{row.value}</span>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-secondary-col">Admin Notes</span>
                  <span className="text-[9px] text-muted-col/60">(internal only)</span>
                </div>
                <textarea
                  value={noteVal}
                  onChange={e => setNotes(prev => ({ ...prev, [user.id]: e.target.value }))}
                  rows={3}
                  placeholder="Add internal notes about this user…"
                  className="w-full px-3 py-2.5 rounded-xl input-glass text-sm placeholder:text-muted-col resize-none"
                />
                <button onClick={() => onSaveNote(user.id, noteVal)}
                  className="mt-2 w-full py-2 rounded-xl bg-primary/12 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Save Note
                </button>
              </div>
            </div>
          )}

          {activeSection === "activity" && (
            <div className="space-y-2">
              {user.activities.length === 0 ? (
                <div className="py-10 flex flex-col items-center gap-2">
                  <Clock className="w-8 h-8 text-muted-col/40" />
                  <p className="text-xs text-muted-col">No activity recorded yet.</p>
                </div>
              ) : (
                user.activities.map((act, i) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-3 p-3 rounded-xl glass-surface"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${actCfg[act.type]}`}>
                      {act.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-primary-col">{act.title}</p>
                        {act.xp && <span className="text-[10px] font-bold text-primary">+{act.xp} XP</span>}
                      </div>
                      <p className="text-[10px] text-muted-col mt-0.5">{act.desc}</p>
                    </div>
                    <span className="text-[9px] text-muted-col flex-shrink-0">{act.time}</span>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeSection === "moderation" && (
            <div className="space-y-5">
              {/* Warnings */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[var(--status-pending)]" />
                  <span className="text-xs font-bold text-secondary-col">Warnings ({user.warnings.length})</span>
                </div>
                {user.warnings.length === 0 ? (
                  <p className="text-xs text-muted-col px-1">No warnings issued.</p>
                ) : (
                  <div className="space-y-2">
                    {user.warnings.map(w => (
                      <div key={w.id} className="p-3 rounded-xl glass-surface">
                        <div className="inline-flex items-center gap-2 mb-1.5">
                          <SeverityBadge severity={w.severity} />
                          <span className="text-xs font-semibold text-primary-col">{w.reason}</span>
                        </div>
                        {w.note && <p className="text-[10px] text-muted-col mb-1.5">{w.note}</p>}
                        <p className="text-[9px] text-muted-col/60">{w.date} · by {w.admin}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mod History */}
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-secondary-col">Mod Actions ({user.modHistory.length})</span>
                </div>
                {user.modHistory.length === 0 ? (
                  <p className="text-xs text-muted-col px-1">No moderation actions on record.</p>
                ) : (
                  <div className="space-y-2">
                    {user.modHistory.map(m => (
                      <div key={m.id} className={`p-3 rounded-xl glass-surface border ${
                        m.type === "ban" ? "bg-[var(--status-rejected)]/8 border-[var(--status-rejected)]/15"
                        : m.type === "suspend" ? "bg-[var(--status-pending)]/8 border-[var(--status-pending)]/15"
                        : "bg-[var(--status-active)]/8 border-[var(--status-active)]/15"
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          {m.type === "ban" && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--status-rejected)]"><Ban className="w-3 h-3" /> Permanently banned</span>}
                          {m.type === "suspend" && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--status-pending)]"><UserX className="w-3 h-3" /> Suspended {m.duration}</span>}
                          {m.type === "restore" && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--status-active)]"><RotateCcw className="w-3 h-3" /> Restored</span>}
                        </div>
                        <p className="text-[10px] text-muted-col mb-1">{m.reason}</p>
                        <p className="text-[9px] text-muted-col/60">{m.date} · by {m.admin}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function UsersPage() {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [warnTarget, setWarnTarget] = useState<UserData | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<UserData | null>(null);
  const [banTarget, setBanTarget] = useState<UserData | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<UserData | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    setSearchLoading(true);
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const addToast = (type: ToastType, title: string, message: string) => {
    const id = `t_${Date.now()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const filtered = users.filter(u => {
    const q = debouncedSearch.toLowerCase();
    const match = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return match && (roleFilter === "All" || u.role === roleFilter) && (statusFilter === "All" || u.status === statusFilter);
  });

  const sendWarning = (user: UserData, reason: string, severity: Severity, note: string) => {
    const newWarning: Warning = {
      id: `w_${Date.now()}`, reason, severity, note,
      date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      admin: "Admin",
    };
    setUsers(prev => prev.map(u => u.id === user.id ? {
      ...u,
      warnings: [newWarning, ...u.warnings],
      activities: [
        { id: `act_${Date.now()}`, title: "Warning issued", desc: `${severity} — ${reason}`, time: "Just now", icon: "⚠️", type: "warning" },
        ...u.activities,
      ],
    } : u));
    setWarnTarget(null);
    addToast("warning", "Warning sent", `${user.name} received a ${severity} warning.`);
  };

  const suspendUserFn = (user: UserData, duration: string, reason: string) => {
    const until = new Date(); until.setDate(until.getDate() + (duration === "1 day" ? 1 : duration === "7 days" ? 7 : 30));
    const untilStr = until.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    setUsers(prev => prev.map(u => u.id === user.id ? {
      ...u, status: "suspended", suspendedUntil: untilStr,
      modHistory: [{ id: `mod_${Date.now()}`, type: "suspend", duration, reason, date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }), admin: "Admin" }, ...u.modHistory],
      activities: [{ id: `act_${Date.now()}`, title: "Suspended", desc: `${duration} suspension`, time: "Just now", icon: "⏸", type: "suspend" }, ...u.activities],
    } : u));
    if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, status: "suspended", suspendedUntil: untilStr } : null);
    setSuspendTarget(null);
    addToast("warning", "User suspended", `${user.name} is suspended for ${duration}.`);
  };

  const banUserFn = (user: UserData, reason: string) => {
    setUsers(prev => prev.map(u => u.id === user.id ? {
      ...u, status: "banned",
      modHistory: [{ id: `mod_${Date.now()}`, type: "ban", reason, date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }), admin: "Admin" }, ...u.modHistory],
      activities: [{ id: `act_${Date.now()}`, title: "Permanently banned", desc: reason, time: "Just now", icon: "🚫", type: "suspend" }, ...u.activities],
    } : u));
    if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, status: "banned" } : null);
    setBanTarget(null);
    addToast("error", "User banned", `${user.name} has been permanently banned.`);
  };

  const restoreUserFn = (user: UserData) => {
    setUsers(prev => prev.map(u => u.id === user.id ? {
      ...u, status: "active", suspendedUntil: undefined,
      modHistory: [{ id: `mod_${Date.now()}`, type: "restore", reason: "Restored by admin", date: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }), admin: "Admin" }, ...u.modHistory],
      activities: [{ id: `act_${Date.now()}`, title: "Account restored", desc: "Status → Active", time: "Just now", icon: "🔓", type: "restore" }, ...u.activities],
    } : u));
    if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, status: "active", suspendedUntil: undefined } : null);
    setRestoreTarget(null);
    addToast("success", "Account restored", `${user.name} is now active.`);
  };

  const saveNote = (userId: string, note: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, adminNotes: note } : u));
    if (selectedUser?.id === userId) setSelectedUser(prev => prev ? { ...prev, adminNotes: note } : null);
    addToast("success", "Note saved", "Admin note has been updated.");
  };

  const activeCount = users.filter(u => u.status === "active").length;
  const suspendedCount = users.filter(u => u.status === "suspended").length;
  const bannedCount = users.filter(u => u.status === "banned").length;

  const rowStyle = (status: UserStatus) =>
    status === "banned" ? "opacity-50"
    : status === "suspended" ? "hover:bg-[var(--status-pending)]/[0.04]"
    : "hover:bg-[var(--accent)]";

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">User Management</h1>
          <p className="text-sm text-secondary-col mt-0.5">Manage users, roles, and account status</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-card text-secondary-col text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[var(--status-active)] shadow-sm shadow-[var(--status-active)]/50" />
          {activeCount} active
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: "Total Users",  value: "12,847",  icon: Users,    color: "text-primary" },
          { label: "Active Users", value: activeCount.toString(), icon: UserCheck, color: "text-[var(--status-active)]" },
          { label: "Suspended",    value: suspendedCount.toString(), icon: UserX,  color: "text-[var(--status-suspended)]" },
          { label: "Banned",       value: bannedCount.toString(),   icon: Ban,     color: "text-[var(--status-rejected)]" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-base p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg glass-surface flex items-center justify-center">
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <span className="text-[10px] text-muted-col uppercase tracking-wider font-bold">{stat.label}</span>
              </div>
              <div className="font-display font-black text-xl text-primary-col">{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="flex-1 min-w-52 relative">
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${searchLoading ? "text-primary" : "text-muted-col"}`} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-8 py-2.5 rounded-xl search-input text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-col hover:text-primary-col transition">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {searchLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-muted-col/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Role filter */}
        <div className="flex gap-1 glass-card p-1">
          {(["All", "student", "teacher"] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
                roleFilter === r
                  ? "bg-gradient-hero text-white shadow-md"
                  : "text-secondary-col nav-item"
              }`}>
              {r}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="pl-3 pr-8 py-2.5 rounded-xl search-input text-xs font-bold appearance-none cursor-pointer">
            {["All", "active", "suspended", "banned"].map(s =>
              <option key={s} value={s} className="bg-[var(--popover)]">{s === "All" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            )}
          </select>
          <ChevronDown className="w-3 h-3 text-muted-col absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto min-w-[700px]">

        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
          <div className="col-span-4">User</div>
          <div className="col-span-1">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">XP</div>
          <div className="col-span-1 text-right">Joined</div>
          <div className="col-span-1 text-center">Active</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Empty */}
        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl glass-surface flex items-center justify-center">
              <Users className="w-7 h-7 text-muted-col/40" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-secondary-col">No users found</p>
              <p className="text-xs text-muted-col mt-0.5">
                {search ? `No results for "${search}"` : "No users match the selected filters."}
              </p>
            </div>
            {(search || roleFilter !== "All" || statusFilter !== "All") && (
              <button onClick={() => { setSearch(""); setRoleFilter("All"); setStatusFilter("All"); }}
                className="px-3 py-1.5 rounded-lg bg-primary/12 text-primary text-xs font-bold hover:bg-primary/20 transition">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        <div className="divide-y divide-[var(--border)]">
          {filtered.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center transition-all duration-150 ${rowStyle(user.status)} ${user.status === "banned" ? "cursor-default" : "cursor-pointer"}`}
              onClick={() => user.status !== "banned" && setSelectedUser(user)}
            >
              {/* User */}
              <div className="col-span-4 flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                  user.role === "teacher" ? "avatar-teacher" : "avatar-student"
                }`}>
                  {user.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-primary-col truncate">{user.name}</div>
                  <div className="text-[10px] text-muted-col truncate">{user.email}</div>
                </div>
                {user.warnings.length > 0 && (
                  <div className="w-5 h-5 rounded-full bg-[var(--status-pending)]/20 border border-[var(--status-pending)]/25 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-black text-[var(--status-pending)]">{user.warnings.length}</span>
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="col-span-1">
                <RoleBadge role={user.role} />
              </div>

              {/* Status */}
              <div className="col-span-2">
                <StatusBadge status={user.status} />
              </div>

              {/* XP */}
              <div className="col-span-1 text-right">
                {user.xp > 0 ? (
                  <span className="text-sm font-display font-bold text-primary-col">{user.xp.toLocaleString()}</span>
                ) : (
                  <span className="text-sm text-muted-col">—</span>
                )}
              </div>

              {/* Joined */}
              <div className="col-span-1 text-right text-xs text-muted-col">{user.joined}</div>

              {/* Last Active */}
              <div className="col-span-1 text-center text-xs text-muted-col">{user.lastActive}</div>

              {/* Actions */}
              <div className="col-span-2 flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setWarnTarget(user)}
                  className="p-2 rounded-xl text-[var(--status-pending)]/60 hover:text-[var(--status-pending)] hover:bg-[var(--status-pending)]/10 transition-all duration-150"
                  title="Send Warning"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>

                {user.status === "active" && (
                  <>
                    <button
                      onClick={() => setSuspendTarget(user)}
                      className="p-2 rounded-xl text-[var(--status-suspended)]/60 hover:text-[var(--status-suspended)] hover:bg-[var(--status-suspended)]/10 transition-all duration-150"
                      title="Suspend"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setBanTarget(user)}
                      className="p-2 rounded-xl text-[var(--status-rejected)]/60 hover:text-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/10 transition-all duration-150"
                      title="Ban"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </>
                )}

                {(user.status === "suspended" || user.status === "banned") && (
                  <button
                    onClick={() => setRestoreTarget(user)}
                    className="p-2 rounded-xl text-[var(--status-active)]/60 hover:text-[var(--status-active)] hover:bg-[var(--status-active)]/10 transition-all duration-150"
                    title="Restore"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => setSelectedUser(user)}
                  className="p-2 rounded-xl text-primary/60 hover:text-primary hover:bg-primary/10 transition-all duration-150"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        </div>
        </div>

      {/* Modals */}
      <AnimatePresence>
        {warnTarget && (
          <WarningModal user={warnTarget} onClose={() => setWarnTarget(null)} onSend={sendWarning} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {suspendTarget && (
          <SuspendModal user={suspendTarget} onClose={() => setSuspendTarget(null)} onConfirm={suspendUserFn} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {banTarget && (
          <BanModal user={banTarget} onClose={() => setBanTarget(null)} onConfirm={banUserFn} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {restoreTarget && (
          <RestoreModal user={restoreTarget} onClose={() => setRestoreTarget(null)} onConfirm={restoreUserFn} />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetailDrawer
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onWarning={() => { setWarnTarget(selectedUser); setSelectedUser(null); }}
            onSuspend={() => { setSuspendTarget(selectedUser); setSelectedUser(null); }}
            onRestore={() => { setRestoreTarget(selectedUser); setSelectedUser(null); }}
            onSaveNote={saveNote}
            notes={adminNotes}
            setNotes={setAdminNotes}
          />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} remove={removeToast} />
    </div>
  );
}
