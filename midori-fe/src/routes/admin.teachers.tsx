import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  MapPin,
  Mail,
  Calendar,
  Briefcase,
  BookOpen,
  Award,
  Download,
  X,
  ChevronLeft,
  ZoomIn,
  Loader2,
  UserCheck,
  InboxIcon,
  AlertCircle,
  Ban,
  AlertOctagon,
  Lock,
  Unlock,
  Search,
  SlidersHorizontal,
  Users as UsersIcon,
  BookOpen as BookOpenIcon,
  BookUser,
  BarChart3,
  MoreVertical,
  ChevronDown,
  GraduationCap,
  UserPen,
  User,
  FileText,
  FileImage,
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import type { AdminTeacherResponse, AdminTeacherCertificateResponse } from "@/lib/api/admin";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Certificate = {
  id: string;
  name: string;
  issuedYear: number;
  issuedBy: string;
  type: "image" | "pdf";
  url: string;
  thumbnailUrl?: string;
};

type CertificateFromApi = AdminTeacherCertificateResponse;

type TeacherApplication = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  location: string;
  bio: string;
  experience: string;
  specialization: string;
  jlptLevel: string;
  appliedDate: string;
  status: "pending" | "approved" | "rejected" | "active" | "inactive";
  accountStatus: "ACTIVE" | "LOCKED";
  certificates: Certificate[];
  rejectionReason?: string | null;
};

// Map backend AdminTeacherResponse to display-friendly TeacherApplication
function mapToTeacherApplication(teacher: AdminTeacherResponse): TeacherApplication {
  const displayName = teacher.displayName;
  const emailName = teacher.email.split("@")[0];
  const nameParts = displayName
    ? displayName
        .split(/[.\s_]+/)
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    : emailName.split(/[._]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
  return {
    id: teacher.id,
    name: nameParts.join(" ") || emailName || "Teacher",
    email: teacher.email,
    avatarUrl: teacher.avatarUrl,
    location: teacher.location || "â€”",
    bio: teacher.bio || "â€”",
    experience: "â€”",
    specialization: "â€”",
    jlptLevel: "â€”",
    appliedDate: teacher.createdAt
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date(teacher.createdAt))
      : "â€”",
    status: "pending",
    accountStatus: (teacher as any).accountStatus || "ACTIVE",
    certificates: [],
    rejectionReason: teacher.rejectionReason ?? null,
  };
}

// Map backend AdminTeacherCertificateResponse to display Certificate
function mapApiCertificate(apiCert: AdminTeacherCertificateResponse): Certificate {
  const issuedYear = apiCert.issuedDate
    ? new Date(apiCert.issuedDate).getFullYear()
    : apiCert.createdAt
      ? new Date(apiCert.createdAt).getFullYear()
      : new Date().getFullYear();
  const isPdf =
    apiCert.certificateUrl &&
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

// â”€â”€â”€ Avatar color helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€â”€ Certificate Preview Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
            <h3 className="font-display font-bold text-primary-col text-base">
              {certificate.name}
            </h3>
            <p className="text-xs text-muted-col mt-0.5">
              {certificate.issuedBy} Â· {certificate.issuedYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {certificate.type === "pdf" && (
              <a
                href={certificate.url}
                download
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-(--status-rejected)/12 text-(--status-rejected) text-xs font-bold border border-(--status-rejected)/20 hover:bg-(--status-rejected)/20 transition"
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
              <div className="w-16 h-16 rounded-2xl bg-(--status-rejected)/15 flex items-center justify-center">
                <span className="text-(--status-rejected) font-black text-xl font-display">
                  PDF
                </span>
              </div>
              <p className="text-muted-col text-sm">PDF preview not available in browser.</p>
              <a
                href={certificate.url}
                download
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-(--status-rejected)/12 text-(--status-rejected) text-sm font-bold border border-(--status-rejected)/20 hover:bg-(--status-rejected)/20 transition"
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

// â”€â”€â”€ Reject Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    onConfirm(teacher.id, reason);
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
            <p className="text-muted-col text-xs mt-0.5">{teacher.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Teacher Info */}
          <div className="flex items-center gap-3 p-3 rounded-xl glass-surface">
            <div
              className={`w-10 h-10 rounded-xl bg-linear-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-bold text-sm shrink-0`}
            >
              {teacher.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-primary-col font-semibold text-sm truncate">{teacher.name}</p>
              <p className="text-muted-col text-xs truncate">{teacher.email}</p>
            </div>
          </div>

          {/* Reason Checklist */}
          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
              Select reason <span className="text-(--status-rejected)">*</span>
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
                        ? "bg-(--status-rejected)/12 text-(--status-rejected) border-(--status-rejected)/25"
                        : "glass-surface text-secondary-col"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          checked
                            ? "bg-(--status-rejected) border-(--status-rejected)"
                            : "border-border"
                        }`}
                      >
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
                Description{" "}
                <span className="text-(--status-rejected) normal-case font-normal">*</span>
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
            className="flex-1 py-2.5 rounded-xl bg-(--status-rejected)/15 text-(--status-rejected) text-sm font-bold border border-(--status-rejected)/25 hover:bg-(--status-rejected)/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
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

// â”€â”€â”€ Approve Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-(--status-active)/15 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-(--status-active)" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 text-center">
          <h3 className="font-display font-bold text-primary-col text-lg">
            Approve Teacher Application
          </h3>
          <p className="text-secondary-col text-sm mt-2 leading-relaxed">
            Are you sure you want to approve{" "}
            <span className="font-semibold text-primary-col">{teacher.name}</span> as a teacher?
            Their account will be activated and they can start using the platform.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(teacher.id)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-(--status-active)/15 text-(--status-active) text-sm font-bold border border-(--status-active)/25 hover:bg-(--status-active)/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
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
      </motion.div>
    </motion.div>
  );
}

// â”€â”€â”€ Lock Account Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LockAccountModal({
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
        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-(--status-rejected)/15 flex items-center justify-center">
            <Lock className="w-8 h-8 text-(--status-rejected)" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 text-center">
          <h3 className="font-display font-bold text-primary-col text-lg">Lock Teacher Account?</h3>
          <p className="text-secondary-col text-sm mt-2 leading-relaxed">
            Are you sure you want to lock the account for{" "}
            <span className="font-semibold text-primary-col">{teacher.name}</span>?
            <br />
            <span className="text-xs text-muted-col mt-1 block">
              This teacher will not be able to login or access the platform.
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(teacher.id)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-(--status-rejected)/15 text-(--status-rejected) text-sm font-bold border border-(--status-rejected)/25 hover:bg-(--status-rejected)/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Locking...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Lock Account
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// â”€â”€â”€ Unlock Account Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function UnlockAccountModal({
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
        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-(--status-active)/15 flex items-center justify-center">
            <Unlock className="w-8 h-8 text-(--status-active)" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 text-center">
          <h3 className="font-display font-bold text-primary-col text-lg">
            Unlock Teacher Account?
          </h3>
          <p className="text-secondary-col text-sm mt-2 leading-relaxed">
            Are you sure you want to unlock the account for{" "}
            <span className="font-semibold text-primary-col">{teacher.name}</span>?
            <br />
            <span className="text-xs text-muted-col mt-1 block">
              This teacher will be able to login and access the platform again.
            </span>
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(teacher.id)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-(--status-active)/15 text-(--status-active) text-sm font-bold border border-(--status-active)/25 hover:bg-(--status-active)/25 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Unlocking...
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" /> Unlock Account
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// â”€â”€â”€ Profile Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ProfileModal({
  teacher,
  certificates,
  onClose,
  onApprove,
  onReject,
  actionLoading,
  showActions = true,
}: {
  teacher: TeacherApplication;
  certificates: Certificate[];
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: boolean;
  showActions?: boolean;
}) {
  const safeCerts: Certificate[] = Array.isArray(certificates) ? certificates : [];
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const initials = teacher.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  const avatarColor = getAvatarColor(teacher.id);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative z-10 w-full max-w-2xl max-h-[90vh] glass-modal rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b separator">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-linear-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}
              >
                {initials}
              </div>
              <div>
                <h3 className="font-display font-bold text-primary-col text-base">
                  {teacher.name}
                </h3>
                <p className="text-muted-col text-xs">{teacher.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  teacher.status === "active"
                    ? "bg-(--status-active)/12 text-(--status-active) border-(--status-active)/25"
                    : teacher.status === "inactive"
                      ? "bg-muted-col/12 text-muted-col border-muted-col/25"
                      : teacher.status === "pending"
                        ? "bg-(--status-pending)/12 text-(--status-pending) border-(--status-pending)/25"
                        : "bg-(--status-rejected)/12 text-(--status-rejected) border-(--status-rejected)/25"
                }`}
              >
                {teacher.status === "active"
                  ? "Active"
                  : teacher.status === "inactive"
                    ? "Inactive"
                    : teacher.status === "pending"
                      ? "Pending"
                      : "Rejected"}
              </span>
              <button
                onClick={onClose}
                className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Personal Information
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Mail, label: "Email", value: teacher.email },
                  { icon: MapPin, label: "Location", value: teacher.location },
                  { icon: Calendar, label: "Applied Date", value: teacher.appliedDate },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-3 rounded-xl glass-surface">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
                        {label}
                      </span>
                    </div>
                    <p className="text-primary-col text-sm font-semibold leading-tight truncate">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h4 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Professional Information
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Award, label: "JLPT Level", value: teacher.jlptLevel },
                  { icon: Calendar, label: "Experience", value: teacher.experience },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-3 rounded-xl glass-surface">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
                        {label}
                      </span>
                    </div>
                    <p className="text-primary-col text-sm font-semibold leading-tight">{value}</p>
                  </div>
                ))}
              </div>
              {teacher.specialization && teacher.specialization !== "â€”" && (
                <div className="mt-3 p-3 rounded-xl glass-surface">
                  <div className="flex items-center gap-1.5 mb-1">
                    <BookOpen className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
                      Specialization
                    </span>
                  </div>
                  <p className="text-primary-col text-sm font-semibold">{teacher.specialization}</p>
                </div>
              )}
            </div>

            {/* Bio */}
            {teacher.bio && teacher.bio !== "â€”" && (
              <div>
                <h4 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Bio / Introduction
                </h4>
                <div className="p-4 rounded-xl glass-surface">
                  <p className="text-secondary-col text-sm leading-relaxed">{teacher.bio}</p>
                </div>
              </div>
            )}

            {/* Uploaded Documents */}
            <div>
              <h4 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileImage className="w-4 h-4" /> Uploaded Documents
                <span className="ml-auto px-2 py-0.5 rounded-full bg-glass-surface text-muted-col text-[10px] font-bold border border-glass-border">
                  {safeCerts.length}
                </span>
              </h4>
              {safeCerts.length === 0 ? (
                <p className="text-muted-col text-xs italic px-1">No certificates uploaded</p>
              ) : (
                <div className="space-y-2">
                  {safeCerts.map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-glass-border glass-surface hover:border-primary/25 transition"
                    >
                      <div className="shrink-0">
                        {cert.type === "image" ? (
                          <img
                            src={cert.thumbnailUrl || cert.url}
                            alt={cert.name}
                            className="w-12 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-8 rounded-lg bg-(--status-rejected)/15 flex items-center justify-center">
                            <span className="text-(--status-rejected) font-black text-[10px] font-display">
                              PDF
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-primary-col text-xs font-semibold truncate">
                          {cert.name}
                        </p>
                        <p className="text-muted-col text-[10px]">
                          {cert.issuedBy} Â· {cert.issuedYear}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setPreviewCert(cert)}
                          className="p-1.5 rounded-lg glass-surface text-secondary-col hover:text-primary transition"
                          title="View File"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={cert.url}
                          download
                          className="p-1.5 rounded-lg glass-surface text-secondary-col hover:text-primary transition"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-6 py-4 border-t separator flex gap-3">
            <button
              onClick={onClose}
              disabled={actionLoading}
              className="py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition disabled:opacity-40"
              style={{ flex: showActions ? 1 : "none", minWidth: "100px" }}
            >
              Close
            </button>
            {showActions && (
              <>
                <button
                  onClick={() => onReject(teacher.id)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-(--status-rejected)/12 text-(--status-rejected) text-sm font-bold border border-(--status-rejected)/20 hover:bg-(--status-rejected)/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}{" "}
                  Reject
                </button>
                <button
                  onClick={() => onApprove(teacher.id)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-(--status-active)/12 text-(--status-active) text-sm font-bold border border-(--status-active)/20 hover:bg-(--status-active)/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}{" "}
                  Approve
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Certificate Preview */}
      <AnimatePresence>
        {previewCert && (
          <CertificatePreviewModal certificate={previewCert} onClose={() => setPreviewCert(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// â”€â”€â”€ Teacher View-Only Drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TeacherViewDrawer({
  teacher,
  onClose,
  onApprove,
  onReject,
  showActions = true,
  actionLoading = false,
  onSuspend,
  teacherStatus = "pending",
  certificates = [],
  rejectionReason,
}: {
  teacher: TeacherApplication;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  showActions?: boolean;
  actionLoading?: boolean;
  onSuspend?: (id: string) => void;
  teacherStatus?: "pending" | "approved" | "rejected" | "active" | "inactive";
  certificates?: Certificate[];
  rejectionReason?: string | null;
}) {
  const safeCerts: Certificate[] = Array.isArray(certificates) ? certificates : [];
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const initials = teacher.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

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
            <span className="text-xs font-bold text-muted-col uppercase tracking-wider">
              View Profile
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-(--status-active)/12 text-(--status-active) border-(--status-active)/25">
            {teacher.status === "pending"
              ? "Pending"
              : teacher.status === "approved"
                ? "Approved"
                : teacher.status === "rejected"
                  ? "Rejected"
                  : teacher.status}
          </span>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-auto">
          {/* Avatar */}
          <div className="relative px-6 pt-6 pb-5">
            <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-primary/20 to-transparent rounded-b-3xl" />
            <div className="relative flex items-end gap-4">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-lg ring-4 ring-glass-border overflow-hidden ${
                  teacher.avatarUrl
                    ? "bg-transparent"
                    : `bg-linear-to-br ${getAvatarColor(teacher.id)}`
                }`}
              >
                {teacher.avatarUrl ? (
                  <img
                    src={teacher.avatarUrl}
                    alt={teacher.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.classList.add(
                        `bg-linear-to-br`,
                        ...getAvatarColor(teacher.id).split(" "),
                      );
                    }}
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="pb-1">
                <h2 className="font-display font-black text-primary-col text-xl leading-tight">
                  {teacher.name}
                </h2>
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
                    <span className="text-[10px] font-bold text-muted-col uppercase tracking-wider">
                      {label}
                    </span>
                  </div>
                  <p className="text-primary-col text-sm font-semibold leading-tight">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Specialization */}
          <div className="px-6 pb-5">
            <h4 className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Teaching Specialization
            </h4>
            <p className="text-primary-col text-sm">{teacher.specialization}</p>
          </div>

          {/* Bio */}
          <div className="px-6 pb-5">
            <h4 className="text-[10px] font-bold text-muted-col uppercase tracking-wider mb-2">
              Bio / Introduction
            </h4>
            <p className="text-secondary-col text-sm leading-relaxed">{teacher.bio}</p>
          </div>

          {/* Rejection Reason */}
          {(teacherStatus === "rejected" || teacher.status === "rejected") &&
          (rejectionReason ?? teacher.rejectionReason) ? (
            <div className="px-6 pb-5">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-(--status-rejected)/10 border border-(--status-rejected)/20">
                <AlertOctagon className="w-5 h-5 text-(--status-rejected) shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-(--status-rejected) mb-1">
                    Rejection Reason
                  </h4>
                  <p className="text-sm text-secondary-col leading-relaxed wrap-break-word">
                    {rejectionReason ?? teacher.rejectionReason}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Certificates */}
          <div className="px-6 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold text-secondary-col uppercase tracking-wider">
                Certificates
              </h4>
              <span className="ml-auto px-2 py-0.5 rounded-full bg-glass-surface text-muted-col text-[10px] font-bold border border-glass-border">
                {safeCerts.length}
              </span>
            </div>

            {safeCerts.length === 0 ? (
              <p className="text-muted-col text-xs italic">No certificates available</p>
            ) : (
              <div className="space-y-3">
                {safeCerts.map((cert) => (
                  <div
                    key={cert.id}
                    className="rounded-xl border border-glass-border overflow-hidden glass-surface hover:border-primary/25 transition"
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className="relative shrink-0">
                        {cert.type === "image" ? (
                          <img
                            src={cert.thumbnailUrl || cert.url}
                            alt={cert.name}
                            className="w-14 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-14 h-10 rounded-lg bg-(--status-rejected)/15 flex items-center justify-center">
                            <span className="text-(--status-rejected) font-black text-[10px] font-display">
                              PDF
                            </span>
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
                        <p className="text-primary-col text-xs font-semibold leading-tight truncate">
                          {cert.name}
                        </p>
                        <p className="text-muted-col text-[10px] mt-0.5">{cert.issuedBy}</p>
                        <p className="text-muted-col/60 text-[10px]">{cert.issuedYear}</p>
                      </div>
                      <button
                        onClick={() => setPreviewCert(cert)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/12 text-primary text-[10px] font-bold border border-primary/20 hover:bg-primary/20 transition"
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
                className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition disabled:opacity-40"
              >
                Close
              </button>
              {teacherStatus === "pending" && (
                <>
                  <button
                    onClick={() => onReject(teacher.id)}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl bg-(--status-rejected)/12 text-(--status-rejected) text-sm font-bold border border-(--status-rejected)/20 hover:bg-(--status-rejected)/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}{" "}
                    Reject
                  </button>
                  <button
                    onClick={() => onApprove(teacher.id)}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl bg-(--status-active)/12 text-(--status-active) text-sm font-bold border border-(--status-active)/20 hover:bg-(--status-active)/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}{" "}
                    Approve
                  </button>
                </>
              )}
              {teacherStatus === "approved" && (
                <button
                  onClick={() => onSuspend?.(teacher.id)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-(--status-rejected)/12 text-(--status-rejected) text-sm font-bold border border-(--status-rejected)/20 hover:bg-(--status-rejected)/20 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Ban className="w-4 h-4" />
                  )}{" "}
                  Deactivate
                </button>
              )}
            </div>
          </div>
        )}

        {!showActions && (
          <div className="px-6 py-4 border-t separator">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-accent transition"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>

      {/* Certificate Preview */}
      <AnimatePresence>
        {previewCert && (
          <CertificatePreviewModal certificate={previewCert} onClose={() => setPreviewCert(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

// â”€â”€â”€ Individual Teacher Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  const initials = teacher.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
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
        <div
          className={`w-14 h-14 rounded-2xl bg-linear-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-black text-xl shrink-0`}
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : initials}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + Applied */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-primary-col">{teacher.name}</div>
              <div className="text-xs text-muted-col">{teacher.email}</div>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-(--status-pending)">
              <Clock className="w-3 h-3" />
              {teacher.appliedDate}
            </div>
          </div>

          {/* Bio snippet */}
          <div className="mt-2 text-sm text-secondary-col leading-relaxed line-clamp-2">
            {teacher.bio}
          </div>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded-full bg-(--status-teacher)/12 text-(--status-teacher) text-[10px] font-bold">
              {teacher.experience}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-primary/12 text-primary text-[10px] font-bold">
              {teacher.jlptLevel}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-(--status-pending)/10 text-(--status-pending) text-[10px] font-bold">
              0 certs
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onApprove(teacher.id)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-(--status-active)/10 text-(--status-active) text-xs font-bold border border-(--status-active)/20 hover:bg-(--status-active)/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}{" "}
              Approve
            </button>
            <button
              onClick={() => onReject(teacher.id)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-(--status-rejected)/10 text-(--status-rejected) text-xs font-bold border border-(--status-rejected)/20 hover:bg-(--status-rejected)/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}{" "}
              Reject
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

// â”€â”€â”€ Toast Notification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-100 flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border shadow-xl glass-modal ${
            isSuccess
              ? "bg-(--status-active)/15 text-(--status-active) border-(--status-active)/25"
              : "bg-(--status-rejected)/15 text-(--status-rejected) border-(--status-rejected)/25"
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

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const Route = createFileRoute("/admin/teachers")({ component: TeachersPage });

function TeachersPage() {
  const [tab, setTab] = useState<"pending" | "list">("pending");
  const [pendingTeachers, setPendingTeachers] = useState<TeacherApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<TeacherApplication | null>(null);
  const [viewingCertificates, setViewingCertificates] = useState<Certificate[]>([]);
  const [viewingApproved, setViewingApproved] = useState<TeacherApplication | null>(null);
  const [viewingApprovedCertificates, setViewingApprovedCertificates] = useState<Certificate[]>([]);
  const [rejectTarget, setRejectTarget] = useState<TeacherApplication | null>(null);
  const [approveTarget, setApproveTarget] = useState<TeacherApplication | null>(null);
  const [viewProfileTarget, setViewProfileTarget] = useState<TeacherApplication | null>(null);
  const [viewProfileCerts, setViewProfileCerts] = useState<Certificate[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [classesDrawerOpen, setClassesDrawerOpen] = useState(false);
  const [classesDrawerTeacher, setClassesDrawerTeacher] = useState<TeacherApplication | null>(null);

  // Lock/Unlock state
  const [lockTarget, setLockTarget] = useState<TeacherApplication | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<TeacherApplication | null>(null);

  // Teacher List state
  const [listTeachers, setListTeachers] = useState<TeacherApplication[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Mock data for Teacher Approval
  const mockPendingTeachers: TeacherApplication[] = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Sakura Yamamoto",
      email: "sakura.yamamoto@example.com",
      avatarUrl: null,
      location: "Tokyo, Japan",
      bio: "Passionate Japanese language teacher with 5 years of experience teaching students from beginner to advanced levels.",
      experience: "5 years",
      specialization: "JLPT Preparation, Conversational Japanese",
      jlptLevel: "N1",
      appliedDate: "Jun 15, 2026",
      status: "pending",
      accountStatus: "ACTIVE",
      certificates: [],
      rejectionReason: null,
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Kenji Tanaka",
      email: "kenji.tanaka@example.com",
      avatarUrl: null,
      location: "Osaka, Japan",
      bio: "Experienced educator specializing in teaching Japanese to foreign students. Patient and dedicated to student success.",
      experience: "7 years",
      specialization: "Business Japanese, Grammar",
      jlptLevel: "N1",
      appliedDate: "Jun 14, 2026",
      status: "pending",
      accountStatus: "ACTIVE",
      certificates: [],
      rejectionReason: null,
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Yuki Sato",
      email: "yuki.sato@example.com",
      avatarUrl: null,
      location: "Kyoto, Japan",
      bio: "Native Japanese speaker with a passion for teaching. I focus on practical conversation skills and cultural understanding.",
      experience: "3 years",
      specialization: "Conversational Japanese, Culture",
      jlptLevel: "N2",
      appliedDate: "Jun 13, 2026",
      status: "pending",
      accountStatus: "ACTIVE",
      certificates: [],
      rejectionReason: null,
    },
    {
      id: "00000000-0000-0000-0000-000000000004",
      name: "Hana Watanabe",
      email: "hana.watanabe@example.com",
      avatarUrl: null,
      location: "Nagoya, Japan",
      bio: "Dedicated Japanese teacher with experience teaching all levels. I use interactive methods to make learning enjoyable.",
      experience: "4 years",
      specialization: "JLPT N3/N4 Preparation, Listening",
      jlptLevel: "N1",
      appliedDate: "Jun 12, 2026",
      status: "pending",
      accountStatus: "ACTIVE",
      certificates: [],
      rejectionReason: null,
    },
    {
      id: "00000000-0000-0000-0000-000000000005",
      name: "Takeshi Ito",
      email: "takeshi.ito@example.com",
      avatarUrl: null,
      location: "Hiroshima, Japan",
      bio: "Language instructor with background in linguistics. I help students build strong foundations in Japanese.",
      experience: "6 years",
      specialization: "Pronunciation, Grammar",
      jlptLevel: "N1",
      appliedDate: "Jun 10, 2026",
      status: "pending",
      accountStatus: "ACTIVE",
      certificates: [],
      rejectionReason: null,
    },
  ];

  // Mock classes data for Teacher List
  type TeacherClassInfo = {
    id: string;
    name: string;
    level: string;
    students: number;
    completionRate: number;
    avgScore: number;
    status: "active" | "inactive" | "completed";
    startDate: string;
    endDate?: string;
  };

  const mockTeacherClasses: Record<string, TeacherClassInfo[]> = {
    "00000000-0000-0000-0000-000000000011": [
      {
        id: "cls-001",
        name: "JLPT N5 Intensive",
        level: "N5",
        students: 28,
        completionRate: 92,
        avgScore: 85,
        status: "active",
        startDate: "Jan 15, 2026",
      },
      {
        id: "cls-002",
        name: "JLPT N4 Prep Course",
        level: "N4",
        students: 22,
        completionRate: 85,
        avgScore: 78,
        status: "active",
        startDate: "Feb 1, 2026",
      },
      {
        id: "cls-003",
        name: "Business Japanese",
        level: "N2",
        students: 18,
        completionRate: 78,
        avgScore: 82,
        status: "active",
        startDate: "Mar 10, 2026",
      },
      {
        id: "cls-004",
        name: "Advanced Grammar",
        level: "N1",
        students: 28,
        completionRate: 88,
        avgScore: 80,
        status: "active",
        startDate: "Apr 5, 2026",
      },
    ],
    "00000000-0000-0000-0000-000000000012": [
      {
        id: "cls-005",
        name: "Conversational Japanese",
        level: "Mixed",
        students: 24,
        completionRate: 95,
        avgScore: 88,
        status: "active",
        startDate: "Jan 20, 2026",
      },
      {
        id: "cls-006",
        name: "Japanese Culture & Customs",
        level: "Mixed",
        students: 20,
        completionRate: 88,
        avgScore: 85,
        status: "active",
        startDate: "Feb 15, 2026",
      },
      {
        id: "cls-007",
        name: "Beginner Japanese",
        level: "N5",
        students: 28,
        completionRate: 90,
        avgScore: 82,
        status: "active",
        startDate: "Mar 1, 2026",
      },
    ],
    "00000000-0000-0000-0000-000000000013": [
      {
        id: "cls-008",
        name: "Beginner Japanese A1",
        level: "N5",
        students: 24,
        completionRate: 85,
        avgScore: 80,
        status: "active",
        startDate: "Feb 1, 2026",
      },
      {
        id: "cls-009",
        name: "Listening Practice",
        level: "N4",
        students: 24,
        completionRate: 80,
        avgScore: 78,
        status: "active",
        startDate: "Mar 15, 2026",
      },
    ],
    "00000000-0000-0000-0000-000000000014": [
      {
        id: "cls-010",
        name: "Grammar Masterclass",
        level: "N3",
        students: 18,
        completionRate: 72,
        avgScore: 75,
        status: "completed",
        startDate: "Oct 1, 2025",
        endDate: "Dec 31, 2025",
      },
      {
        id: "cls-011",
        name: "JLPT Reading Prep",
        level: "N2",
        students: 18,
        completionRate: 78,
        avgScore: 72,
        status: "completed",
        startDate: "Oct 1, 2025",
        endDate: "Dec 31, 2025",
      },
    ],
  };

  const getTeacherClasses = (teacherId: string): TeacherClassInfo[] => {
    return mockTeacherClasses[teacherId] || [];
  };

  const fetchPendingTeachers = useCallback(async () => {
    try {
      setError(null);
      // TODO: Replace with actual API call when backend is ready
      // const users = await adminApi.getPendingTeachers();
      // const mapped = users.map(mapToTeacherApplication);
      // setPendingTeachers(mapped);

      // Using mock data for demonstration
      setTimeout(() => {
        setPendingTeachers(mockPendingTeachers);
        setLoading(false);
      }, 500);
    } catch (err) {
      const message =
        err instanceof ApiError
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

  // Mock data for Teacher List
  const mockListTeachers: TeacherApplication[] = [
    {
      id: "00000000-0000-0000-0000-000000000011",
      name: "Minato Watanabe",
      email: "minato.watanabe@example.com",
      avatarUrl: null,
      location: "Tokyo, Japan",
      bio: "Professional Japanese teacher with 8 years of teaching experience.",
      experience: "8 years",
      specialization: "JLPT Preparation, Business Japanese",
      jlptLevel: "N1",
      appliedDate: "Mar 10, 2026",
      status: "active",
      accountStatus: "ACTIVE",
      certificates: [],
      rejectionReason: null,
    },
    {
      id: "00000000-0000-0000-0000-000000000012",
      name: "Rin Nakamura",
      email: "rin.nakamura@example.com",
      avatarUrl: null,
      location: "Kyoto, Japan",
      bio: "Experienced Japanese instructor specializing in conversational skills.",
      experience: "6 years",
      specialization: "Conversational Japanese, Culture",
      jlptLevel: "N1",
      appliedDate: "Feb 15, 2026",
      status: "active",
      accountStatus: "ACTIVE",
      certificates: [],
      rejectionReason: null,
    },
    {
      id: "00000000-0000-0000-0000-000000000013",
      name: "Haruki Suzuki",
      email: "haruki.suzuki@example.com",
      avatarUrl: null,
      location: "Osaka, Japan",
      bio: "Native speaker with a passion for teaching Japanese to international students.",
      experience: "4 years",
      specialization: "Beginner Japanese, Listening",
      jlptLevel: "N2",
      appliedDate: "Jan 20, 2026",
      status: "active",
      accountStatus: "ACTIVE",
      certificates: [],
      rejectionReason: null,
    },
    {
      id: "00000000-0000-0000-0000-000000000014",
      name: "Aoi Kobayashi",
      email: "aoi.kobayashi@example.com",
      avatarUrl: null,
      location: "Nagoya, Japan",
      bio: "Dedicated educator focused on grammar and reading comprehension.",
      experience: "5 years",
      specialization: "Grammar, Reading",
      jlptLevel: "N1",
      appliedDate: "Dec 5, 2025",
      status: "inactive",
      accountStatus: "LOCKED",
      certificates: [],
      rejectionReason: null,
    },
  ];

  const fetchListTeachers = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      // TODO: Replace with actual API call when backend is ready
      // const users = await adminApi.getActiveTeachers();
      // const mapped = users.map(mapToTeacherApplication);
      // setListTeachers(mapped);

      // Using mock data for demonstration
      setTimeout(() => {
        setListTeachers(mockListTeachers);
        setListLoading(false);
      }, 500);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load teacher list. Please try again.";
      setListError(message);
      setListTeachers([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  // Load pending on mount
  useEffect(() => {
    fetchPendingTeachers();
  }, [fetchPendingTeachers]);

  // Load pending when switching to pending tab
  useEffect(() => {
    if (tab === "pending" && pendingTeachers.length === 0 && !loading && !error) {
      fetchPendingTeachers();
    }
  }, [tab, pendingTeachers.length, loading, error, fetchPendingTeachers]);

  // Load list when switching to list tab
  useEffect(() => {
    if (tab === "list" && listTeachers.length === 0 && !listLoading && !listError) {
      fetchListTeachers();
    }
  }, [tab, listTeachers.length, listLoading, listError, fetchListTeachers]);

  const handleApprove = useCallback(
    async (id: string) => {
      setActionLoadingId(id);
      try {
        // Skip API call for mock data
        if (id.startsWith("00000000-")) {
          // Update local state for mock data
          setPendingTeachers((prev) => prev.filter((t) => t.id !== id));
          setListTeachers((prev) => {
            const teacher = pendingTeachers.find((t) => t.id === id);
            if (teacher) {
              return [...prev, { ...teacher, status: "active" as const }];
            }
            return prev;
          });
          showToast("Teacher approved successfully!", "success");
        } else {
          await adminApi.approveTeacher(id);
          showToast("Teacher approved successfully!", "success");
          await Promise.all([fetchPendingTeachers(), fetchListTeachers()]);
        }
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to approve teacher. Please try again.";
        showToast(message, "error");
      } finally {
        setActionLoadingId(null);
      }
    },
    [pendingTeachers, showToast],
  );

  const handleReject = useCallback(
    async (id: string, reason: string) => {
      setActionLoadingId(id);
      try {
        // Skip API call for mock data
        if (id.startsWith("00000000-")) {
          // Update local state for mock data - just remove from pending
          setPendingTeachers((prev) => prev.filter((t) => t.id !== id));
          showToast("Teacher application rejected.", "error");
        } else {
          await adminApi.rejectTeacher(id, { reason });
          showToast("Teacher application rejected.", "error");
          await fetchPendingTeachers();
        }
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to reject teacher. Please try again.";
        showToast(message, "error");
      } finally {
        setActionLoadingId(null);
      }
    },
    [showToast],
  );

  const handleRejectConfirm = useCallback(
    async (id: string, reason: string) => {
      await handleReject(id, reason);
      setRejectTarget(null);
    },
    [handleReject],
  );

  const handleSuspend = useCallback(
    async (id: string) => {
      setActionLoadingId(id);
      try {
        // Skip API call for mock data
        if (!id.startsWith("00000000-")) {
          await adminApi.suspendTeacher(id);
        }
        showToast("Teacher deactivated.", "success");
        setViewingApproved(null);
        await fetchListTeachers();
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to deactivate teacher. Please try again.";
        showToast(message, "error");
      } finally {
        setActionLoadingId(null);
      }
    },
    [showToast, fetchListTeachers],
  );

  const handleLock = useCallback(
    async (id: string) => {
      setActionLoadingId(id);
      try {
        // Skip API call for mock data
        if (!id.startsWith("00000000-")) {
          // TODO: Call adminApi.lockTeacher(id) when available
        }
        // Update local state
        setListTeachers((prev) =>
          prev.map((t) => (t.id === id ? { ...t, accountStatus: "LOCKED" as const } : t)),
        );
        showToast("Teacher account has been locked.", "success");
        setLockTarget(null);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to lock teacher account. Please try again.";
        showToast(message, "error");
      } finally {
        setActionLoadingId(null);
      }
    },
    [showToast],
  );

  const handleUnlock = useCallback(
    async (id: string) => {
      setActionLoadingId(id);
      try {
        // Skip API call for mock data
        if (!id.startsWith("00000000-")) {
          // TODO: Call adminApi.unlockTeacher(id) when available
        }
        // Update local state
        setListTeachers((prev) =>
          prev.map((t) => (t.id === id ? { ...t, accountStatus: "ACTIVE" as const } : t)),
        );
        showToast("Teacher account has been unlocked.", "success");
        setUnlockTarget(null);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to unlock teacher account. Please try again.";
        showToast(message, "error");
      } finally {
        setActionLoadingId(null);
      }
    },
    [showToast],
  );

  const fetchTeacherCertificates = useCallback(
    async (teacherId: string): Promise<Certificate[]> => {
      // Skip API call for mock data
      if (teacherId.startsWith("00000000-")) {
        return [];
      }
      const certs = await adminApi.getTeacherCertificates(teacherId);
      return certs.map(mapApiCertificate);
    },
    [],
  );

  const pendingCount = pendingTeachers.length;

  // Filtered teachers for pending tab
  const filteredPendingTeachers = pendingTeachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || teacher.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered teachers for list view
  const filteredListTeachers = listTeachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || teacher.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalTeachers = listTeachers.length;
  const activeTeachers = listTeachers.filter((t) => t.status === "active").length;
  const totalClasses = listTeachers.reduce((sum, t) => sum + (t as any).totalClasses || 0, 0);
  const totalStudents = listTeachers.reduce((sum, t) => sum + (t as any).totalStudents || 0, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-primary-col">Teacher Management</h1>
          <p className="text-sm text-secondary-col mt-0.5">
            Manage teachers and review applications
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass-card p-1 w-fit">
        {(["pending", "list"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
              tab === t ? "bg-gradient-hero text-white shadow-md" : "text-secondary-col nav-item"
            }`}
          >
            {t === "pending" ? `Teacher Approval` : "Teacher List"}
          </button>
        ))}
      </div>

      {/* Teacher Approval Tab */}
      {tab === "pending" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-(--status-pending)/12 flex items-center justify-center">
                <Clock className="w-5 h-5 text-(--status-pending)" />
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Pending
                </p>
                <p className="font-display font-black text-lg text-primary-col">{pendingCount}</p>
              </div>
            </div>
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Today
                </p>
                <p className="font-display font-black text-lg text-primary-col">
                  {
                    pendingTeachers.filter((t) => {
                      const today = new Date().toDateString();
                      return new Date(t.appliedDate).toDateString() === today;
                    }).length
                  }
                </p>
              </div>
            </div>
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-(--status-active)/12 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-(--status-active)" />
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  This Week
                </p>
                <p className="font-display font-black text-lg text-primary-col">
                  {
                    pendingTeachers.filter((t) => {
                      const d = new Date(t.appliedDate);
                      const now = new Date();
                      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                      return d >= weekAgo;
                    }).length
                  }
                </p>
              </div>
            </div>
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/12 flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Certified
                </p>
                <p className="font-display font-black text-lg text-primary-col">
                  {pendingTeachers.filter((t) => t.jlptLevel && t.jlptLevel !== "â€”").length}
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-surface border border-glass-border text-sm text-primary-col placeholder:text-muted-col focus:outline-none focus:border-primary/40 transition"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-9 pr-8 py-2.5 rounded-xl glass-surface border border-glass-border text-sm text-primary-col focus:outline-none focus:border-primary/40 transition appearance-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl empty-state gap-4 animate-pulse">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-secondary-col font-semibold text-sm">
                Loading pending teachers...
              </p>
              <p className="text-muted-col text-xs">
                Please wait while information is being prepared.
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl empty-state gap-3">
              <AlertTriangle className="w-10 h-10 text-(--status-rejected)/70" />
              <p className="text-primary-col font-bold text-sm">Something went wrong.</p>
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
              <InboxIcon className="w-12 h-12 text-(--status-pending)/40 mb-3" />
              <p className="text-secondary-col font-semibold text-sm">
                All caught up â€” no pending applications!
              </p>
              <p className="text-muted-col text-xs mt-1">
                There are currently no records to review.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredPendingTeachers.length === 0 &&
            pendingTeachers.length > 0 && (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl empty-state">
                <Search className="w-10 h-10 text-muted-col/40 mb-3" />
                <p className="text-secondary-col font-semibold text-sm">No results found.</p>
                <p className="text-muted-col text-xs mt-1">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}

          {!loading && !error && filteredPendingTeachers.length > 0 && (
            <div className="card-base overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
                <div className="col-span-3">Teacher</div>
                <div className="col-span-3 text-center">Email</div>
                <div className="col-span-2 text-center">Applied Date</div>
                <div className="col-span-1 text-center">JLPT</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Table Rows */}
              {filteredPendingTeachers.map((teacher) => {
                const initials = teacher.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2);
                const avatarColor = getAvatarColor(teacher.id);
                const isLoading = actionLoadingId === teacher.id;
                const statusColors: Record<string, string> = {
                  pending: "text-(--status-pending) bg-(--status-pending)/12",
                  approved: "text-(--status-active) bg-(--status-active)/12",
                  rejected: "text-(--status-rejected) bg-(--status-rejected)/12",
                };
                const statusLabels: Record<string, string> = {
                  pending: "Pending",
                  approved: "Approved",
                  rejected: "Rejected",
                };
                return (
                  <div
                    key={teacher.id}
                    className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-border hover:bg-accent/50 transition items-center"
                  >
                    {/* Teacher */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl bg-linear-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-xs shrink-0`}
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-primary-col font-semibold text-sm truncate">
                          {teacher.name}
                        </p>
                        <p className="text-muted-col text-[10px] truncate">
                          {teacher.jlptLevel !== "â€”" ? teacher.jlptLevel : "â€”"}
                        </p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-span-3 text-center text-xs text-secondary-col truncate px-2">
                      {teacher.email}
                    </div>

                    {/* Applied Date */}
                    <div className="col-span-2 text-center text-xs text-muted-col">
                      {teacher.appliedDate}
                    </div>

                    {/* JLPT */}
                    <div className="col-span-1 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-primary/12 text-primary text-[10px] font-bold">
                        {teacher.jlptLevel !== "â€”" ? teacher.jlptLevel : "â€”"}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold ${statusColors[teacher.status] || statusColors.pending}`}
                      >
                        {statusLabels[teacher.status] || "Pending"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Profile */}
                        <button
                          onClick={async () => {
                            const certs = await fetchTeacherCertificates(teacher.id);
                            setViewProfileTarget(teacher);
                            setViewProfileCerts(certs);
                          }}
                          disabled={isLoading}
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition disabled:opacity-40"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Approve */}
                        <button
                          onClick={() => setApproveTarget(teacher)}
                          disabled={isLoading}
                          className="p-2 rounded-lg bg-[var(--status-active)]/10 text-[var(--status-active)] hover:bg-[var(--status-active)]/20 transition disabled:opacity-40"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>

                        {/* Reject */}
                        <button
                          onClick={() => setRejectTarget(teacher)}
                          disabled={isLoading}
                          className="p-2 rounded-lg bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/20 transition disabled:opacity-40"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Teacher List Tab */}
      {tab === "list" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Total Teachers
                </p>
                <p className="font-display font-black text-lg text-primary-col">{totalTeachers}</p>
              </div>
            </div>
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[var(--status-active)]" />
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Active Teachers
                </p>
                <p className="font-display font-black text-lg text-primary-col">{activeTeachers}</p>
              </div>
            </div>
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/12 flex items-center justify-center">
                <BookOpenIcon className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Total Classes
                </p>
                <p className="font-display font-black text-lg text-primary-col">{totalClasses}</p>
              </div>
            </div>
            <div className="card-base p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/12 flex items-center justify-center">
                <BookUser className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                  Total Students
                </p>
                <p className="font-display font-black text-lg text-primary-col">{totalStudents}</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
              <input
                type="text"
                placeholder="Search by teacher name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-surface border border-glass-border text-sm text-primary-col placeholder:text-muted-col focus:outline-none focus:border-primary/40 transition"
              />
            </div>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-9 pr-8 py-2.5 rounded-xl glass-surface border border-glass-border text-sm text-primary-col focus:outline-none focus:border-primary/40 transition appearance-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Teacher List Table */}
          {listLoading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl empty-state gap-4 animate-pulse">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-secondary-col font-semibold text-sm">Loading teacher list...</p>
              <p className="text-muted-col text-xs">
                Please wait while information is being prepared.
              </p>
            </div>
          ) : listError ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl empty-state gap-3">
              <AlertTriangle className="w-10 h-10 text-(--status-rejected)/70" />
              <p className="text-primary-col font-bold text-sm">Something went wrong.</p>
              <p className="text-secondary-col font-semibold text-sm">{listError}</p>
              <button
                onClick={fetchListTeachers}
                className="px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition"
              >
                Try Again
              </button>
            </div>
          ) : filteredListTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl empty-state">
              <UsersIcon className="w-12 h-12 text-(--status-active)/40 mb-3" />
              <p className="text-secondary-col font-semibold text-sm">No teachers found.</p>
              <p className="text-muted-col text-xs mt-1">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="card-base overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
                <div className="col-span-3">Teacher</div>
                <div className="col-span-2 text-center">Classes</div>
                <div className="col-span-2 text-center">Students</div>
                <div className="col-span-2 text-center">Account</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>
              {filteredListTeachers.map((teacher) => {
                const initials = teacher.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2);
                const avatarColor = getAvatarColor(teacher.id);
                const teacherClasses = (teacher as any).totalClasses || 0;
                const teacherStudents = (teacher as any).totalStudents || 0;
                const accountStatus = teacher.accountStatus;
                const accountStatusColor =
                  accountStatus === "ACTIVE"
                    ? "text-(--status-active) bg-(--status-active)/12"
                    : "text-(--status-rejected) bg-(--status-rejected)/12";
                const accountStatusLabel = accountStatus === "ACTIVE" ? "Active" : "Locked";

                return (
                  <div
                    key={teacher.id}
                    className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-border hover:bg-accent transition items-center"
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl bg-linear-to-br ${avatarColor} flex items-center justify-center text-white font-bold text-xs shrink-0`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-primary-col font-semibold text-sm truncate">
                          {teacher.name}
                        </p>
                        <p className="text-muted-col text-[10px] truncate">{teacher.email}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-center text-xs text-secondary-col">
                      {teacherClasses}
                    </div>
                    <div className="col-span-2 text-center text-xs text-secondary-col">
                      {teacherStudents}
                    </div>
                    <div className="col-span-2 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${accountStatusColor}`}
                      >
                        {accountStatus === "ACTIVE" ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                        {accountStatusLabel}
                      </span>
                    </div>
                    <div className="col-span-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Profile */}
                        <button
                          onClick={async () => {
                            const certs = await fetchTeacherCertificates(teacher.id);
                            setViewProfileTarget(teacher);
                            setViewProfileCerts(certs);
                          }}
                          disabled={listLoading}
                          className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition disabled:opacity-40"
                          title="View Profile"
                        >
                          <UserPen className="w-4 h-4" />
                        </button>
                        {/* View Classes */}
                        <button
                          onClick={() => {
                            setClassesDrawerTeacher(teacher);
                            setClassesDrawerOpen(true);
                          }}
                          disabled={listLoading}
                          className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition disabled:opacity-40"
                          title="View Classes"
                        >
                          <GraduationCap className="w-4 h-4" />
                        </button>
                        {/* Lock/Unlock Button */}
                        {accountStatus === "ACTIVE" ? (
                          <button
                            onClick={() => setLockTarget(teacher)}
                            disabled={listLoading}
                            className="p-1.5 rounded-lg bg-(--status-rejected)/10 text-(--status-rejected) hover:bg-(--status-rejected)/20 transition disabled:opacity-40"
                            title="Lock Account"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setUnlockTarget(teacher)}
                            disabled={listLoading}
                            className="p-1.5 rounded-lg bg-(--status-active)/10 text-(--status-active) hover:bg-(--status-active)/20 transition disabled:opacity-40"
                            title="Unlock Account"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* View Profile Drawer */}
      <AnimatePresence>
        {viewing && (
          <TeacherViewDrawer
            teacher={viewing}
            onClose={() => setViewing(null)}
            onApprove={(id) => {
              handleApprove(id);
              setViewing(null);
            }}
            onReject={(id) => {
              setViewing(null);
              const t = pendingTeachers.find((x) => x.id === id);
              if (t) setRejectTarget(t);
            }}
            showActions
            actionLoading={actionLoadingId !== null}
            certificates={viewingCertificates}
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

      {/* Approve Modal */}
      <AnimatePresence>
        {approveTarget && (
          <ApproveModal
            teacher={approveTarget}
            onConfirm={async (id) => {
              await handleApprove(id);
              setApproveTarget(null);
            }}
            onClose={() => setApproveTarget(null)}
            loading={actionLoadingId === approveTarget.id}
          />
        )}
      </AnimatePresence>

      {/* Lock Account Modal */}
      <AnimatePresence>
        {lockTarget && (
          <LockAccountModal
            teacher={lockTarget}
            onConfirm={async (id) => {
              await handleLock(id);
            }}
            onClose={() => setLockTarget(null)}
            loading={actionLoadingId === lockTarget.id}
          />
        )}
      </AnimatePresence>

      {/* Unlock Account Modal */}
      <AnimatePresence>
        {unlockTarget && (
          <UnlockAccountModal
            teacher={unlockTarget}
            onConfirm={async (id) => {
              await handleUnlock(id);
            }}
            onClose={() => setUnlockTarget(null)}
            loading={actionLoadingId === unlockTarget.id}
          />
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {viewProfileTarget && (
          <ProfileModal
            teacher={viewProfileTarget}
            certificates={viewProfileCerts}
            onClose={() => {
              setViewProfileTarget(null);
              setViewProfileCerts([]);
            }}
            onApprove={async (id) => {
              await handleApprove(id);
              setViewProfileTarget(null);
              setViewProfileCerts([]);
            }}
            onReject={(id) => {
              setViewProfileTarget(null);
              setViewProfileCerts([]);
              const t = pendingTeachers.find((x) => x.id === id);
              if (t) setRejectTarget(t);
            }}
            actionLoading={actionLoadingId !== null}
            showActions={viewProfileTarget.status === "pending"}
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
            showActions
            actionLoading={actionLoadingId !== null}
            onSuspend={handleSuspend}
            teacherStatus="approved"
            certificates={viewingApprovedCertificates}
          />
        )}
      </AnimatePresence>

      {/* Classes Drawer */}
      <AnimatePresence>
        {classesDrawerOpen && classesDrawerTeacher && (
          <motion.div
            className="fixed inset-0 z-50 flex"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setClassesDrawerOpen(false)}
            />
            <motion.div
              className="relative z-10 ml-auto h-full w-full max-w-2xl glass-modal shadow-2xl flex flex-col overflow-hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b separator">
                <div>
                  <h3 className="font-display font-bold text-primary-col text-lg">
                    Teacher Classes
                  </h3>
                  <p className="text-muted-col text-sm mt-0.5">{classesDrawerTeacher.name}</p>
                </div>
                <button
                  onClick={() => setClassesDrawerOpen(false)}
                  className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Classes List */}
              <div className="flex-1 overflow-auto p-6">
                {(() => {
                  const classes = getTeacherClasses(classesDrawerTeacher.id);
                  if (classes.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-col">
                        <BookOpenIcon className="w-12 h-12 mb-3 opacity-40" />
                        <p className="text-sm">No classes found</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {classes.map((cls) => (
                        <div key={cls.id} className="card-base p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-primary-col">{cls.name}</h4>
                              <p className="text-xs text-muted-col mt-0.5">{cls.level} Level</p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                                cls.status === "active"
                                  ? "bg-(--status-active)/12 text-(--status-active)"
                                  : cls.status === "completed"
                                    ? "bg-blue-500/12 text-blue-500"
                                    : "bg-muted-col/12 text-muted-col"
                              }`}
                            >
                              {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                              <p className="text-lg font-bold text-primary-col">{cls.students}</p>
                              <p className="text-[10px] text-muted-col">Students</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-primary-col">
                                {cls.completionRate}%
                              </p>
                              <p className="text-[10px] text-muted-col">Completion</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-primary-col">{cls.avgScore}</p>
                              <p className="text-[10px] text-muted-col">Avg Score</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-col mt-3">
                            Started: {cls.startDate}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toast?.message ?? ""} type={toast?.type ?? "success"} visible={!!toast} />
    </div>
  );
}
