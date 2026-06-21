import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Mail, Phone, MapPin, Calendar,
  Briefcase, GraduationCap, Award, BookOpen, FileText, Download, Eye,
  Loader2, User, ShieldCheck, BarChart3, Check, AlertTriangle, X,
  FileImage, File, UserCheck, CalendarDays, ClipboardCheck, Star,
  MessageSquare, History, ChevronDown, ZoomIn, ExternalLink
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

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

type ApprovalHistory = {
  id: string;
  action: "submitted" | "reviewed" | "approved" | "rejected";
  performedBy?: string;
  performedAt: string;
  notes?: string;
  reason?: string;
};

type AuditLog = {
  id: string;
  adminId: string;
  adminName: string;
  action: "approved" | "rejected";
  teacherId: string;
  teacherName: string;
  timestamp: string;
  reason?: string;
};

type TeacherApplication = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  avatarUrl?: string | null;
  bio?: string;
  teachingPhilosophy?: string;
  teachingGoals?: string;
  experience: string;
  education?: string;
  specialization?: string;
  jlptLevel: string;
  appliedDate: string;
  status: "pending" | "approved" | "rejected";
  certificates: Certificate[];
  rejectionReason?: string | null;
  profileCompletion?: number;
  requiredDocumentsComplete?: boolean;
  approvalHistory: ApprovalHistory[];
};

// Mock application data
const mockApplication: TeacherApplication = {
  id: "app-001",
  name: "Nguyen Van A",
  email: "nguyen.van.a@example.com",
  phone: "+84 123 456 789",
  gender: "Male",
  dateOfBirth: "1990-05-15",
  address: "123 Tokyo Street, Shibuya District, Tokyo, Japan",
  avatarUrl: null,
  bio: "A passionate Japanese language teacher with over 5 years of experience teaching students from beginner to advanced levels. I specialize in JLPT preparation and conversational Japanese.",
  teachingPhilosophy: "I believe in creating a supportive and engaging learning environment where students feel comfortable making mistakes and growing at their own pace. Language learning should be fun and practical.",
  teachingGoals: "My goal is to help students achieve their Japanese language goals, whether it's passing the JLPT, conversing fluently, or understanding anime without subtitles.",
  experience: "5 Years",
  education: "Master's Degree in Japanese Language Education",
  specialization: "JLPT Preparation, Conversational Japanese",
  jlptLevel: "N1",
  appliedDate: "June 10, 2026",
  status: "pending",
  certificates: [
    { id: "cert-001", name: "Japanese Language Teaching Certificate", issuedYear: 2020, issuedBy: "Japanese Language Education Association", type: "image", url: "/certificates/cert1.jpg", thumbnailUrl: "/certificates/cert1-thumb.jpg" },
    { id: "cert-002", name: "JLPT N1 Certificate", issuedYear: 2019, issuedBy: "Japan Foundation", type: "image", url: "/certificates/cert2.jpg", thumbnailUrl: "/certificates/cert2-thumb.jpg" },
    { id: "cert-003", name: "Bachelor's Degree in Japanese Studies", issuedYear: 2018, issuedBy: "University of Tokyo", type: "pdf", url: "/certificates/degree.pdf" },
    { id: "cert-004", name: "Teaching Resume", issuedYear: 2024, issuedBy: "Self", type: "pdf", url: "/certificates/resume.pdf" },
  ],
  rejectionReason: null,
  profileCompletion: 95,
  requiredDocumentsComplete: true,
  approvalHistory: [
    { id: "hist-001", action: "submitted", performedAt: "June 10, 2026 09:30 AM" },
    { id: "hist-002", action: "reviewed", performedBy: "Admin", performedAt: "June 12, 2026 02:15 PM", notes: "Reviewing application materials" },
  ],
};

// Mock audit logs
const mockAuditLogs: AuditLog[] = [
  { id: "audit-001", adminId: "admin-001", adminName: "Admin User", action: "approved", teacherId: "app-002", teacherName: "Sakura Tanaka", timestamp: "June 12, 2026 10:30 AM" },
  { id: "audit-002", adminId: "admin-001", adminName: "Admin User", action: "rejected", teacherId: "app-003", teacherName: "Kenji Yamamoto", timestamp: "June 12, 2026 09:15 AM", reason: "Insufficient Experience" },
  { id: "audit-003", adminId: "admin-001", adminName: "Admin User", action: "approved", teacherId: "app-004", teacherName: "Yuki Sato", timestamp: "June 11, 2026 04:45 PM" },
];

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
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
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
          <div className="flex items-center gap-3 p-3 rounded-xl glass-surface">
            <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary-col font-semibold text-sm truncate">{teacher.name}</p>
              <p className="text-muted-col text-xs truncate">{teacher.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
              Reason Category <span className="text-[var(--status-rejected)]">*</span>
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
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        checked ? "bg-[var(--status-rejected)] border-[var(--status-rejected)]" : "border-border"
                      }`}>
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
                Additional Notes <span className="text-[var(--status-rejected)] normal-case font-normal">*</span>
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
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition disabled:opacity-40">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/25 hover:bg-[var(--status-rejected)]/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting...</> : <><XCircle className="w-4 h-4" /> Confirm Reject</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Approve Modal ────────────────────────────────────────────────────────────

function ApproveModal({
  teacher,
  onConfirm,
  onClose,
  loading = false,
}: {
  teacher: TeacherApplication;
  onConfirm: (id: string) => void;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
          <h3 className="font-display font-bold text-primary-col text-xl mb-2">Approve Teacher Application</h3>
          <p className="text-secondary-col text-sm leading-relaxed">
            This teacher will gain access to the Teacher Portal and can start creating classes.
          </p>
        </div>

        <div className="p-4 border-t separator">
          <div className="flex items-center gap-3 p-3 rounded-xl glass-surface mb-4">
            <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
              {teacher.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-primary-col font-semibold text-sm truncate">{teacher.name}</p>
              <p className="text-muted-col text-xs truncate">{teacher.email}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition disabled:opacity-40">
              Cancel
            </button>
            <button
              onClick={() => onConfirm(teacher.id)}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/25 hover:bg-[var(--status-active)]/25 transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><CheckCircle className="w-4 h-4" /> Approve</>}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Document Preview Modal ────────────────────────────────────────────────────

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
            <p className="text-xs text-muted-col mt-0.5">{document.issuedBy} · {document.issuedYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={document.url} download className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/12 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition">
              <Download className="w-3.5 h-3.5" /> Download
            </a>
            <button onClick={onClose} className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
          {document.type === "image" ? (
            <img src={document.url} alt={document.name} className="max-w-full max-h-[60vh] rounded-xl object-contain" />
          ) : (
            <div className="w-full h-80 flex flex-col items-center justify-center rounded-xl border border-glass-border glass-surface gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--status-pending)]/15 flex items-center justify-center">
                <File className="w-8 h-8 text-[var(--status-pending)]" />
              </div>
              <p className="text-muted-col text-sm">PDF preview not available in browser.</p>
              <a href={document.url} download className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--status-pending)]/12 text-[var(--status-pending)] text-sm font-bold border border-[var(--status-pending)]/20 hover:bg-[var(--status-pending)]/20 transition">
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

function ApprovalHistoryTimeline({ history }: { history: ApprovalHistory[] }) {
  const getActionIcon = (action: ApprovalHistory["action"]) => {
    switch (action) {
      case "submitted": return <Clock className="w-4 h-4" />;
      case "reviewed": return <Eye className="w-4 h-4" />;
      case "approved": return <CheckCircle className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: ApprovalHistory["action"]) => {
    switch (action) {
      case "submitted": return "text-muted-col bg-muted";
      case "reviewed": return "text-[var(--status-pending)] bg-[var(--status-pending)]/12";
      case "approved": return "text-[var(--status-active)] bg-[var(--status-active)]/12";
      case "rejected": return "text-[var(--status-rejected)] bg-[var(--status-rejected)]/12";
      default: return "text-muted-col bg-muted";
    }
  };

  const getActionLabel = (action: ApprovalHistory["action"]) => {
    switch (action) {
      case "submitted": return "Application Submitted";
      case "reviewed": return "Reviewed by Admin";
      case "approved": return "Approved";
      case "rejected": return "Rejected";
      default: return action;
    }
  };

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
          {/* Timeline line */}
          {index < history.length - 1 && (
            <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border" />
          )}

          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 ${getActionColor(item.action)}`}>
            {getActionIcon(item.action)}
          </div>

          {/* Content */}
          <div className="flex-1 pb-6">
            <p className="text-sm font-semibold text-primary-col">{getActionLabel(item.action)}</p>
            <p className="text-xs text-muted-col mt-0.5">{item.performedAt}</p>
            {item.performedBy && (
              <p className="text-xs text-secondary-col mt-1">by {item.performedBy}</p>
            )}
            {item.notes && (
              <p className="text-xs text-secondary-col mt-1 italic">{item.notes}</p>
            )}
            {item.reason && (
              <div className="mt-2 p-2 rounded-lg bg-[var(--status-rejected)]/8 border border-[var(--status-rejected)]/20">
                <p className="text-xs text-[var(--status-rejected)] font-semibold">Rejection Reason:</p>
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
  const [application, setApplication] = useState<TeacherApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Certificate | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 500));
      setApplication(mockApplication);
    } catch (err: any) {
      setError(err.message || "Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { fetchApplication(); }, [fetchApplication]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      showToast("Teacher approved successfully!", "success");
      setApplication(prev => prev ? { ...prev, status: "approved", approvalHistory: [...prev.approvalHistory, { id: `hist-${Date.now()}`, action: "approved", performedBy: "Admin", performedAt: new Date().toLocaleString() }] } : null);
      setShowApproveModal(false);
    } catch (err) {
      showToast("Failed to approve teacher", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setActionLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      showToast("Application rejected successfully.", "error");
      setApplication(prev => prev ? { ...prev, status: "rejected", rejectionReason: reason, approvalHistory: [...prev.approvalHistory, { id: `hist-${Date.now()}`, action: "rejected", performedBy: "Admin", performedAt: new Date().toLocaleString(), reason }] } : null);
      setShowRejectModal(false);
    } catch (err) {
      showToast("Failed to reject application", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-col">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-[var(--status-rejected)]/50" />
        <p className="text-primary-col font-bold">{error || "Application not found"}</p>
        <button onClick={fetchApplication} className="px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition">
          Try Again
        </button>
      </div>
    );
  }

  const initials = application.name.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link to="/admin/teachers" className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary hover:bg-accent transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-display font-black text-primary-col">Teacher Application</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                application.status === "pending" ? "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border border-[var(--status-pending)]/20" :
                application.status === "approved" ? "bg-[var(--status-active)]/12 text-[var(--status-active)] border border-[var(--status-active)]/20" :
                "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] border border-[var(--status-rejected)]/20"
              }`}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-secondary-col">Application ID: {application.id}</p>
          </div>
        </div>

        {application.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] text-sm font-bold border border-[var(--status-rejected)]/20 hover:bg-[var(--status-rejected)]/20 transition"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button
              onClick={() => setShowApproveModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-bold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition"
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-base p-5">
            <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Full Name</p>
                  <p className="text-sm font-semibold text-primary-col">{application.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Email</p>
                  <p className="text-sm font-semibold text-primary-col">{application.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Phone</p>
                  <p className="text-sm font-semibold text-primary-col">{application.phone || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Address</p>
                  <p className="text-sm font-semibold text-primary-col truncate">{application.address || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Date of Birth</p>
                  <p className="text-sm font-semibold text-primary-col">{application.dateOfBirth ? new Date(application.dateOfBirth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Applied Date</p>
                  <p className="text-sm font-semibold text-primary-col">{application.appliedDate}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Professional Information */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-base p-5">
            <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" /> Professional Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--status-teacher)]/12 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-[var(--status-teacher)]" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Education</p>
                  <p className="text-sm font-semibold text-primary-col">{application.education || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--status-teacher)]/12 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-[var(--status-teacher)]" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Experience</p>
                  <p className="text-sm font-semibold text-primary-col">{application.experience}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--status-teacher)]/12 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-[var(--status-teacher)]" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">JLPT Level</p>
                  <p className="text-sm font-semibold text-primary-col">{application.jlptLevel}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--status-teacher)]/12 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-[var(--status-teacher)]" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Specialization</p>
                  <p className="text-sm font-semibold text-primary-col">{application.specialization || "—"}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Introduction */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-base p-5">
            <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Introduction
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Biography</p>
                <p className="text-sm text-secondary-col leading-relaxed">{application.bio || "No biography provided."}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Teaching Philosophy</p>
                <p className="text-sm text-secondary-col leading-relaxed">{application.teachingPhilosophy || "No philosophy provided."}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold mb-1">Teaching Goals</p>
                <p className="text-sm text-secondary-col leading-relaxed">{application.teachingGoals || "No goals provided."}</p>
              </div>
            </div>
          </motion.div>

          {/* Documents */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-base p-5">
            <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Documents ({application.certificates.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {application.certificates.map(cert => (
                <div key={cert.id} className="flex items-center gap-3 p-3 rounded-xl border border-glass-border glass-surface hover:border-primary/25 transition">
                  <div className="relative shrink-0">
                    {cert.type === "image" ? (
                      <img src={cert.thumbnailUrl || cert.url} alt={cert.name} className="w-16 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-12 rounded-lg bg-[var(--status-pending)]/12 flex items-center justify-center">
                        <File className="w-6 h-6 text-[var(--status-pending)]" />
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
                    <button onClick={() => setPreviewDocument(cert)} className="p-2 rounded-lg text-primary/60 hover:text-primary hover:bg-primary/10 transition" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                    <a href={cert.url} download className="p-2 rounded-lg text-secondary-col/60 hover:text-secondary-col hover:bg-accent transition" title="Download">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Avatar & Quick Stats */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-base p-5">
            <div className="flex flex-col items-center text-center">
              <div className={`w-24 h-24 rounded-2xl bg-linear-to-br ${getAvatarColor(application.id)} flex items-center justify-center text-white font-black text-3xl mb-3`}>
                {initials}
              </div>
              <h3 className="font-display font-bold text-primary-col text-lg">{application.name}</h3>
              <p className="text-xs text-muted-col">{application.email}</p>
            </div>

            <div className="mt-4 pt-4 border-t separator space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Profile Completion</span>
                <span className="text-sm font-bold text-primary-col">{application.profileCompletion}%</span>
              </div>
              <div className="h-2 glass-surface rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--status-active)] transition-all"
                  style={{ width: `${application.profileCompletion}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Documents</span>
                <span className={`text-sm font-bold ${application.requiredDocumentsComplete ? "text-[var(--status-active)]" : "text-[var(--status-pending)]"}`}>
                  {application.requiredDocumentsComplete ? "Complete" : "Incomplete"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Approval History */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-base p-5">
            <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Approval History
            </h2>
            <ApprovalHistoryTimeline history={application.approvalHistory} />
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showApproveModal && (
          <ApproveModal
            teacher={application}
            onConfirm={handleApprove}
            onClose={() => setShowApproveModal(false)}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRejectModal && (
          <RejectModal
            teacher={application}
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-100 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border shadow-xl glass-modal ${
              toast.type === "success"
                ? "bg-[var(--status-active)]/15 text-[var(--status-active)] border-[var(--status-active)]/25"
                : "bg-[var(--status-rejected)]/15 text-[var(--status-rejected)] border-[var(--status-rejected)]/25"
            }`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
