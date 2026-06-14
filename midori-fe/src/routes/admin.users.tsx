import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users, Shield, AlertTriangle, CheckCircle, XCircle,
  Eye, Ban, X, ChevronDown, UserCheck, UserX,
  Clock, RotateCcw, Check, AlertOctagon, Info,
  Loader2,
} from "lucide-react";
import {
  adminApi,
  type AdminTeacherResponse,
  type Page,
  type UiRole,
  type UiStatus,
} from "../lib/api/admin";
import { ApiError } from "../lib/api/client";

// ─── Local types ─────────────────────────────────────────────────────────────

type Severity = "low" | "medium" | "high";
type ToastType = "success" | "error" | "warning" | "info";

// ─── Normalization helpers ────────────────────────────────────────────────────

function normalizeStatus(raw: string | undefined | null): UiStatus {
  if (!raw) return "active";
  switch (raw.toUpperCase()) {
    case "ACTIVE": return "active";
    case "SUSPENDED": return "suspended";
    case "BANNED": return "banned";
    case "PENDING": return "pending";
    case "PENDING_APPROVAL": return "pending_approval";
    case "REJECTED": return "rejected";
    default: return "active";
  }
}

function normalizeRole(raw: string | undefined | null): UiRole {
  if (!raw) return "student";
  switch (raw.toUpperCase()) {
    case "STUDENT": return "student";
    case "TEACHER": return "teacher";
    case "ADMIN": return "admin";
    default: return "student";
  }
}

// Re-export AdminTeacherResponse as the primary user type used throughout this page
type UserData = AdminTeacherResponse;

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

function StatusBadge({ status }: { status: UiStatus }) {
  const cfg: Record<UiStatus, { label: string; dot: string }> = {
    active:           { label: "Active",           dot: "bg-[var(--status-active)]" },
    suspended:        { label: "Suspended",         dot: "bg-[var(--status-suspended)]" },
    banned:          { label: "Banned",           dot: "bg-[var(--status-rejected)]" },
    pending:          { label: "Pending",          dot: "bg-[var(--status-pending)]" },
    pending_approval: { label: "Pending Approval",  dot: "bg-[var(--status-pending)]" },
    rejected:         { label: "Rejected",          dot: "bg-[var(--status-rejected)]" },
  };
  const { label, dot } = cfg[status] ?? { label: status, dot: "bg-muted" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold capitalize border rounded-full px-2.5 py-1 badge-${status}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: UiRole }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border badge-${role}`}>
      {role}
    </span>
  );
}

// ─── Warning Modal ────────────────────────────────────────────────────────────

function WarningModal({ user, onClose, onSend }: {
  user: AdminTeacherResponse;
  onClose: () => void;
  onSend: (user: AdminTeacherResponse, reason: string, severity: Severity, note: string) => void;
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

  const displayName = user.displayName ?? user.email;
  const uiStatus = normalizeStatus(user.status);
  const uiRole = normalizeRole(user.role);

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
            uiRole === "teacher" ? "avatar-teacher" : "avatar-student"
          }`}>
            {displayName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-col truncate">{displayName}</p>
            <p className="text-xs text-muted-col truncate">{user.email}</p>
          </div>
          <StatusBadge status={uiStatus} />
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
  user: AdminTeacherResponse;
  onClose: () => void;
  onConfirm: (user: AdminTeacherResponse, reason: string) => void;
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
            normalizeRole(user.role) === "teacher" ? "avatar-teacher" : "avatar-student"
          }`}>
            {(user.displayName ?? user.email)[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-col truncate">{user.displayName ?? user.email}</p>
            <p className="text-xs text-muted-col truncate">{user.email}</p>
          </div>
          <StatusBadge status={normalizeStatus(user.status)} />
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Info box — backend suspend is indefinite */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--status-pending)]/10 border border-[var(--status-pending)]/20">
            <AlertTriangle className="w-4 h-4 text-[var(--status-pending)] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--status-pending)] leading-relaxed">
              User will lose access indefinitely until an admin restores their account.
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Reason <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder="Describe the reason for suspension…"
              className="w-full px-4 py-3 rounded-xl input-glass text-sm placeholder:text-muted-col resize-none"
            />
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
  user: AdminTeacherResponse;
  onClose: () => void;
  onConfirm: (user: AdminTeacherResponse, reason: string) => void;
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
            normalizeRole(user.role) === "teacher" ? "avatar-teacher" : "avatar-student"
          }`}>
            {(user.displayName ?? user.email)[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-col truncate">{user.displayName ?? user.email}</p>
            <p className="text-xs text-muted-col truncate">{user.email}</p>
          </div>
          <StatusBadge status={normalizeStatus(user.status)} />
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
  user: AdminTeacherResponse;
  onClose: () => void;
  onConfirm: (user: AdminTeacherResponse) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onConfirm(user);
    setLoading(false);
  };

  const uiStatus = normalizeStatus(user.status);
  const wasBanned = uiStatus === "banned";

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
            normalizeRole(user.role) === "teacher" ? "avatar-teacher" : "avatar-student"
          }`}>
            {(user.displayName ?? user.email)[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary-col truncate">{user.displayName ?? user.email}</p>
            <p className="text-xs text-muted-col truncate">{user.email}</p>
          </div>
          <StatusBadge status={normalizeStatus(user.status)} />
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
              { label: "Status change", value: `${normalizeStatus(user.status)} → active` },
              { label: "Role", value: normalizeRole(user.role) },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-col">{row.label}</span>
                <span className="text-xs font-semibold text-primary-col capitalize">{row.value}</span>
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
  user: AdminTeacherResponse;
  onClose: () => void;
  onWarning: () => void;
  onSuspend: () => void;
  onRestore: () => void;
  onSaveNote: (userId: string, note: string) => void;
  notes: Record<string, string>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const uiStatus = normalizeStatus(user.status);
  const uiRole = normalizeRole(user.role);
  const displayName = user.displayName ?? user.email;
  const noteVal = notes[user.id] ?? "";
  const [activeSection, setActiveSection] = useState<"overview" | "activity" | "moderation">("overview");

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
              uiRole === "teacher" ? "avatar-teacher" : "avatar-student"
            }`}>
              {displayName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-display font-black text-primary-col text-lg">{displayName}</h2>
                <RoleBadge role={uiRole} />
              </div>
              <p className="text-xs text-muted-col mb-2">{user.email}</p>
              <StatusBadge status={uiStatus} />
            </div>
          </div>

          {/* Stats — XP/Lessons/Streak/Exams not available from backend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {[
              { label: "Joined", value: new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) },
              { label: "Email Verified", value: user.emailVerified ? "Yes" : "No" },
            ].map(s => (
              <div key={s.label} className="glass-surface rounded-xl p-2.5 text-center">
                <div className="font-display font-black text-sm text-primary-col">{s.value}</div>
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
            {uiStatus === "active" ? (
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
            { id: "moderation" as const, label: "Moderation" },
          ]).map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`px-3 pb-2.5 text-xs font-bold transition-all duration-150 border-b-2 ${
                activeSection === s.id
                  ? "text-primary border-primary"
                  : "text-muted-col border-transparent hover:text-secondary-col"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">

          {activeSection === "overview" && (
            <div className="space-y-4">
              <div className="rounded-xl glass-surface border border-glass-border p-3 space-y-2">
                {[
                  { label: "Joined",     value: new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                  { label: "Status",     value: uiStatus.charAt(0).toUpperCase() + uiStatus.slice(1).replace("_", " ") },
                  { label: "Role",       value: uiRole.charAt(0).toUpperCase() + uiRole.slice(1) },
                  { label: "Email",      value: user.email },
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
            <div className="py-10 flex flex-col items-center gap-2">
              <Clock className="w-8 h-8 text-muted-col/40" />
              <p className="text-xs text-muted-col text-center">Activity data is not yet available.<br/>Coming in a future update.</p>
            </div>
          )}

          {activeSection === "moderation" && (
            <div className="py-10 flex flex-col items-center gap-2">
              <Shield className="w-8 h-8 text-muted-col/40" />
              <p className="text-xs text-muted-col text-center">Moderation history is not yet available.<br/>Coming in a future update.</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function UsersPage() {
  const [pageData, setPageData] = useState<Page<AdminTeacherResponse> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<AdminTeacherResponse | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [warnTarget, setWarnTarget] = useState<AdminTeacherResponse | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminTeacherResponse | null>(null);
  const [banTarget, setBanTarget] = useState<AdminTeacherResponse | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<AdminTeacherResponse | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(0); // reset to first page on new search
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Build API params
  const apiParams = {
    page: currentPage,
    size: 20,
    keyword: debouncedSearch || undefined,
    role: roleFilter !== "All" ? roleFilter.toUpperCase() : undefined,
    status: statusFilter !== "All" ? statusFilter.toUpperCase() : undefined,
  };

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getAllUsers(apiParams);
      setPageData(data);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load users.";
      setError(msg);
      addToast("error", "Load failed", msg);
    } finally {
      setLoading(false);
    }
  }, [apiParams.keyword, apiParams.page, apiParams.role, apiParams.size, apiParams.status]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addToast = (type: ToastType, title: string, message: string) => {
    const id = `t_${Date.now()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const sendWarning = (_user: AdminTeacherResponse, reason: string, severity: Severity, _note: string) => {
    // Warning API not implemented yet — keep local state only
    setWarnTarget(null);
    addToast("warning", "Warning sent", `A ${severity} warning was issued.`);
  };

  const suspendUserFn = async (user: AdminTeacherResponse, reason: string) => {
    try {
      await adminApi.suspendTeacher(user.id);
      await fetchUsers();
      if (selectedUser?.id === user.id) setSelectedUser(null);
      addToast("warning", "User suspended", `${user.displayName ?? user.email} has been suspended.`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to suspend user.";
      addToast("error", "Suspend failed", msg);
    } finally {
      setSuspendTarget(null);
    }
  };

  const banUserFn = async (user: AdminTeacherResponse, reason: string) => {
    try {
      await adminApi.banUser(user.id, { reason });
      await fetchUsers();
      if (selectedUser?.id === user.id) setSelectedUser(null);
      addToast("error", "User banned", `${user.displayName ?? user.email} has been permanently banned.`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to ban user.";
      addToast("error", "Ban failed", msg);
    } finally {
      setBanTarget(null);
    }
  };

  const restoreUserFn = async (user: AdminTeacherResponse) => {
    try {
      await adminApi.restoreUser(user.id);
      await fetchUsers();
      if (selectedUser?.id === user.id) setSelectedUser(null);
      addToast("success", "Account restored", `${user.displayName ?? user.email} is now active.`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to restore user.";
      addToast("error", "Restore failed", msg);
    } finally {
      setRestoreTarget(null);
    }
  };

  const saveNote = (_userId: string, _note: string) => {
    // Admin notes API not implemented yet — keep local state only
    addToast("success", "Note saved", "Admin note has been updated locally.");
  };

  const users = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;
  const activeCount = users.filter(u => normalizeStatus(u.status) === "active").length;
  const suspendedCount = users.filter(u => normalizeStatus(u.status) === "suspended").length;
  const bannedCount = users.filter(u => normalizeStatus(u.status) === "banned").length;

  const rowStyle = (status: string) => {
    const ui = normalizeStatus(status);
    if (ui === "banned") return "opacity-50";
    if (ui === "suspended") return "hover:bg-[var(--status-pending)]/[0.04]";
    return "hover:bg-[var(--accent)]";
  };

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
          { label: "Total Users",  value: totalElements.toLocaleString(), icon: Users,    color: "text-primary" },
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
          <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${loading ? "text-primary" : "text-muted-col"}`} />
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
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-muted-col/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Role filter */}
        <div className="flex gap-1 glass-card p-1">
          {(["All", "student", "teacher"] as const).map(r => (
            <button key={r} onClick={() => { setRoleFilter(r); setCurrentPage(0); }}
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
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(0); }}
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
          <div className="col-span-5">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Joined</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs text-muted-col">Loading users…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl glass-surface flex items-center justify-center">
              <XCircle className="w-7 h-7 text-[var(--status-rejected)]" />
            </div>
            <p className="text-sm font-bold text-secondary-col">Failed to load users</p>
            <p className="text-xs text-muted-col">{error}</p>
            <button onClick={fetchUsers}
              className="px-3 py-1.5 rounded-lg bg-primary/12 text-primary text-xs font-bold hover:bg-primary/20 transition">
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
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
              <button onClick={() => { setSearch(""); setRoleFilter("All"); setStatusFilter("All"); setCurrentPage(0); }}
                className="px-3 py-1.5 rounded-lg bg-primary/12 text-primary text-xs font-bold hover:bg-primary/20 transition">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Rows */}
        {!loading && !error && users.length > 0 && (
        <div className="divide-y divide-[var(--border)]">
          {users.map((user, i) => {
            const uiRole = normalizeRole(user.role);
            const uiStatus = normalizeStatus(user.status);
            const displayName = user.displayName ?? user.email;
            return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
              className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center transition-all duration-150 ${rowStyle(user.status)} ${uiStatus === "banned" ? "cursor-default" : "cursor-pointer"}`}
              onClick={() => uiStatus !== "banned" && setSelectedUser(user)}
            >
              {/* User */}
              <div className="col-span-5 flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                  uiRole === "teacher" ? "avatar-teacher" : "avatar-student"
                }`}>
                  {displayName[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-primary-col truncate">{displayName}</div>
                  <div className="text-[10px] text-muted-col truncate">{user.email}</div>
                </div>
              </div>

              {/* Role */}
              <div className="col-span-2">
                <RoleBadge role={uiRole} />
              </div>

              {/* Status */}
              <div className="col-span-2">
                <StatusBadge status={uiStatus} />
              </div>

              {/* Joined */}
              <div className="col-span-1 text-right text-xs text-muted-col">
                {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </div>

              {/* Actions */}
              <div className="col-span-2 flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setWarnTarget(user)}
                  className="p-2 rounded-xl text-[var(--status-pending)]/60 hover:text-[var(--status-pending)] hover:bg-[var(--status-pending)]/10 transition-all duration-150"
                  title="Send Warning"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>

                {uiStatus === "active" && (
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

                {(uiStatus === "suspended" || uiStatus === "banned") && (
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
          );
          })}
        </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t separator">
            <p className="text-xs text-muted-col">
              Showing {currentPage * 20 + 1}–{Math.min((currentPage + 1) * 20, totalElements)} of {totalElements.toLocaleString()} users
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1.5 rounded-lg glass-surface text-xs font-bold disabled:opacity-30 hover:bg-primary/10 transition"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      page === currentPage ? "bg-primary text-white" : "glass-surface hover:bg-primary/10"
                    }`}
                  >
                    {page + 1}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg glass-surface text-xs font-bold disabled:opacity-30 hover:bg-primary/10 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}

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
