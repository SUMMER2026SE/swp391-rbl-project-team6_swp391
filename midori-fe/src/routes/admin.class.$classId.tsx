import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, BookUser, GraduationCap, Users, Calendar,
  BookOpen, ClipboardCheck, Eye, UserX,
  Loader2, TrendingUp, Award, CheckCircle,
  Clock, FileText, Phone
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";

type TabValue = "overview" | "students" | "assignments";

function JLPTBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    N5: "bg-[oklch(0.62_0.18_270)]/12 text-[oklch(0.62_0.18_270)] border-[oklch(0.62_0.18_270)]/20",
    N4: "bg-[oklch(0.72_0.15_230)]/12 text-[oklch(0.72_0.15_230)] border-[oklch(0.72_0.15_230)]/20",
    N3: "bg-[var(--status-pending)]/12 text-[var(--status-pending)] border-[var(--status-pending)]/20",
    N2: "bg-[oklch(0.6_0.22_25)]/12 text-[oklch(0.6_0.22_25)] border-[oklch(0.6_0.22_25)]/20",
    N1: "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)] border-[var(--status-rejected)]/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[level] || colors["N5"]}`}>
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: { label: "Active", color: "text-[var(--status-active)]", bg: "bg-[var(--status-active)]" },
    INACTIVE: { label: "Inactive", color: "text-muted-foreground", bg: "bg-muted" },
    BANNED: { label: "Banned", color: "text-[var(--status-rejected)]", bg: "bg-[var(--status-rejected)]" },
  };
  const cfg = configs[status] || configs["ACTIVE"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
      {cfg.label}
    </span>
  );
}

// Mock data
const mockClass = {
  id: "cls-001",
  name: "N5 Beginner Japanese",
  teacher: "Sakura Tanaka",
  teacherId: "t001",
  level: "N5",
  students: 28,
  maxStudents: 30,
  status: "ACTIVE",
  createdAt: "2024-01-15",
  description: "A comprehensive beginner course covering basic Japanese for JLPT N5 certification.",
  progress: 68,
  avgScore: 82,
  attendanceRate: 94,
};

// Extended student data for profile modal
const mockStudentDetails: Record<string, {
  phone: string;
  joinDate: string;
  jlptLevel: string;
  vocabularyProgress: number;
  grammarProgress: number;
  listeningProgress: number;
  recentAssignments: { name: string; score: number; completedAt: string }[];
}> = {
  "s001": {
    phone: "+81 90-1234-5678",
    joinDate: "2024-01-15",
    jlptLevel: "N5",
    vocabularyProgress: 88,
    grammarProgress: 82,
    listeningProgress: 85,
    recentAssignments: [
      { name: "Hiragana Practice", score: 95, completedAt: "2 days ago" },
      { name: "Basic Greetings Quiz", score: 88, completedAt: "5 days ago" },
    ],
  },
  "s002": {
    phone: "+81 90-2345-6789",
    joinDate: "2024-01-16",
    jlptLevel: "N5",
    vocabularyProgress: 72,
    grammarProgress: 68,
    listeningProgress: 70,
    recentAssignments: [
      { name: "Katakana Quiz", score: 76, completedAt: "1 day ago" },
      { name: "Numbers Exercise", score: 72, completedAt: "3 days ago" },
    ],
  },
  "s003": {
    phone: "+81 90-3456-7890",
    joinDate: "2024-01-10",
    jlptLevel: "N4",
    vocabularyProgress: 92,
    grammarProgress: 90,
    listeningProgress: 88,
    recentAssignments: [
      { name: "Advanced Vocabulary", score: 92, completedAt: "1 day ago" },
      { name: "Grammar Structures", score: 91, completedAt: "4 days ago" },
    ],
  },
  "s004": {
    phone: "+81 90-4567-8901",
    joinDate: "2024-01-20",
    jlptLevel: "N5",
    vocabularyProgress: 65,
    grammarProgress: 62,
    listeningProgress: 60,
    recentAssignments: [
      { name: "Hiragana Practice", score: 68, completedAt: "3 days ago" },
      { name: "Basic Dialogue", score: 65, completedAt: "6 days ago" },
    ],
  },
  "s005": {
    phone: "+81 90-5678-9012",
    joinDate: "2024-01-12",
    jlptLevel: "N5",
    vocabularyProgress: 78,
    grammarProgress: 75,
    listeningProgress: 80,
    recentAssignments: [
      { name: "Listening Comprehension", score: 82, completedAt: "1 day ago" },
      { name: "Vocabulary Test", score: 78, completedAt: "4 days ago" },
    ],
  },
  "s006": {
    phone: "+81 90-6789-0123",
    joinDate: "2024-01-25",
    jlptLevel: "N5",
    vocabularyProgress: 45,
    grammarProgress: 48,
    listeningProgress: 42,
    recentAssignments: [
      { name: "Basic Vocabulary", score: 52, completedAt: "1 week ago" },
      { name: "Introduction Quiz", score: 48, completedAt: "2 weeks ago" },
    ],
  },
  "s007": {
    phone: "+81 90-7890-1234",
    joinDate: "2024-01-08",
    jlptLevel: "N4",
    vocabularyProgress: 96,
    grammarProgress: 94,
    listeningProgress: 92,
    recentAssignments: [
      { name: "Advanced Kanji", score: 98, completedAt: "1 day ago" },
      { name: "Complex Grammar", score: 95, completedAt: "3 days ago" },
    ],
  },
  "s008": {
    phone: "+81 90-8901-2345",
    joinDate: "2024-01-14",
    jlptLevel: "N5",
    vocabularyProgress: 88,
    grammarProgress: 85,
    listeningProgress: 82,
    recentAssignments: [
      { name: "Grammar Practice", score: 88, completedAt: "2 days ago" },
      { name: "Listening Exercise", score: 85, completedAt: "5 days ago" },
    ],
  },
};

const mockStudents = [
  { id: "s001", name: "Minato Aquo", email: "minato.a@example.com", progress: 85, avgScore: 88, lastActivity: "2 hours ago", status: "ACTIVE" },
  { id: "s002", name: "Hinata Shoy", email: "hinata.s@example.com", progress: 72, avgScore: 76, lastActivity: "1 day ago", status: "ACTIVE" },
  { id: "s003", name: "Uchiha Sashi", email: "uchiha.s@example.com", progress: 91, avgScore: 92, lastActivity: "3 hours ago", status: "ACTIVE" },
  { id: "s004", name: "Naruto Uzum", email: "naruto.u@example.com", progress: 65, avgScore: 71, lastActivity: "5 days ago", status: "ACTIVE" },
  { id: "s005", name: "Sakura Haru", email: "sakura.h@example.com", progress: 78, avgScore: 80, lastActivity: "2 days ago", status: "ACTIVE" },
  { id: "s006", name: "Kakashi Hatak", email: "kakashi.h@example.com", progress: 45, avgScore: 58, lastActivity: "1 week ago", status: "INACTIVE" },
  { id: "s007", name: "Sasuke Uch", email: "sasuke.u@example.com", progress: 95, avgScore: 96, lastActivity: "1 hour ago", status: "ACTIVE" },
  { id: "s008", name: "Tsunade Senn", email: "tsunade.s@example.com", progress: 88, avgScore: 85, lastActivity: "4 hours ago", status: "ACTIVE" },
];

const mockAssignments = [
  { id: "a001", name: "Hiragana Practice", deadline: "2024-01-20", completionRate: 95, submitted: 26, totalStudents: 28, createdBy: "Sakura Tanaka", createdAt: "2024-01-15", status: "active", avgScore: 88, highestScore: 100, lowestScore: 72 },
  { id: "a002", name: "Katakana Quiz", deadline: "2024-01-25", completionRate: 88, submitted: 24, totalStudents: 28, createdBy: "Sakura Tanaka", createdAt: "2024-01-18", status: "active", avgScore: 82, highestScore: 98, lowestScore: 65 },
  { id: "a003", name: "Basic Greetings Dialogue", deadline: "2024-02-01", completionRate: 72, submitted: 20, totalStudents: 28, createdBy: "Sakura Tanaka", createdAt: "2024-01-22", status: "active", avgScore: 78, highestScore: 95, lowestScore: 55 },
  { id: "a004", name: "Numbers & Counters Exercise", deadline: "2024-02-05", completionRate: 45, submitted: 12, totalStudents: 28, createdBy: "Sakura Tanaka", createdAt: "2024-01-28", status: "active", avgScore: 68, highestScore: 90, lowestScore: 40 },
];

// Mock submission data for assignment details
const mockSubmissions: Record<string, { studentId: string; studentName: string; status: "submitted" | "missing" | "late"; score?: number; submittedAt?: string }[]> = {
  "a001": [
    { studentId: "s001", studentName: "Minato Aquo", status: "submitted", score: 95, submittedAt: "Jan 18, 2024" },
    { studentId: "s002", studentName: "Hinata Shoy", status: "submitted", score: 82, submittedAt: "Jan 19, 2024" },
    { studentId: "s003", studentName: "Uchiha Sashi", status: "submitted", score: 100, submittedAt: "Jan 17, 2024" },
    { studentId: "s004", studentName: "Naruto Uzum", status: "late", score: 72, submittedAt: "Jan 21, 2024" },
    { studentId: "s005", studentName: "Sakura Haru", status: "submitted", score: 88, submittedAt: "Jan 19, 2024" },
    { studentId: "s006", studentName: "Kakashi Hatak", status: "missing" },
    { studentId: "s007", studentName: "Sasuke Uch", status: "submitted", score: 98, submittedAt: "Jan 18, 2024" },
    { studentId: "s008", studentName: "Tsunade Senn", status: "submitted", score: 90, submittedAt: "Jan 20, 2024" },
  ],
  "a002": [
    { studentId: "s001", studentName: "Minato Aquo", status: "submitted", score: 88, submittedAt: "Jan 23, 2024" },
    { studentId: "s002", studentName: "Hinata Shoy", status: "submitted", score: 78, submittedAt: "Jan 24, 2024" },
    { studentId: "s003", studentName: "Uchiha Sashi", status: "submitted", score: 95, submittedAt: "Jan 22, 2024" },
    { studentId: "s004", studentName: "Naruto Uzum", status: "missing" },
    { studentId: "s005", studentName: "Sakura Haru", status: "submitted", score: 85, submittedAt: "Jan 24, 2024" },
    { studentId: "s006", studentName: "Kakashi Hatak", status: "missing" },
    { studentId: "s007", studentName: "Sasuke Uch", status: "submitted", score: 92, submittedAt: "Jan 23, 2024" },
    { studentId: "s008", studentName: "Tsunade Senn", status: "submitted", score: 80, submittedAt: "Jan 25, 2024" },
  ],
  "a003": [
    { studentId: "s001", studentName: "Minato Aquo", status: "submitted", score: 90, submittedAt: "Jan 28, 2024" },
    { studentId: "s002", studentName: "Hinata Shoy", status: "late", score: 70, submittedAt: "Feb 2, 2024" },
    { studentId: "s003", studentName: "Uchiha Sashi", status: "submitted", score: 95, submittedAt: "Jan 29, 2024" },
    { studentId: "s004", studentName: "Naruto Uzum", status: "missing" },
    { studentId: "s005", studentName: "Sakura Haru", status: "missing" },
    { studentId: "s006", studentName: "Kakashi Hatak", status: "missing" },
    { studentId: "s007", studentName: "Sasuke Uch", status: "submitted", score: 88, submittedAt: "Jan 30, 2024" },
    { studentId: "s008", studentName: "Tsunade Senn", status: "submitted", score: 75, submittedAt: "Jan 31, 2024" },
  ],
  "a004": [
    { studentId: "s001", studentName: "Minato Aquo", status: "submitted", score: 85, submittedAt: "Feb 3, 2024" },
    { studentId: "s002", studentName: "Hinata Shoy", status: "missing" },
    { studentId: "s003", studentName: "Uchiha Sashi", status: "submitted", score: 90, submittedAt: "Feb 2, 2024" },
    { studentId: "s004", studentName: "Naruto Uzum", status: "missing" },
    { studentId: "s005", studentName: "Sakura Haru", status: "late", score: 55, submittedAt: "Feb 8, 2024" },
    { studentId: "s006", studentName: "Kakashi Hatak", status: "missing" },
    { studentId: "s007", studentName: "Sasuke Uch", status: "submitted", score: 88, submittedAt: "Feb 3, 2024" },
    { studentId: "s008", studentName: "Tsunade Senn", status: "submitted", score: 68, submittedAt: "Feb 4, 2024" },
  ],
};

const progressData = [
  { week: "W1", avgScore: 65, attendance: 98 },
  { week: "W2", avgScore: 70, attendance: 95 },
  { week: "W3", avgScore: 75, attendance: 92 },
  { week: "W4", avgScore: 78, attendance: 94 },
  { week: "W5", avgScore: 80, attendance: 91 },
  { week: "W6", avgScore: 82, attendance: 93 },
];

const scoreDistribution = [
  { range: "90-100", count: 8, color: "oklch(0.62 0.18 270)" },
  { range: "80-89", count: 10, color: "oklch(0.72 0.15 230)" },
  { range: "70-79", count: 5, color: "oklch(0.72 0.18 340)" },
  { range: "60-69", count: 3, color: "oklch(0.6 0.22 25)" },
  { range: "Below 60", count: 2, color: "oklch(0.65 0.2 25)" },
];

export const Route = createFileRoute("/admin/class/$classId")({
  component: ClassWorkspacePage,
});

function ClassWorkspacePage() {
  const { classId } = Route.useParams();
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState(mockStudents);
  const [classStudentCount, setClassStudentCount] = useState(mockClass.students);

  // Modal states
  const [viewProfileStudent, setViewProfileStudent] = useState<typeof mockStudents[0] | null>(null);
  const [removeStudent, setRemoveStudent] = useState<typeof mockStudents[0] | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [viewAssignment, setViewAssignment] = useState<typeof mockAssignments[0] | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [classId]);

  const handleViewProfile = useCallback((student: typeof mockStudents[0]) => {
    setViewProfileStudent(student);
  }, []);

  const handleRemoveClick = useCallback((student: typeof mockStudents[0]) => {
    setRemoveStudent(student);
    setShowRemoveConfirm(true);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (removeStudent) {
      setStudents(prev => prev.filter(s => s.id !== removeStudent.id));
      setClassStudentCount(prev => prev - 1);
      setShowRemoveConfirm(false);
      setRemoveStudent(null);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  }, [removeStudent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-col">Loading class...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to="/admin/class-management"
          className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary hover:bg-accent transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-display font-black text-primary-col">{mockClass.name}</h1>
            <JLPTBadge level={mockClass.level} />
          </div>
          <p className="text-sm text-secondary-col">{mockClass.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
        <TabsList className="glass-card p-1 flex gap-1 w-full justify-start overflow-x-auto">
          {[
            { value: "overview", label: "Overview", icon: BookUser },
            { value: "students", label: "Students", icon: Users },
            { value: "assignments", label: "Assignments", icon: ClipboardCheck },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === tab.value
                  ? "bg-gradient-hero text-white shadow-md"
                  : "text-secondary-col hover:text-primary hover:bg-accent"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-5 space-y-5">
          {/* SECTION 1: Class Information */}
          <div className="card-base p-5">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[oklch(0.62_0.18_270)] to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {mockClass.level}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-display font-black text-primary-col">{mockClass.name}</h2>
                  <StatusBadge status={mockClass.status} />
                </div>
                <p className="text-sm text-secondary-col">{mockClass.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-xl glass-surface">
                <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider">Teacher</p>
                  <p className="text-sm font-semibold text-primary-col">{mockClass.teacher}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl glass-surface">
                <Users className="w-4 h-4 text-[oklch(0.72_0.15_230)] shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider">Students</p>
                  <p className="text-sm font-semibold text-primary-col">{classStudentCount} / {mockClass.maxStudents}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl glass-surface">
                <Calendar className="w-4 h-4 text-[var(--status-pending)] shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider">Created</p>
                  <p className="text-sm font-semibold text-primary-col">
                    {new Date(mockClass.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl glass-surface">
                <JLPTBadge level={mockClass.level} />
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider">Level</p>
                  <p className="text-sm font-semibold text-primary-col">JLPT {mockClass.level}</p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-col font-bold uppercase tracking-wider">Total Students</span>
                <Users className="w-5 h-5 text-[oklch(0.72_0.15_230)]" />
              </div>
              <p className="font-display font-black text-3xl text-primary-col">{classStudentCount}</p>
              <p className="text-xs text-muted-col mt-1">of {mockClass.maxStudents} capacity</p>
            </div>
            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-col font-bold uppercase tracking-wider">Completion Rate</span>
                <TrendingUp className="w-5 h-5 text-[oklch(0.62_0.18_270)]" />
              </div>
              <p className="font-display font-black text-3xl text-primary-col">{mockClass.progress}%</p>
              <div className="mt-2 h-1.5 glass-surface rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[oklch(0.62_0.18_270)]" style={{ width: `${mockClass.progress}%` }} />
              </div>
            </div>
            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-col font-bold uppercase tracking-wider">Average Score</span>
                <Award className="w-5 h-5 text-[oklch(0.72_0.15_230)]" />
              </div>
              <p className="font-display font-black text-3xl text-primary-col">{mockClass.avgScore}%</p>
              <div className="mt-2 h-1.5 glass-surface rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[oklch(0.72_0.15_230)]" style={{ width: `${mockClass.avgScore}%` }} />
              </div>
            </div>
            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-col font-bold uppercase tracking-wider">Attendance</span>
                <CheckCircle className="w-5 h-5 text-[var(--status-active)]" />
              </div>
              <p className="font-display font-black text-3xl text-primary-col">{mockClass.attendanceRate}%</p>
              <div className="mt-2 h-1.5 glass-surface rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[var(--status-active)]" style={{ width: `${mockClass.attendanceRate}%` }} />
              </div>
            </div>
          </div>

          {/* SECTION 3: Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Student Progress Trend */}
            <div className="card-base p-5">
              <h3 className="font-display font-bold text-sm text-primary-col mb-4">Student Progress Trend</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.62 0.18 270)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="oklch(0.62 0.18 270)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#F3F4F6", fontSize: 12 }} />
                    <Area type="monotone" dataKey="avgScore" stroke="oklch(0.62 0.18 270)" fill="url(#progressFill)" strokeWidth={2} name="Avg Score %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Assignment Completion Rate */}
            <div className="card-base p-5">
              <h3 className="font-display font-bold text-sm text-primary-col mb-4">Score Distribution</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="range" type="category" tick={{ fontSize: 10, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} width={60} />
                    <Tooltip contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#F3F4F6", fontSize: 12 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="card-base p-5">
            <h3 className="font-display font-bold text-sm text-primary-col mb-4">Average Score Trend</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="scoreTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72_0.15_230)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="oklch(0.72_0.15_230)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "oklch(0.55 0.02 300)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "rgba(15,20,40,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#F3F4F6", fontSize: 12 }} />
                  <Area type="monotone" dataKey="avgScore" stroke="oklch(0.72_0.15_230)" fill="url(#scoreTrendFill)" strokeWidth={2} name="Score %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SECTION 4: Class Performance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Best Performing Students */}
            <div className="card-base p-5">
              <h3 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-[oklch(0.62_0.18_270)]" />
                Top Performers
              </h3>
              <div className="space-y-3">
                {mockStudents
                  .filter(s => s.status === "ACTIVE")
                  .sort((a, b) => b.avgScore - a.avgScore)
                  .slice(0, 3)
                  .map((student, i) => (
                    <div key={student.id} className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i === 0 ? "bg-[oklch(0.62_0.18_270)] text-white" :
                        i === 1 ? "bg-[oklch(0.72_0.15_230)] text-white" :
                        "bg-[oklch(0.72_0.18_340)] text-white"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary-col truncate">{student.name}</p>
                        <p className="text-[10px] text-muted-col">{student.avgScore}% avg score</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Students Needing Attention */}
            <div className="card-base p-5">
              <h3 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--status-pending)]" />
                Needs Attention
              </h3>
              <div className="space-y-3">
                {mockStudents
                  .filter(s => s.progress < 60 || s.status === "INACTIVE")
                  .slice(0, 3)
                  .map((student) => (
                    <div key={student.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {student.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary-col truncate">{student.name}</p>
                        <p className="text-[10px] text-[var(--status-pending)]">{student.progress}% progress</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card-base p-5">
              <h3 className="font-display font-bold text-sm text-primary-col mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--status-active)]" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {mockStudents
                  .slice(0, 4)
                  .sort((a, b) => {
                    const timeA = a.lastActivity.includes("hour") ? 0 : a.lastActivity.includes("day") ? 1 : 2;
                    const timeB = b.lastActivity.includes("hour") ? 0 : b.lastActivity.includes("day") ? 1 : 2;
                    return timeA - timeB;
                  })
                  .map((student) => (
                    <div key={student.id} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[var(--status-active)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary-col truncate">{student.name}</p>
                        <p className="text-[10px] text-muted-col">{student.lastActivity}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-secondary-col">
              {students.length} students enrolled
            </div>
          </div>

          <div className="card-base overflow-hidden">
            <div className="overflow-x-auto min-w-[800px]">
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
                <div className="col-span-4">Student</div>
                <div className="col-span-2">Progress</div>
                <div className="col-span-2">Avg Score</div>
                <div className="col-span-2">Last Activity</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Actions</div>
              </div>

              {students.map((student, i) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {student.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-primary-col truncate">{student.name}</div>
                      <div className="text-[10px] text-muted-col truncate">{student.email}</div>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 glass-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.progress >= 80 ? "bg-[var(--status-active)]" :
                            student.progress >= 60 ? "bg-[var(--status-pending)]" :
                            "bg-[var(--status-rejected)]"
                          }`}
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-primary-col w-8">{student.progress}%</span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-[oklch(0.62_0.18_270)]" />
                      <span className="text-sm font-semibold text-primary-col">{student.avgScore}%</span>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-xs text-muted-col">
                      <Clock className="w-3 h-3" />
                      {student.lastActivity}
                    </div>
                  </div>

                  <div className="col-span-1">
                    <StatusBadge status={student.status} />
                  </div>

                  <div className="col-span-1 flex items-center gap-1 justify-end">
                    {/* View Profile */}
                    <button
                      onClick={() => handleViewProfile(student)}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition"
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Remove From Class */}
                    <button
                      onClick={() => handleRemoveClick(student)}
                      className="p-2 rounded-lg bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/20 transition"
                      title="Remove From Class"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="mt-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-secondary-col">
              {mockAssignments.length} assignments
            </div>
          </div>

          <div className="card-base overflow-hidden">
            <div className="overflow-x-auto min-w-[900px]">
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
                <div className="col-span-3">Assignment</div>
                <div className="col-span-2">Created By</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-2">Submission Rate</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {mockAssignments.map((assignment, i) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)] transition items-center"
                >
                  {/* Assignment */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-primary-col truncate">{assignment.name}</span>
                    </div>
                  </div>

                  {/* Created By */}
                  <div className="col-span-2">
                    <span className="text-sm text-secondary-col truncate">{assignment.createdBy}</span>
                  </div>

                  {/* Due Date */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1 text-xs text-muted-col">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{new Date(assignment.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>

                  {/* Submission Rate */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 glass-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            assignment.completionRate >= 80 ? "bg-[var(--status-active)]" :
                            assignment.completionRate >= 50 ? "bg-[var(--status-pending)]" :
                            "bg-[var(--status-rejected)]"
                          }`}
                          style={{ width: `${assignment.completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-primary-col w-12">{assignment.submitted}/{assignment.totalStudents}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-1">
                    <StatusBadge status={assignment.status === "active" ? "ACTIVE" : "INACTIVE"} />
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end">
                    <button
                      onClick={() => setViewAssignment(assignment)}
                      className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition"
                      title="View Assignment"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>

      </Tabs>

      {/* View Profile Modal */}
      <Dialog open={!!viewProfileStudent} onOpenChange={() => setViewProfileStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
            <DialogDescription>View student details and learning progress</DialogDescription>
          </DialogHeader>
          {viewProfileStudent && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                  {viewProfileStudent.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary-col">{viewProfileStudent.name}</h3>
                  <p className="text-sm text-muted-col">{viewProfileStudent.email}</p>
                </div>
              </div>

              {/* Student Information Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-primary-col flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Student Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg glass-surface">
                    <Phone className="w-4 h-4 text-muted-col shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-col">Phone</p>
                      <p className="text-sm font-medium">{mockStudentDetails[viewProfileStudent.id]?.phone || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg glass-surface">
                    <Calendar className="w-4 h-4 text-muted-col shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-col">Join Date</p>
                      <p className="text-sm font-medium">
                        {mockStudentDetails[viewProfileStudent.id]
                          ? new Date(mockStudentDetails[viewProfileStudent.id].joinDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg glass-surface">
                    <GraduationCap className="w-4 h-4 text-muted-col shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-col">JLPT Level</p>
                      <p className="text-sm font-medium">JLPT {mockStudentDetails[viewProfileStudent.id]?.jlptLevel || "N5"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg glass-surface">
                    <Users className="w-4 h-4 text-muted-col shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-col">Current Class</p>
                      <p className="text-sm font-medium">{mockClass.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Progress Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-primary-col flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Learning Progress
                </h4>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg glass-surface">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-col">Vocabulary Progress</span>
                      <span className="text-sm font-bold text-primary-col">{mockStudentDetails[viewProfileStudent.id]?.vocabularyProgress || 0}%</span>
                    </div>
                    <Progress value={mockStudentDetails[viewProfileStudent.id]?.vocabularyProgress || 0} className="h-2" />
                  </div>
                  <div className="p-3 rounded-lg glass-surface">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-col">Grammar Progress</span>
                      <span className="text-sm font-bold text-primary-col">{mockStudentDetails[viewProfileStudent.id]?.grammarProgress || 0}%</span>
                    </div>
                    <Progress value={mockStudentDetails[viewProfileStudent.id]?.grammarProgress || 0} className="h-2" />
                  </div>
                  <div className="p-3 rounded-lg glass-surface">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-col">Listening Progress</span>
                      <span className="text-sm font-bold text-primary-col">{mockStudentDetails[viewProfileStudent.id]?.listeningProgress || 0}%</span>
                    </div>
                    <Progress value={mockStudentDetails[viewProfileStudent.id]?.listeningProgress || 0} className="h-2" />
                  </div>
                  <div className="p-3 rounded-lg glass-surface">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-col">Overall Completion Rate</span>
                      <span className="text-sm font-bold text-primary-col">{viewProfileStudent.progress}%</span>
                    </div>
                    <Progress value={viewProfileStudent.progress} className="h-2" />
                  </div>
                </div>
              </div>

              {/* Recent Activity Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-primary-col flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent Activity
                </h4>
                <div className="space-y-2">
                  {mockStudentDetails[viewProfileStudent.id]?.recentAssignments.map((assignment, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg glass-surface">
                      <div>
                        <p className="text-sm font-medium text-primary-col">{assignment.name}</p>
                        <p className="text-xs text-muted-col">{assignment.completedAt}</p>
                      </div>
                      <span className="text-sm font-bold text-primary-col">{assignment.score}%</span>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-col">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Student Confirmation */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student From Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeStudent?.name} from this class? This action will remove the student from the current class but will not delete the student account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRemoveConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemove} className="bg-[var(--status-rejected)] hover:bg-[var(--status-rejected)]/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Assignment Modal */}
      <Dialog open={!!viewAssignment} onOpenChange={() => setViewAssignment(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
            <DialogDescription>View assignment information and submission statistics</DialogDescription>
          </DialogHeader>
          {viewAssignment && (
            <div className="space-y-6">
              {/* Assignment Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-primary-col flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Assignment Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg glass-surface">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-col">Title</p>
                      <p className="text-sm font-medium text-primary-col">{viewAssignment.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg glass-surface">
                    <Users className="w-4 h-4 text-muted-col shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-col">Created By</p>
                      <p className="text-sm font-medium">{viewAssignment.createdBy}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg glass-surface">
                    <Calendar className="w-4 h-4 text-muted-col shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-col">Created Date</p>
                      <p className="text-sm font-medium">
                        {new Date(viewAssignment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg glass-surface">
                    <Clock className="w-4 h-4 text-muted-col shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-col">Due Date</p>
                      <p className="text-sm font-medium">
                        {new Date(viewAssignment.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submission Statistics */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-primary-col flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Submission Statistics
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg glass-surface text-center">
                    <p className="text-2xl font-black text-primary-col">{viewAssignment.totalStudents}</p>
                    <p className="text-[10px] text-muted-col mt-1">Total Students</p>
                  </div>
                  <div className="p-3 rounded-lg glass-surface text-center">
                    <p className="text-2xl font-black text-[var(--status-active)]">{viewAssignment.submitted}</p>
                    <p className="text-[10px] text-muted-col mt-1">Submitted</p>
                  </div>
                  <div className="p-3 rounded-lg glass-surface text-center">
                    <p className="text-2xl font-black text-[var(--status-rejected)]">{viewAssignment.totalStudents - viewAssignment.submitted}</p>
                    <p className="text-[10px] text-muted-col mt-1">Missing</p>
                  </div>
                  <div className="p-3 rounded-lg glass-surface text-center">
                    <p className="text-2xl font-black text-primary-col">{viewAssignment.completionRate}%</p>
                    <p className="text-[10px] text-muted-col mt-1">Rate</p>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-primary-col flex items-center gap-2">
                  <Award className="w-4 h-4" /> Performance Summary
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg glass-surface text-center">
                    <p className="text-2xl font-black text-[var(--status-active)]">{viewAssignment.avgScore}%</p>
                    <p className="text-[10px] text-muted-col mt-1">Average Score</p>
                  </div>
                  <div className="p-3 rounded-lg glass-surface text-center">
                    <p className="text-2xl font-black text-[oklch(0.62_0.18_270)]">{viewAssignment.highestScore}%</p>
                    <p className="text-[10px] text-muted-col mt-1">Highest Score</p>
                  </div>
                  <div className="p-3 rounded-lg glass-surface text-center">
                    <p className="text-2xl font-black text-[var(--status-rejected)]">{viewAssignment.lowestScore}%</p>
                    <p className="text-[10px] text-muted-col mt-1">Lowest Score</p>
                  </div>
                </div>
              </div>

              {/* Student Submissions */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-primary-col flex items-center gap-2">
                  <Users className="w-4 h-4" /> Student Submissions
                </h4>
                <div className="card-base overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b separator text-[10px] uppercase tracking-wider text-muted-col font-bold">
                    <div className="col-span-6">Student</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-3 text-right">Score</div>
                  </div>
                  {(mockSubmissions[viewAssignment.id] || []).map((submission, i) => (
                    <div
                      key={submission.studentId}
                      className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border hover:bg-accent/50 transition items-center"
                    >
                      <div className="col-span-6 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                          {submission.studentName.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="text-sm text-primary-col truncate">{submission.studentName}</span>
                      </div>
                      <div className="col-span-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          submission.status === "submitted" ? "bg-[var(--status-active)]/12 text-[var(--status-active)]" :
                          submission.status === "late" ? "bg-[var(--status-pending)]/12 text-[var(--status-pending)]" :
                          "bg-[var(--status-rejected)]/12 text-[var(--status-rejected)]"
                        }`}>
                          {submission.status === "submitted" ? "Submitted" :
                           submission.status === "late" ? "Late" : "Missing"}
                        </span>
                      </div>
                      <div className="col-span-3 text-right">
                        {submission.score !== undefined ? (
                          <span className="text-sm font-bold text-primary-col">{submission.score}%</span>
                        ) : (
                          <span className="text-sm text-muted-col">-</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2">
          <div className="bg-[var(--status-active)] text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Student removed from class successfully.</span>
          </div>
        </div>
      )}
    </div>
  );
}
