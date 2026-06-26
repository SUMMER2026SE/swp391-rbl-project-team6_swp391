import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  Star,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Ban,
  Key,
  Trash2,
  BarChart3,
  BookUser,
  Plus,
  X,
  Loader2,
  ExternalLink,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Download,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TeacherClass = {
  id: string;
  name: string;
  level: string;
  students: number;
  completionRate: number;
  status: "active" | "inactive";
};

type RecentActivity = {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  icon: string;
};

type TeacherProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  joinDate: string;
  avatarUrl?: string | null;
  bio?: string;
  qualification?: string;
  experience?: string;
  specialization?: string;
  jlptLevel: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  totalClasses: number;
  totalStudents: number;
  avgScore: number;
  completionRate: number;
  attendanceRate: number;
  classes: TeacherClass[];
  recentActivity: RecentActivity[];
};

// Mock teachers database - matches IDs from admin.teachers.tsx
const MOCK_TEACHERS: Record<string, TeacherProfile> = {
  "00000000-0000-0000-0000-000000000011": {
    id: "00000000-0000-0000-0000-000000000011",
    name: "Minato Watanabe",
    email: "minato.watanabe@example.com",
    phone: "+81 90 1234 5678",
    gender: "Male",
    dateOfBirth: "1988-03-20",
    address: "Shibuya, Tokyo, Japan",
    joinDate: "March 10, 2026",
    avatarUrl: null,
    bio: "Professional Japanese teacher with 8 years of teaching experience. Specializes in JLPT preparation and business Japanese for corporate clients.",
    qualification: "Master's Degree in Japanese Linguistics",
    experience: "8 Years",
    specialization: "JLPT Preparation, Business Japanese",
    jlptLevel: "N1",
    status: "ACTIVE",
    totalClasses: 4,
    totalStudents: 96,
    avgScore: 85,
    completionRate: 88,
    attendanceRate: 94,
    classes: [
      {
        id: "cls-001",
        name: "JLPT N5 Intensive",
        level: "N5",
        students: 28,
        completionRate: 92,
        status: "active",
      },
      {
        id: "cls-002",
        name: "JLPT N4 Prep Course",
        level: "N4",
        students: 22,
        completionRate: 85,
        status: "active",
      },
      {
        id: "cls-003",
        name: "Business Japanese",
        level: "N2",
        students: 18,
        completionRate: 78,
        status: "active",
      },
      {
        id: "cls-004",
        name: "Advanced Grammar",
        level: "N1",
        students: 28,
        completionRate: 88,
        status: "active",
      },
    ],
    recentActivity: [
      {
        id: "act-001",
        action: "Created",
        description: "Created JLPT N5 Intensive class",
        timestamp: "2 hours ago",
        icon: "book",
      },
      {
        id: "act-002",
        action: "Assigned",
        description: "Assigned homework to 28 students",
        timestamp: "Yesterday",
        icon: "clipboard",
      },
      {
        id: "act-003",
        action: "Published",
        description: "Published new announcement",
        timestamp: "2 days ago",
        icon: "megaphone",
      },
    ],
  },
  "00000000-0000-0000-0000-000000000012": {
    id: "00000000-0000-0000-0000-000000000012",
    name: "Rin Nakamura",
    email: "rin.nakamura@example.com",
    phone: "+81 80 9876 5432",
    gender: "Female",
    dateOfBirth: "1992-07-15",
    address: "Kyoto, Japan",
    joinDate: "February 15, 2026",
    avatarUrl: null,
    bio: "Experienced Japanese instructor specializing in conversational skills and Japanese culture. Patient and dedicated to helping students achieve fluency.",
    qualification: "Bachelor's in Japanese Language Education",
    experience: "6 Years",
    specialization: "Conversational Japanese, Culture",
    jlptLevel: "N1",
    status: "ACTIVE",
    totalClasses: 3,
    totalStudents: 72,
    avgScore: 88,
    completionRate: 92,
    attendanceRate: 96,
    classes: [
      {
        id: "cls-005",
        name: "Conversational Japanese",
        level: "Mixed",
        students: 24,
        completionRate: 95,
        status: "active",
      },
      {
        id: "cls-006",
        name: "Japanese Culture & Customs",
        level: "Mixed",
        students: 20,
        completionRate: 88,
        status: "active",
      },
      {
        id: "cls-007",
        name: "Beginner Japanese",
        level: "N5",
        students: 28,
        completionRate: 90,
        status: "active",
      },
    ],
    recentActivity: [
      {
        id: "act-004",
        action: "Uploaded",
        description: "Uploaded new lesson content",
        timestamp: "1 hour ago",
        icon: "upload",
      },
      {
        id: "act-005",
        action: "Created",
        description: "Created conversation practice session",
        timestamp: "3 hours ago",
        icon: "book",
      },
    ],
  },
  "00000000-0000-0000-0000-000000000013": {
    id: "00000000-0000-0000-0000-000000000013",
    name: "Haruki Suzuki",
    email: "haruki.suzuki@example.com",
    phone: "+81 70 5555 1234",
    gender: "Male",
    dateOfBirth: "1990-11-08",
    address: "Osaka, Japan",
    joinDate: "January 20, 2026",
    avatarUrl: null,
    bio: "Native speaker with a passion for teaching Japanese to international students. Focuses on practical language skills and real-world applications.",
    qualification: "Teaching Certificate in Japanese as a Foreign Language",
    experience: "4 Years",
    specialization: "Beginner Japanese, Listening Skills",
    jlptLevel: "N2",
    status: "ACTIVE",
    totalClasses: 2,
    totalStudents: 48,
    avgScore: 82,
    completionRate: 85,
    attendanceRate: 91,
    classes: [
      {
        id: "cls-008",
        name: "Beginner Japanese A1",
        level: "N5",
        students: 24,
        completionRate: 85,
        status: "active",
      },
      {
        id: "cls-009",
        name: "Listening Practice",
        level: "N4",
        students: 24,
        completionRate: 80,
        status: "active",
      },
    ],
    recentActivity: [
      {
        id: "act-006",
        action: "Assigned",
        description: "Assigned listening exercises",
        timestamp: "5 hours ago",
        icon: "clipboard",
      },
    ],
  },
  "00000000-0000-0000-0000-000000000014": {
    id: "00000000-0000-0000-0000-000000000014",
    name: "Aoi Kobayashi",
    email: "aoi.kobayashi@example.com",
    phone: "+81 90 7777 8888",
    gender: "Female",
    dateOfBirth: "1995-02-28",
    address: "Nagoya, Japan",
    joinDate: "December 5, 2025",
    avatarUrl: null,
    bio: "Dedicated educator focused on grammar and reading comprehension. Uses innovative teaching methods to make complex grammar concepts accessible.",
    qualification: "Master's in Applied Linguistics",
    experience: "5 Years",
    specialization: "Grammar, Reading Comprehension",
    jlptLevel: "N1",
    status: "INACTIVE",
    totalClasses: 2,
    totalStudents: 36,
    avgScore: 79,
    completionRate: 75,
    attendanceRate: 88,
    classes: [
      {
        id: "cls-010",
        name: "Grammar Masterclass",
        level: "N3",
        students: 18,
        completionRate: 72,
        status: "inactive",
      },
      {
        id: "cls-011",
        name: "JLPT Reading Prep",
        level: "N2",
        students: 18,
        completionRate: 78,
        status: "inactive",
      },
    ],
    recentActivity: [
      {
        id: "act-007",
        action: "Updated",
        description: "Updated course materials",
        timestamp: "1 week ago",
        icon: "upload",
      },
    ],
  },
};

// Default fallback for unknown IDs
const DEFAULT_TEACHER: TeacherProfile = {
  id: "unknown",
  name: "Unknown Teacher",
  email: "unknown@example.com",
  joinDate: "Unknown",
  jlptLevel: "—",
  status: "INACTIVE",
  totalClasses: 0,
  totalStudents: 0,
  avgScore: 0,
  completionRate: 0,
  attendanceRate: 0,
  classes: [],
  recentActivity: [],
};

function getTeacherById(id: string): TeacherProfile {
  return MOCK_TEACHERS[id] || { ...DEFAULT_TEACHER, id, name: `Teacher ${id.slice(-4)}` };
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

const getActivityIcon = (icon: string) => {
  switch (icon) {
    case "book":
      return <BookOpen className="w-4 h-4" />;
    case "clipboard":
      return <ClipboardCheck className="w-4 h-4" />;
    case "megaphone":
      return <FileText className="w-4 h-4" />;
    case "upload":
      return <Download className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

// ─── Assign Class Modal ──────────────────────────────────────────────────────

function AssignClassModal({ teacher, onClose }: { teacher: TeacherProfile; onClose: () => void }) {
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);

  const availableClasses = [
    { id: "new-class-001", name: "N3 Advanced Japanese", level: "N3" },
    { id: "new-class-002", name: "JLPT N2 Intensive", level: "N2" },
    { id: "new-class-003", name: "Japanese for Beginners", level: "N5" },
  ];

  const handleAssign = async () => {
    if (!selectedClass) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    onClose();
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
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b separator">
          <h3 className="font-display font-bold text-primary-col text-lg">Assign Class</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
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
            <div>
              <p className="text-sm font-semibold text-primary-col">{teacher.name}</p>
              <p className="text-xs text-muted-col">{teacher.email}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-col uppercase tracking-wider mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl input-glass text-sm"
            >
              <option value="">Choose a class...</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.level})
                </option>
              ))}
            </select>
          </div>
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
            onClick={handleAssign}
            disabled={!selectedClass || loading}
            className="flex-1 py-2.5 rounded-xl bg-primary/12 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Assigning...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Assign
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Reset Password Modal ────────────────────────────────────────────────────

function ResetPasswordModal({
  teacher,
  onClose,
}: {
  teacher: TeacherProfile;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    onClose();
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
            <span className="font-semibold text-primary-col">{teacher.email}</span>?
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
  const teacher = getTeacherById(teacherId);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const initials = teacher.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

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
              <h1 className="text-2xl font-display font-black text-primary-col">Teacher Profile</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  teacher.status === "ACTIVE"
                    ? "bg-[var(--status-active)]/12 text-[var(--status-active)] border border-[var(--status-active)]/20"
                    : teacher.status === "INACTIVE"
                      ? "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border border-[var(--status-pending)]/20"
                      : "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] border border-[var(--status-rejected)]/20"
                }`}
              >
                {teacher.status.charAt(0) + teacher.status.slice(1).toLowerCase()}
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
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold text-primary-col">{teacher.name}</p>
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
                  <p className="text-sm font-semibold text-primary-col">{teacher.phone || "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Address
                  </p>
                  <p className="text-sm font-semibold text-primary-col truncate">
                    {teacher.address || "—"}
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
                    {teacher.dateOfBirth
                      ? new Date(teacher.dateOfBirth).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Join Date
                  </p>
                  <p className="text-sm font-semibold text-primary-col">{teacher.joinDate}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Professional Information */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-base p-5"
          >
            <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" /> Professional Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--status-teacher)]/12 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-[var(--status-teacher)]" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Qualification
                  </p>
                  <p className="text-sm font-semibold text-primary-col">
                    {teacher.qualification || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--status-teacher)]/12 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-[var(--status-teacher)]" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Experience
                  </p>
                  <p className="text-sm font-semibold text-primary-col">{teacher.experience}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--status-teacher)]/12 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-[var(--status-teacher)]" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    JLPT Level
                  </p>
                  <p className="text-sm font-semibold text-primary-col">{teacher.jlptLevel}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--status-teacher)]/12 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-[var(--status-teacher)]" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
                    Specialization
                  </p>
                  <p className="text-sm font-semibold text-primary-col">
                    {teacher.specialization || "—"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Current Classes */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-base p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-sm text-primary-col flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> Current Classes (
                {teacher.classes.length})
              </h2>
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/12 text-primary text-xs font-bold border border-primary/20 hover:bg-primary/20 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Assign Class
              </button>
            </div>
            <div className="overflow-x-auto min-w-[600px]">
              <div className="grid grid-cols-5 gap-2 px-4 py-2.5 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
                <div className="col-span-2">Class</div>
                <div className="text-center">Level</div>
                <div className="text-center">Students</div>
                <div className="text-center">Completion</div>
              </div>
              {teacher.classes.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center"
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
                    <span className="text-sm font-semibold text-primary-col">{cls.students}</span>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex-1 h-1.5 glass-surface rounded-full overflow-hidden max-w-[60px]">
                        <div
                          className="h-full rounded-full bg-[var(--status-active)]"
                          style={{ width: `${cls.completionRate}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-primary-col w-7">
                        {cls.completionRate}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-base p-5"
          >
            <h2 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Recent Activity
            </h2>
            <div className="space-y-3">
              {teacher.recentActivity.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl glass-surface hover:border-primary/20 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center text-primary shrink-0">
                    {getActivityIcon(activity.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary-col truncate">
                      {activity.description}
                    </p>
                    <p className="text-[10px] text-muted-col">{activity.timestamp}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Avatar & Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-base p-5"
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-24 h-24 rounded-2xl bg-linear-to-br ${getAvatarColor(teacher.id)} flex items-center justify-center text-white font-black text-3xl mb-3`}
              >
                {initials}
              </div>
              <h3 className="font-display font-bold text-primary-col text-lg">{teacher.name}</h3>
              <p className="text-xs text-muted-col">{teacher.email}</p>
            </div>

            {/* Teaching Summary KPIs */}
            <div className="mt-4 pt-4 border-t separator space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Total Classes</span>
                <span className="text-sm font-bold text-primary-col">{teacher.totalClasses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Total Students</span>
                <span className="text-sm font-bold text-primary-col">{teacher.totalStudents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Avg Score</span>
                <span className="text-sm font-bold text-primary-col">{teacher.avgScore}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Completion</span>
                <span className="text-sm font-bold text-primary-col">
                  {teacher.completionRate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-col">Attendance</span>
                <span className="text-sm font-bold text-primary-col">
                  {teacher.attendanceRate}%
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t separator space-y-2">
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass-surface text-secondary-col text-xs font-semibold hover:text-primary hover:bg-accent transition">
                <Edit className="w-4 h-4" /> Edit Teacher
              </button>
              <button
                onClick={() => setShowAssignModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass-surface text-secondary-col text-xs font-semibold hover:text-primary hover:bg-accent transition"
              >
                <Plus className="w-4 h-4" /> Assign Class
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass-surface text-secondary-col text-xs font-semibold hover:text-primary hover:bg-accent transition"
              >
                <Key className="w-4 h-4" /> Reset Password
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass-surface text-[var(--status-active)] text-xs font-semibold hover:bg-[var(--status-active)]/10 transition">
                <CheckCircle className="w-4 h-4" /> Activate
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass-surface text-[var(--status-rejected)] text-xs font-semibold hover:bg-[var(--status-rejected)]/10 transition">
                <Ban className="w-4 h-4" /> Deactivate
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl glass-surface text-[var(--status-rejected)]/70 text-xs font-semibold hover:text-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/10 transition">
                <Trash2 className="w-4 h-4" /> Delete Teacher
              </button>
            </div>
          </motion.div>

          {/* JLPT Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-base p-5"
          >
            <h3 className="text-xs font-bold text-muted-col uppercase tracking-wider mb-3">
              JLPT Certification
            </h3>
            <div className="flex items-center justify-center p-4 rounded-xl bg-[var(--status-teacher)]/8 border border-[var(--status-teacher)]/20">
              <div className="text-center">
                <p className="text-3xl font-black text-[var(--status-teacher)]">
                  {teacher.jlptLevel}
                </p>
                <p className="text-[10px] text-muted-col mt-1">JLPT Certified</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAssignModal && (
          <AssignClassModal teacher={teacher} onClose={() => setShowAssignModal(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetModal && (
          <ResetPasswordModal teacher={teacher} onClose={() => setShowResetModal(false)} />
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
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
