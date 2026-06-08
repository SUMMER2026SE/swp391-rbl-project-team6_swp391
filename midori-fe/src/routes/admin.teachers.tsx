import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Clock, Eye, AlertTriangle,
  MapPin, Mail, Calendar, Briefcase, BookOpen, Award,
  Download, X, ChevronLeft, ZoomIn, Loader2, UserCheck,
  InboxIcon, AlertCircle
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminUserResponse } from "@/lib/api/admin";

// ─── Types ───────────────────────────────────────────────────────────────────

type Certificate = {
  id: string;
  name: string;
  issuedYear: number;
  issuedBy: string;
  type: "image" | "pdf";
  url: string;
  thumbnailUrl?: string;
};

type TeacherApplication = {
  id: string;
  name: string;
  email: string;
  location: string;
  bio: string;
  experience: string;
  specialization: string;
  jlptLevel: string;
  appliedDate: string;
  status: "pending" | "approved" | "rejected";
  certificates: Certificate[];
};

// Map backend AdminUserResponse to display-friendly TeacherApplication
function mapToTeacherApplication(user: AdminUserResponse): TeacherApplication {
  const emailName = user.email.split("@")[0];
  const nameParts = emailName.split(/[._]/).map(p =>
    p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
  );
  return {
    id: user.id,
    name: nameParts.join(" ") || emailName,
    email: user.email,
    location: "—",
    bio: "—",
    experience: "—",
    specialization: "—",
    jlptLevel: "—",
    appliedDate: user.createdAt
      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(user.createdAt))
      : "—",
    status: "pending",
    certificates: [],
  };
}

// ─── Avatar color helper ─────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "from-purple-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-teal-500",
  "from-orange-500 to-yellow-500",
  "from-red-500 to-pink-500",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Certificate Preview Modal ────────────────────────────────────────────────

function CertificatePreviewModal({
  certificate,
  onClose,
}: {
  certificate: Certificate;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-3xl max-h-[90vh] glass-modal rounded-2xl border border-glass-border shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div>
            <h3 className="font-display font-bold text-primary-col text-base">{certificate.name}</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {certificate.issuedBy} · {certificate.issuedYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {certificate.type === "pdf" && (
              <a
                href={certificate.url}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] text-xs font-bold border border-[var(--status-rejected)]/20 hover:bg-[var(--status-rejected)]/20 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          {certificate.type === "image" ? (
            <img
              src={certificate.url}
              alt={certificate.name}
              className="max-w-full max-h-[60vh] rounded-xl object-contain"
            />
          ) : (
            <div className="w-full h-80 flex flex-col items-center justify-center rounded-xl border border-glass-border glass-surface gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--status-rejected)]/15 flex items-center justify-center">
                <span className="text-[var(--status-rejected)] font-black text-xl font-display">PDF</span>
              </div>
              <p className="text-muted-col text-sm">PDF preview not available in browser.</p>
              <a
                href={certificate.url}
                download
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/20 hover:bg-[var(--status-rejected)]/20 transition"
              >
                <Download className="w-4 h-4" /> Download to view
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reject Modal ────────────────────────────────────────────────────────────

const REJECT_REASONS = [
  "Certificate not valid",
  "Experience insufficient",
  "JLPT level mismatch",
  "Bio / profile incomplete",
  "Duplicate application",
  "Policy violation",
  "Other",
];

function RejectModal({
  teacher,
  onConfirm,
  onClose,
  loading = false,
}: {
  teacher: TeacherApplication;
  onConfirm: (id: string, reason: string) => void;
  onClose: () => void;
  loading?: boolean;
}) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [detail, setDetail] = useState("");

  const toggleReason = (r: string) => {
    setSelectedReasons(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const isOtherSelected = selectedReasons.includes("Other");
  const isValid = selectedReasons.length > 0 && (!isOtherSelected || detail.trim().length > 0);

  const handleConfirm = async () => {
    if (!isValid) return;
    const reason = [
      ...selectedReasons.filter(r => r !== "Other"),
      isOtherSelected && detail.trim() ? `Other: ${detail}` : "",
    ]
      .filter(Boolean)
      .join("; ");
    onConfirm(teacher.id, reason);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg max-h-[90vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div>
            <h3 className="font-display font-bold text-primary-col text-lg">Reject Application</h3>
            <p className="text-muted-col text-xs mt-0.5">{teacher.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Teacher Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl glass-surface">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary-col font-semibold text-sm truncate">{teacher.name}</p>
              <p className="text-muted-col text-xs truncate">{teacher.email}</p>
            </div>
          </div>

          {/* Reason Checklist */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
              Select reason <span className="text-[var(--status-rejected)]">*</span>
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
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                Description <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
              </label>
              <textarea
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="Please describe the issue in detail…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl input-glass text-sm placeholder:text-muted-col resize-none"
              />
            </motion.div>
          )}
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/25 hover:bg-[var(--status-rejected)]/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting…</>
              : <><XCircle className="w-4 h-4" /> Confirm Reject</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Teacher View-Only Drawer ────────────────────────────────────────────────

function TeacherViewDrawer({
  teacher,
  onClose,
  onApprove,
  onReject,
  showActions = true,
  actionLoading = false,
}: {
  teacher: TeacherApplication;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  showActions?: boolean;
  actionLoading?: boolean;
}) {
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const initials = teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      </motion.div>

      <motion.div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg glass-modal rounded-l-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-muted-col uppercase tracking-wider">View Profile</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-[var(--status-active)]/12 text-[var(--status-active)] border-[var(--status-active)]/25">
            {teacher.status === "pending" ? "Pending" : teacher.status === "approved" ? "Approved" : teacher.status === "rejected" ? "Rejected" : teacher.status}
          </span>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-auto">
          {/* Avatar */}
          <div className="relative px-6 pt-6 pb-5">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/20 to-transparent rounded-b-3xl" />
            <div className="relative flex items-end gap-4">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg ring-4 ring-glass-border`}>
                {initials}
              </div>
              <div className="pb-1">
                <h2 className="font-display font-black text-primary-col text-xl leading-tight">{teacher.name}</h2>
                <div className="flex items-center gap-1.5 mt-1 text-muted-col text-xs">
                  <Mail className="w-3 h-3" />
                  <span>{teacher.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: MapPin, label: "Location", value: teacher.location },
                { icon: Calendar, label: "Applied", value: teacher.appliedDate },
                { icon: Briefcase, label: "Experience", value: teacher.experience },
                { icon: BookOpen, label: "JLPT Level", value: teacher.jlptLevel },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="p-3 rounded-xl glass-surface">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-primary-col text-sm font-semibold leading-tight">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Specialization */}
          <div className="px-6 pb-5">
            <h4 className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">Teaching Specialization</h4>
            <p className="text-primary-col text-sm">{teacher.specialization}</p>
          </div>

          {/* Bio */}
          <div className="px-6 pb-5">
            <h4 className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">Bio / Introduction</h4>
            <p className="text-secondary-col text-sm leading-relaxed">{teacher.bio}</p>
          </div>

          {/* Certificates */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-secondary-col uppercase tracking-wider">Certificates</h4>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-glass-surface text-muted-col text-[10px] font-bold border border-glass-border">
                {teacher.certificates.length}
              </span>
            </div>

            {teacher.certificates.length === 0 ? (
              <p className="text-muted-col text-xs italic">No certificates available</p>
            ) : (
              <div className="space-y-3">
                {teacher.certificates.map(cert => (
                  <div
                    key={cert.id}
                    className="rounded-xl border border-glass-border overflow-hidden glass-surface hover:border-primary/25 transition"
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className="relative flex-shrink-0">
                        {cert.type === "image" ? (
                          <img
                            src={cert.thumbnailUrl || cert.url}
                            alt={cert.name}
                            className="w-14 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-[var(--status-rejected)]/15 flex items-center justify-center">
                            <span className="text-[var(--status-rejected)] font-black text-[10px] font-display">PDF</span>
                          </div>
                        )}
                        <button
                          onClick={() => setPreviewCert(cert)}
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full glass-surface border border-glass-border flex items-center justify-center hover:border-primary/30 transition"
                          title="Preview"
                        >
                          <ZoomIn className="w-2.5 h-2.5 text-secondary-col" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-primary-col text-xs font-semibold leading-tight truncate">{cert.name}</p>
                        <p className="text-muted-col text-[10px] mt-0.5">{cert.issuedBy}</p>
                        <p className="text-muted-col/60 text-[10px]">{cert.issuedYear}</p>
                      </div>
                      <button
                        onClick={() => setPreviewCert(cert)}
                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/12 text-primary text-[10px] font-bold border border-primary/20 hover:bg-primary/20 transition"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        {showActions && (
          <div className="px-6 py-4 border-t separator">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition disabled:opacity-40"
              >
                Close
              </button>
              <button
                onClick={() => onReject(teacher.id)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/20 hover:bg-[var(--status-rejected)]/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
              </button>
              <button
                onClick={() => onApprove(teacher.id)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
              </button>
            </div>
          </div>
        )}

        {!showActions && (
          <div className="px-6 py-4 border-t separator">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>

      {/* Certificate Preview */}
      <AnimatePresence>
        {previewCert && (
          <CertificatePreviewModal
            certificate={previewCert}
            onClose={() => setPreviewCert(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Individual Teacher Card ──────────────────────────────────────────────────

function TeacherCard({
  teacher,
  onApprove,
  onReject,
  onView,
  loadingId,
}: {
  teacher: TeacherApplication;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onView: (teacher: TeacherApplication) => void;
  loadingId: string | null;
}) {
  const initials = teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const isLoading = loadingId === teacher.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="card-base p-5"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-black text-xl flex-shrink-0`}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Applied */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-primary-col">{teacher.name}</div>
              <div className="text-xs text-muted-col">{teacher.email}</div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[var(--status-pending)]">
              <Clock className="w-3 h-3" />
              {teacher.appliedDate}
            </div>
          </div>

          {/* Bio snippet */}
          <div className="mt-2 text-sm text-secondary-col leading-relaxed line-clamp-2">{teacher.bio}</div>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[var(--status-teacher)]/12 text-[var(--status-teacher)] text-[10px] font-bold">{teacher.experience}</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/12 text-primary text-[10px] font-bold">{teacher.jlptLevel}</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--status-pending)]/10 text-[var(--status-pending)] text-[10px] font-bold">
              {teacher.certificates.length} cert{teacher.certificates.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onApprove(teacher.id)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--status-active)]/10 text-[var(--status-active)] text-xs font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve
            </button>
            <button
              onClick={() => onReject(teacher.id)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-xs font-bold border border-[var(--status-rejected)]/20 hover:bg-[var(--status-rejected)]/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
            </button>
            <button
              onClick={() => onView(teacher)}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass-surface text-secondary-col text-xs font-bold border border-glass-border hover:border-primary/30 hover:text-primary transition disabled:opacity-50"
              title="View Profile"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Toast Notification ───────────────────────────────────────────────────────

function Toast({
  message,
  type,
  visible,
}: {
  message: string;
  type: "success" | "error";
  visible: boolean;
}) {
  const isSuccess = type === "success";
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border shadow-xl glass-modal ${
            isSuccess
              ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25"
              : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
          }`}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {isSuccess ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/teachers")({ component: TeachersPage });

function TeachersPage() {
  const [tab, setTab] = useState<"pending" | "approved">("pending");
  const [pendingTeachers, setPendingTeachers] = useState<TeacherApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<TeacherApplication | null>(null);
  const [viewingApproved, setViewingApproved] = useState<TeacherApplication | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TeacherApplication | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const fetchPendingTeachers = useCallback(async () => {
    try {
      setError(null);
      const users = await adminApi.getPendingTeachers();
      setPendingTeachers(users.map(mapToTeacherApplication));
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to load pending teachers. Please try again.";
      setError(message);
      setPendingTeachers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingTeachers();
  }, [fetchPendingTeachers]);

  const handleApprove = useCallback(async (id: string) => {
    setActionLoadingId(id);
    try {
      await adminApi.approveTeacher(id);
      showToast("Teacher approved successfully!", "success");
      await fetchPendingTeachers();
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to approve teacher. Please try again.";
      showToast(message, "error");
    } finally {
      setActionLoadingId(null);
    }
  }, [showToast, fetchPendingTeachers]);

  const handleReject = useCallback(async (id: string, _reason: string) => {
    setActionLoadingId(id);
    try {
      await adminApi.rejectTeacher(id);
      showToast("Teacher application rejected.", "error");
      await fetchPendingTeachers();
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Failed to reject teacher. Please try again.";
      showToast(message, "error");
    } finally {
      setActionLoadingId(null);
    }
  }, [showToast, fetchPendingTeachers]);

  const handleRejectConfirm = useCallback(async (id: string, reason: string) => {
    await handleReject(id, reason);
    setRejectTarget(null);
  }, [handleReject]);

  const pendingCount = pendingTeachers.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Teacher Approval</h1>
          <p className="text-sm text-secondary-col mt-0.5">Review and approve teacher applications</p>
        </div>
        {pendingCount > 0 && !loading && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--status-pending)]/10 text-[var(--status-pending)] text-xs font-bold border border-[var(--status-pending)]/20">
          <AlertTriangle className="w-3 h-3" />
            {pendingCount} pending {pendingCount === 1 ? "review" : "reviews"}
        </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass-card p-1 w-fit">
        {(["pending", "approved"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
              tab === t
                ? "bg-gradient-hero text-white shadow-md"
                : "text-secondary-col nav-item"
            }`}
          >
            {t === "pending" ? `Pending (${loading ? "..." : pendingCount})` : "Approved"}
          </button>
        ))}
      </div>

      {/* Pending Tab */}
      {tab === "pending" && (
        <>
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl empty-state gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
              <p className="text-secondary-col text-sm font-semibold">Loading pending teachers…</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl empty-state gap-3">
              <AlertCircle className="w-12 h-12 text-[var(--status-rejected)]/50" />
              <p className="text-secondary-col font-semibold text-sm">{error}</p>
              <button
                onClick={fetchPendingTeachers}
                className="px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && pendingTeachers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl empty-state">
              <InboxIcon className="w-12 h-12 text-[var(--status-active)]/40 mb-3" />
              <p className="text-secondary-col font-semibold text-sm">All caught up — no pending applications!</p>
            </div>
          )}

          {!loading && !error && pendingTeachers.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-4">
              {pendingTeachers.map(teacher => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  onApprove={handleApprove}
                  onReject={id => {
                    const t = pendingTeachers.find(x => x.id === id);
                    if (t) setRejectTarget(t);
                  }}
                  onView={setViewing}
                  loadingId={actionLoadingId}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Approved Tab */}
      {tab === "approved" && (
        <div className="card-base overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
            <div className="col-span-5">Teacher</div>
            <div className="col-span-4 text-center">Stats</div>
            <div className="col-span-1 text-center">Joined</div>
            <div className="col-span-2 text-right">Profile</div>
          </div>
          <div className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] text-xs text-muted-col">
            <div className="col-span-12 text-center py-8">
              <UserCheck className="w-8 h-8 mx-auto mb-2 text-muted-col/40" />
              <p className="text-sm text-secondary-col">Approved teacher list requires a backend endpoint.</p>
              <p className="text-xs text-muted-col/60 mt-1">This data is not yet available from the API.</p>
            </div>
          </div>
        </div>
      )}

      {/* View Profile Drawer */}
      <AnimatePresence>
        {viewing && (
          <TeacherViewDrawer
            teacher={viewing}
            onClose={() => setViewing(null)}
            onApprove={id => {
              handleApprove(id);
              setViewing(null);
            }}
            onReject={id => {
              setViewing(null);
              const t = pendingTeachers.find(x => x.id === id);
              if (t) setRejectTarget(t);
            }}
            showActions
            actionLoading={actionLoadingId !== null}
          />
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <RejectModal
            teacher={rejectTarget}
            onConfirm={handleRejectConfirm}
            onClose={() => setRejectTarget(null)}
            loading={actionLoadingId === rejectTarget.id}
          />
        )}
      </AnimatePresence>

      {/* Approved Profile Drawer */}
      <AnimatePresence>
        {viewingApproved && (
          <TeacherViewDrawer
            teacher={viewingApproved}
            onClose={() => setViewingApproved(null)}
            onApprove={() => {}}
            onReject={() => {}}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toast?.message ?? ""} type={toast?.type ?? "success"} visible={!!toast} />
    </div>
  );
}
