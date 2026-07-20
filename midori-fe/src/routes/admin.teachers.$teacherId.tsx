import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  AlertTriangle,
  Eye,
  Loader2,
  Lock,
  Unlock,
  BarChart3,
  BookUser,
  GraduationCap,
  BookOpen,
  Download,
  FileImage,
  Key,
  X,
  RefreshCw,
  Briefcase,
} from "lucide-react";
import {
  adminApi,
  type AdminTeacherResponse,
  type AdminTeacherCertificateResponse,
  type AdminClassResponse,
} from "@/lib/api/admin";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
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

type TeacherClass = {
  id: string;
  name: string;
  level: string;
  students: number;
  maxStudents: number;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
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

function formatShortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function displayNameOf(t: AdminTeacherResponse): string {
  const dn = t.displayName?.trim();
  if (dn) {
    return dn
      .split(/\s+/)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }
  const emailName = t.email.split("@")[0];
  return emailName
    .split(/[._]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

// Map backend status to human-friendly label + colors.
function statusLabel(status: AdminTeacherResponse["status"]): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "PENDING_APPROVAL":
    case "PENDING":
      return "Pending Approval";
    case "REJECTED":
      return "Rejected";
    case "SUSPENDED":
      return "Suspended";
    case "BANNED":
      return "Banned";
    default:
      return status;
  }
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
            <a
              href={certificate.url}
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
          {certificate.type === "image" ? (
            <img
              src={certificate.url}
              alt={certificate.name}
              className="max-w-full max-h-[60vh] rounded-xl object-contain"
            />
          ) : (
            <div className="w-full h-80 flex flex-col items-center justify-center rounded-xl border border-glass-border glass-surface gap-4">
              <div className="w-16 h-16 rounded-2xl bg-(--status-rejected)/15 flex items-center justify-center">
                <span className="text-(--status-rejected) font-black text-xl font-display">PDF</span>
              </div>
              <p className="text-muted-col text-sm">PDF preview not available in browser.</p>
              <a
                href={certificate.url}
                download
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
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

// ─── Reset Password Modal ────────────────────────────────────────────────────

function ResetPasswordModal({
  teacherEmail,
  onClose,
}: {
  teacherEmail: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await authApi.forgotPassword({ email: teacherEmail });
      sonnerToast.success(`Password reset link sent to ${teacherEmail}`);
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to send password reset link";
      sonnerToast.error(msg);
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--status-pending)]/12 flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-[var(--status-pending)]" />
          </div>
          <h3 className="font-display font-bold text-primary-col text-xl mb-2">Reset Password</h3>
          <p className="text-secondary-col text-sm">
            Send password reset link to{" "}
            <span className="font-semibold text-primary-col">{teacherEmail}</span>?
          </p>
        </div>

        <div className="px-6 py-4 border-t separator flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition"
          >
            Cancel
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-[var(--status-pending)]/12 text-[var(--status-pending)] text-sm font-bold border border-[var(--status-pending)]/20 hover:bg-[var(--status-pending)]/20 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sending...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" /> Send Link
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/teachers/$teacherId")({
  component: TeacherProfilePage,
});

function TeacherProfilePage() {
  const { teacherId } = Route.useParams();

  const [teacher, setTeacher] = useState<AdminTeacherResponse | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const found = await adminApi.getTeacherById(teacherId);
      if (!found) {
        setTeacher(null);
        setError("Teacher not found.");
        return;
      }
      setTeacher(found);
      const [certs, allClasses] = await Promise.all([
        adminApi.getTeacherCertificates(teacherId).catch(() => []),
        adminApi.getAdminClasses().catch(() => [] as AdminClassResponse[]),
      ]);
      setCertificates(certs.map(mapApiCertificate));
      setClasses(
        allClasses
          .filter((c) => c.teacherId === teacherId)
          .map((c) => ({
            id: c.id,
            name: c.name,
            level: c.level,
            students: c.students,
            maxStudents: c.maxStudents,
            status: c.status,
            createdAt: c.createdAt,
          })),
      );
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to load teacher profile.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSuspend = useCallback(async () => {
    if (!teacher) return;
    setActionLoading(true);
    try {
      const updated = await adminApi.suspendTeacher(teacher.id);
      setTeacher(updated);
      sonnerToast.success("Teacher account suspended");
    } catch (err) {
      sonnerToast.error(
        err instanceof ApiError ? err.message : "Failed to suspend teacher account",
      );
    } finally {
      setActionLoading(false);
    }
  }, [teacher]);

  const handleActivate = useCallback(async () => {
    if (!teacher) return;
    setActionLoading(true);
    try {
      const updated = await adminApi.activateTeacher(teacher.id);
      setTeacher(updated);
      sonnerToast.success("Teacher account activated");
    } catch (err) {
      sonnerToast.error(
        err instanceof ApiError ? err.message : "Failed to activate teacher account",
      );
    } finally {
      setActionLoading(false);
    }
  }, [teacher]);

  const totalStudents = useMemo(
    () => classes.reduce((sum, c) => sum + (c.students ?? 0), 0),
    [classes],
  );
  const activeClasses = useMemo(
    () => classes.filter((c) => c.status === "ACTIVE").length,
    [classes],
  );

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-col">Loading teacher profile…</p>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error || !teacher) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="w-12 h-12 text-[var(--status-rejected)]/50" />
        <p className="text-primary-col font-bold">{error || "Teacher not found"}</p>
        <button
          onClick={fetchAll}
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
  const isAccountActive = teacher.status === "ACTIVE";
  const isSuspended = teacher.status === "SUSPENDED" || teacher.status === "BANNED";

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
                Teacher Profile
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isAccountActive
                    ? "bg-[var(--status-active)]/12 text-[var(--status-active)] border-[var(--status-active)]/20"
                    : teacher.status === "REJECTED" || teacher.status === "SUSPENDED" || teacher.status === "BANNED"
                      ? "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] border-[var(--status-rejected)]/20"
                      : "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border-[var(--status-pending)]/20"
                }`}
              >
                {statusLabel(teacher.status)}
              </span>
            </div>
            <p className="text-sm text-secondary-col">Teacher ID: {teacher.id}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to="/admin/teachers/$teacherId/analytics"
            params={{ teacherId: teacher.id }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:text-primary hover:bg-accent transition"
          >
            <BarChart3 className="w-4 h-4" /> Analytics
          </Link>
          <Link
            to="/admin/teachers/$teacherId/classes"
            params={{ teacherId: teacher.id }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:text-primary hover:bg-accent transition"
          >
            <BookUser className="w-4 h-4" /> View Classes
          </Link>
        </div>
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
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold text-primary-col truncate">{displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Email
                  </p>
                  <p className="text-sm font-semibold text-primary-col truncate">{teacher.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Phone
                  </p>
                  <p className="text-sm font-semibold text-primary-col truncate">
                    {teacher.phone || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
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
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Date of Birth
                  </p>
                  <p className="text-sm font-semibold text-primary-col truncate">
                    {formatDate(teacher.dateOfBirth)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Join Date
                  </p>
                  <p className="text-sm font-semibold text-primary-col truncate">
                    {formatShortDate(teacher.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bio */}
          {teacher.bio && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="card-base p-5"
            >
              <h2 className="font-display font-bold text-sm text-primary-col mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Bio / Introduction
              </h2>
              <p className="text-secondary-col text-sm leading-relaxed whitespace-pre-wrap">
                {teacher.bio}
              </p>
            </motion.div>
          )}

          {/* Professional Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="card-base p-5"
          >
            <h2 className="font-display font-bold text-sm text-primary-col mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" /> Professional Information
            </h2>
            <p className="text-muted-col text-sm italic">
              Professional information (job title, specialization, experience, qualifications, department, organization) is not available from the backend API for this teacher.
            </p>
          </motion.div>

          {/* Rejection Reason (when applicable) */}
          {(teacher.status === "REJECTED" || teacher.status === "BANNED") &&
            teacher.rejectionReason && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-base p-5"
              >
                <div className="flex items-start gap-3 p-4 rounded-xl bg-(--status-rejected)/10 border border-(--status-rejected)/20">
                  <AlertCircle className="w-5 h-5 text-(--status-rejected) shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-(--status-rejected) mb-1">
                      {teacher.status === "BANNED" ? "Ban Reason" : "Rejection Reason"}
                    </h3>
                    <p className="text-sm text-secondary-col leading-relaxed whitespace-pre-wrap">
                      {teacher.rejectionReason}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          {/* Current Classes */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-base p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-sm text-primary-col flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Current Classes ({classes.length})
              </h2>
              <Link
                to="/admin/teachers/$teacherId/classes"
                params={{ teacherId: teacher.id }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/12 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition"
              >
                View all
              </Link>
            </div>
            {classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-col">
                <GraduationCap className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-semibold">No classes yet</p>
                <p className="text-xs mt-1 text-center max-w-xs">
                  This teacher has not been assigned to any class.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid grid-cols-4 gap-2 px-4 py-2.5 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold min-w-[480px]">
                  <div className="col-span-2">Class</div>
                  <div className="text-center">Level</div>
                  <div className="text-center">Students</div>
                </div>
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="grid grid-cols-4 gap-2 px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center min-w-[480px]"
                  >
                    <div className="col-span-2">
                      <p className="text-sm font-semibold text-primary-col truncate">{cls.name}</p>
                    </div>
                    <div className="text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/12 text-purple-500 border border-purple-500/20">
                        {cls.level}
                      </span>
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-semibold text-primary-col">
                        {cls.students ?? 0}/{cls.maxStudents ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Certificates */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-base p-5"
          >
            <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
              <FileImage className="w-4 h-4 text-primary" /> Documents ({certificates.length})
            </h2>
            {certificates.length === 0 ? (
              <p className="text-muted-col text-xs italic px-1">
                No certificates uploaded by this teacher.
              </p>
            ) : (
              <div className="space-y-2">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-glass-border glass-surface hover:border-primary/25 transition"
                  >
                    <div className="shrink-0">
                      {cert.type === "image" ? (
                        <img
                          src={cert.thumbnailUrl || cert.url}
                          alt={cert.name}
                          className="w-14 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-10 rounded-lg bg-[var(--status-rejected)]/15 flex items-center justify-center">
                          <span className="text-[var(--status-rejected)] font-black text-[10px] font-display">
                            PDF
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-primary-col text-xs font-semibold truncate">{cert.name}</p>
                      <p className="text-muted-col text-[10px]">
                        {cert.issuedBy} · {cert.issuedYear}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setPreviewCert(cert)}
                        className="p-1.5 rounded-lg glass-surface text-secondary-col hover:text-primary transition"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={cert.url}
                        download
                        className="p-1.5 rounded-lg glass-surface text-secondary-col hover:text-primary transition"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
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
              <p className="text-xs text-muted-col truncate max-w-full">{teacher.email}</p>
            </div>

            {/* Teaching Summary KPIs — derived from real class list */}
            <div className="mt-4 pt-4 border-t separator space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Total Classes</span>
                <span className="text-sm font-bold text-primary-col">{classes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Active Classes</span>
                <span className="text-sm font-bold text-primary-col">{activeClasses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Total Students</span>
                <span className="text-sm font-bold text-primary-col">{totalStudents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Certificates</span>
                <span className="text-sm font-bold text-primary-col">{certificates.length}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t separator space-y-2">
              <button
                onClick={() => setShowResetModal(true)}
                disabled={actionLoading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass-surface text-secondary-col text-xs font-semibold hover:text-primary hover:bg-accent transition disabled:opacity-50"
              >
                <Key className="w-4 h-4" /> Reset Password
              </button>
              {isAccountActive && (
                <button
                  onClick={handleSuspend}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass-surface text-[var(--status-rejected)] text-xs font-semibold hover:bg-[var(--status-rejected)]/10 transition disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Suspend Account
                </button>
              )}
              {isSuspended && (
                <button
                  onClick={handleActivate}
                  disabled={actionLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass-surface text-[var(--status-active)] text-xs font-semibold hover:bg-[var(--status-active)]/10 transition disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  Activate Account
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal && (
          <ResetPasswordModal
            teacherEmail={teacher.email}
            onClose={() => setShowResetModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Certificate Preview */}
      <AnimatePresence>
        {previewCert && (
          <CertificatePreviewModal
            certificate={previewCert}
            onClose={() => setPreviewCert(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
