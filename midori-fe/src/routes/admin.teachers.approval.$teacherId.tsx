import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  BookOpen,
  FileText,
  Download,
  Eye,
  Loader2,
  User,
  ShieldCheck,
  AlertTriangle,
  X,
  FileImage,
  CalendarDays,
  MessageSquare,
  History,
  Check,
  ZoomIn,
  RefreshCw,
} from "lucide-react";
import {
  adminApi,
  type AdminTeacherResponse,
  type AdminTeacherCertificateResponse,
} from "@/lib/api/admin";
import { ApiError, isApiError } from "@/lib/api/client";
import { toast as sonnerToast } from "sonner";

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

type TimelineEvent = {
  id: string;
  action: "submitted" | "approved" | "rejected";
  performedAt: string;
  performedBy?: string;
  reason?: string;
};

function mapApiCertificate(apiCert: AdminTeacherCertificateResponse): Certificate {
  const issuedYear = apiCert.issuedDate
    ? new Date(apiCert.issuedDate).getFullYear()
    : apiCert.createdAt
      ? new Date(apiCert.createdAt).getFullYear()
      : new Date().getFullYear();
  const isPdf =
    !!apiCert.certificateUrl &&
    !apiCert.imageUrl &&
    (apiCert.certificateUrl.endsWith(".pdf") ||
      !apiCert.certificateUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i));
  return {
    id: apiCert.id,
    name: apiCert.title,
    issuedYear,
    issuedBy: apiCert.issuer,
    type: isPdf ? "pdf" : "image",
    url: apiCert.certificateUrl || apiCert.imageUrl || "",
    thumbnailUrl: apiCert.imageUrl || undefined,
  };
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function displayNameOf(t: AdminTeacherResponse): string {
  const dn = t.displayName?.trim();
  if (dn) return dn;
  const emailName = t.email.split("@")[0];
  return emailName
    .split(/[._]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

// Avatar color helper
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
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Reject Modal ────────────────────────────────────────────────────────────

const REJECT_REASONS = [
  "Missing Documents",
  "Insufficient Qualification",
  "Insufficient Experience",
  "Duplicate Application",
  "Policy Violation",
  "Other",
];

function RejectModal({
  teacherName,
  onConfirm,
  onClose,
  loading = false,
}: {
  teacherName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  loading?: boolean;
}) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [detail, setDetail] = useState("");

  const toggleReason = (r: string) => {
    setSelectedReasons((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const isOtherSelected = selectedReasons.includes("Other");
  const isValid = selectedReasons.length > 0 && (!isOtherSelected || detail.trim().length > 0);

  const handleConfirm = async () => {
    if (!isValid) return;
    const reason = [
      ...selectedReasons.filter((r) => r !== "Other"),
      isOtherSelected && detail.trim() ? `Other: ${detail}` : "",
    ]
      .filter(Boolean)
      .join("; ");
    onConfirm(reason);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
            <p className="text-muted-col text-xs mt-0.5">{teacherName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
              Reason Category <span className="text-[var(--status-rejected)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REJECT_REASONS.map((reason) => {
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
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          checked
                            ? "bg-[var(--status-rejected)] border-[var(--status-rejected)]"
                            : "border-border"
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {reason}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {isOtherSelected && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
              <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
                Additional Notes{" "}
                <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Please describe the issue in detail..."
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
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition disabled:opacity-40"
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

// ─── Approve Modal ────────────────────────────────────────────────────────────

function ApproveModal({
  teacherName,
  onConfirm,
  onClose,
  loading = false,
}: {
  teacherName: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
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
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--status-active)]/12 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-[var(--status-active)]" />
          </div>
          <h3 className="font-display font-bold text-primary-col text-xl mb-2">
            Approve Teacher Application
          </h3>
          <p className="text-secondary-col text-sm leading-relaxed">
            Approving <span className="font-semibold text-primary-col">{teacherName}</span>?
            <br />
            <span className="text-xs text-muted-col mt-1 block">
              This teacher will gain access to the Teacher Portal and can start creating classes.
            </span>
          </p>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/25 hover:bg-[var(--status-active)]/25 transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Approve
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Document Preview Modal ──────────────────────────────────────────────────

function DocumentPreviewModal({
  document,
  onClose,
}: {
  document: Certificate;
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
            <h3 className="font-display font-bold text-primary-col text-base">{document.name}</h3>
            <p className="text-xs text-muted-col mt-0.5">
              {document.issuedBy} · {document.issuedYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={document.url}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/12 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          {document.type === "image" ? (
            <img
              src={document.url}
              alt={document.name}
              className="max-w-full max-h-[60vh] rounded-xl object-contain"
            />
          ) : (
            <div className="w-full h-80 flex flex-col items-center justify-center rounded-xl border border-glass-border glass-surface gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--status-pending)]/15 flex items-center justify-center">
                <FileImage className="w-8 h-8 text-[var(--status-pending)]" />
              </div>
              <p className="text-muted-col text-sm">PDF preview not available in browser.</p>
              <a
                href={document.url}
                download
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--status-pending)]/12 text-[var(--status-pending)] text-sm font-bold border border-[var(--status-pending)]/20 hover:bg-[var(--status-pending)]/20 transition"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Approval History Timeline ────────────────────────────────────────────────

function ApprovalHistoryTimeline({ history }: { history: TimelineEvent[] }) {
  const getActionIcon = (action: TimelineEvent["action"]) => {
    switch (action) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: TimelineEvent["action"]) => {
    switch (action) {
      case "approved":
        return "text-[var(--status-active)] bg-[var(--status-active)]/12";
      case "rejected":
        return "text-[var(--status-rejected)] bg-[var(--status-rejected)]/12";
      default:
        return "text-muted-col bg-muted";
    }
  };

  const getActionLabel = (action: TimelineEvent["action"]) => {
    switch (action) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return "Application Submitted";
    }
  };

  if (history.length === 0) {
    return <p className="text-xs text-muted-col italic">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-0">
      {history.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex gap-4 relative"
        >
          {index < history.length - 1 && (
            <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border" />
          )}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 ${getActionColor(item.action)}`}
          >
            {getActionIcon(item.action)}
          </div>
          <div className="flex-1 pb-6">
            <p className="text-sm font-semibold text-primary-col">{getActionLabel(item.action)}</p>
            <p className="text-xs text-muted-col mt-0.5">{item.performedAt}</p>
            {item.performedBy && (
              <p className="text-xs text-secondary-col mt-1">by {item.performedBy}</p>
            )}
            {item.reason && (
              <div className="mt-2 p-2 rounded-lg bg-[var(--status-rejected)]/8 border border-[var(--status-rejected)]/20">
                <p className="text-xs text-[var(--status-rejected)] font-semibold">Reason:</p>
                <p className="text-xs text-secondary-col mt-0.5">{item.reason}</p>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/teachers/approval/$teacherId")({
  component: TeacherApprovalDetailPage,
});

function TeacherApprovalDetailPage() {
  const { teacherId } = Route.useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<AdminTeacherResponse | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Certificate | null>(null);

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await adminApi.getTeacherById(teacherId);
      if (!found) {
        setTeacher(null);
        setError("Application not found.");
        return;
      }
      setTeacher(found);
      const certs = await adminApi.getTeacherCertificates(teacherId).catch(() => []);
      setCertificates(certs.map(mapApiCertificate));
    } catch (err) {
      const msg = isApiError(err) ? err.message : "Failed to load application";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleApprove = async () => {
    if (!teacher) return;
    setActionLoading(true);
    try {
      const updated = await adminApi.approveTeacher(teacher.id);
      setTeacher(updated);
      sonnerToast.success("Teacher approved successfully!");
      setShowApproveModal(false);
      // Navigate back to the pending list so the row disappears.
      navigate({ to: "/admin/teachers" });
    } catch (err) {
      sonnerToast.error(
        isApiError(err) ? err.message : "Failed to approve teacher",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!teacher) return;
    setActionLoading(true);
    try {
      const updated = await adminApi.rejectTeacher(teacher.id, { reason });
      setTeacher(updated);
      sonnerToast.success("Application rejected successfully.");
      setShowRejectModal(false);
      navigate({ to: "/admin/teachers" });
    } catch (err) {
      sonnerToast.error(
        isApiError(err) ? err.message : "Failed to reject application",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-col">Loading application…</p>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-[var(--status-rejected)]/50" />
        <p className="text-primary-col font-bold">{error || "Application not found"}</p>
        <button
          onClick={fetchApplication}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const displayName = displayNameOf(teacher);
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  const isPending =
    teacher.status === "PENDING_APPROVAL" || teacher.status === "PENDING";

  const timeline: TimelineEvent[] = [
    {
      id: "submitted",
      action: "submitted",
      performedAt: formatDateTime(teacher.createdAt),
    },
  ];
  if (teacher.status === "ACTIVE") {
    timeline.push({
      id: "approved",
      action: "approved",
      performedAt: formatDateTime(teacher.updatedAt),
      performedBy: "Administrator",
    });
  } else if (teacher.status === "REJECTED") {
    timeline.push({
      id: "rejected",
      action: "rejected",
      performedAt: formatDateTime(teacher.updatedAt),
      performedBy: "Administrator",
      reason: teacher.rejectionReason ?? undefined,
    });
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            to="/admin/teachers"
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary hover:bg-accent transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-display font-black text-primary-col">
                Teacher Application
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  teacher.status === "ACTIVE"
                    ? "bg-[var(--status-active)]/12 text-[var(--status-active)] border-[var(--status-active)]/20"
                    : teacher.status === "REJECTED"
                      ? "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] border-[var(--status-rejected)]/20"
                      : "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border-[var(--status-pending)]/20"
                }`}
              >
                {isPending
                  ? "Pending"
                  : teacher.status === "ACTIVE"
                    ? "Approved"
                    : teacher.status === "REJECTED"
                      ? "Rejected"
                      : teacher.status}
              </span>
            </div>
            <p className="text-sm text-secondary-col">Teacher ID: {teacher.id}</p>
          </div>
        </div>

        {isPending && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] text-sm font-bold border-[var(--status-rejected)]/20 border hover:bg-[var(--status-rejected)]/20 transition disabled:opacity-40"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button
              onClick={() => setShowApproveModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border-[var(--status-active)]/20 border hover:bg-[var(--status-active)]/20 transition disabled:opacity-40"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-base p-5"
          >
            <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold text-primary-col">{displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Email
                  </p>
                  <p className="text-sm font-semibold text-primary-col">{teacher.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Phone
                  </p>
                  <p className="text-sm font-semibold text-primary-col">
                    {teacher.phone || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Location
                  </p>
                  <p className="text-sm font-semibold text-primary-col truncate">
                    {teacher.location || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Date of Birth
                  </p>
                  <p className="text-sm font-semibold text-primary-col">
                    {formatDate(teacher.dateOfBirth)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Applied Date
                  </p>
                  <p className="text-sm font-semibold text-primary-col">
                    {formatDate(teacher.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rejection reason (if any) */}
          {teacher.status === "REJECTED" && teacher.rejectionReason && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-base p-5"
            >
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--status-rejected)]/10 border border-[var(--status-rejected)]/20">
                <XCircle className="w-5 h-5 text-[var(--status-rejected)] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-[var(--status-rejected)] mb-1">
                    Rejection Reason
                  </h3>
                  <p className="text-sm text-secondary-col leading-relaxed whitespace-pre-wrap">
                    {teacher.rejectionReason}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bio / Introduction */}
          {teacher.bio && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card-base p-5"
            >
              <h2 className="font-display font-bold text-sm text-primary-col mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" /> Bio / Introduction
              </h2>
              <p className="text-secondary-col text-sm leading-relaxed whitespace-pre-wrap">
                {teacher.bio}
              </p>
            </motion.div>
          )}

          {/* Documents */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-base p-5"
          >
            <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Documents ({certificates.length})
            </h2>
            {certificates.length === 0 ? (
              <p className="text-muted-col text-xs italic px-1">
                No documents uploaded by this teacher.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-glass-border glass-surface hover:border-primary/25 transition"
                  >
                    <div className="relative shrink-0">
                      {cert.type === "image" ? (
                        <img
                          src={cert.thumbnailUrl || cert.url}
                          alt={cert.name}
                          className="w-16 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-[var(--status-pending)]/12 flex items-center justify-center">
                          <FileImage className="w-6 h-6 text-[var(--status-pending)]" />
                        </div>
                      )}
                      <button
                        onClick={() => setPreviewDocument(cert)}
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full glass-surface border border-glass-border flex items-center justify-center hover:border-primary/30 transition"
                      >
                        <ZoomIn className="w-3 h-3 text-secondary-col" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary-col truncate">{cert.name}</p>
                      <p className="text-[10px] text-muted-col">{cert.issuedBy}</p>
                      <p className="text-[10px] text-muted-col/60">{cert.issuedYear}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setPreviewDocument(cert)}
                        className="p-2 rounded-lg text-primary/60 hover:text-primary hover:bg-primary/10 transition"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={cert.url}
                        download
                        className="p-2 rounded-lg text-secondary-col/60 hover:text-secondary-col hover:bg-accent transition"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-base p-5"
          >
            <div className="flex flex-col items-center text-center">
              {teacher.avatarUrl ? (
                <img
                  src={teacher.avatarUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-2xl object-cover mb-3"
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-2xl bg-linear-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-black text-3xl mb-3`}
                >
                  {initials}
                </div>
              )}
              <h3 className="font-display font-bold text-primary-col text-lg">{displayName}</h3>
              <p className="text-xs text-muted-col">{teacher.email}</p>
            </div>

            <div className="mt-4 pt-4 border-t separator space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Submitted</span>
                <span className="text-xs font-semibold text-primary-col">
                  {formatDate(teacher.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Last Update</span>
                <span className="text-xs font-semibold text-primary-col">
                  {formatDate(teacher.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Documents</span>
                <span
                  className={`text-xs font-bold ${
                    certificates.length > 0
                      ? "text-[var(--status-active)]"
                      : "text-[var(--status-pending)]"
                  }`}
                >
                  {certificates.length} uploaded
                </span>
              </div>
            </div>
          </motion.div>

          {/* Approval History */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-base p-5"
          >
            <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Approval History
            </h2>
            <ApprovalHistoryTimeline history={timeline} />
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showApproveModal && teacher && (
          <ApproveModal
            teacherName={displayName}
            onConfirm={handleApprove}
            onClose={() => setShowApproveModal(false)}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRejectModal && teacher && (
          <RejectModal
            teacherName={displayName}
            onConfirm={handleReject}
            onClose={() => setShowRejectModal(false)}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewDocument && (
          <DocumentPreviewModal
            document={previewDocument}
            onClose={() => setPreviewDocument(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
