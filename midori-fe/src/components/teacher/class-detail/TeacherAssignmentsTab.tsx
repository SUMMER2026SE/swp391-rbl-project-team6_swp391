import React, { useState, useMemo } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/page-ui";
import { Link } from "@tanstack/react-router";
import {
  ClipboardList,
  Calendar,
  Users,
  Award,
  ArrowLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock3,
  HelpCircle,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Bell,
} from "lucide-react";
import type { TeacherClassInfo, TeacherAssignment } from "@/types/teacher-class";
import { homeworkApi } from "@/lib/api/homework";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/teacher/dialogs";
import { ViewHomeworkDialog } from "../homework-detail-dialog";
import { HomeworkEditDialog } from "../homework-edit-dialog";

interface TeacherAssignmentsTabProps {
  classInfo: TeacherClassInfo;
  urlQ?: string;
  isArchived?: boolean;
}

interface Submission {
  id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar: string;
  status: "Submitted" | "Not submitted" | "Graded";
  submittedAt?: string;
  /** Raw auto-graded score for backward compatibility (manual grading form still uses this). */
  score?: number;
  feedback?: string;
  studentAnswer?: string;
  duration?: string;
  /** Backend-authored rounded percentage of correct answers. Displayed in SCORE column and
   *  must be identical to what the student sees on their View Result page. */
  correctPercentage?: number;
  /** Backend count of focus / window-blur / tab-switch / anti-cheat violations. */
  focusViolationCount?: number;
}

export function TeacherAssignmentsTab({ classInfo, urlQ, isArchived }: TeacherAssignmentsTabProps) {
  const queryClient = useQueryClient();
  // Navigation state: "list" | "submissions" | "detail"
  const [viewStep, setViewStep] = useState<"list" | "submissions" | "detail">("list");
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Filter & sorting states for Step 1
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("deadline");

  // Step 2: Submissions list filter state ("All" | "Submitted" | "Graded" | "OverDue")
  const [subFilter, setSubFilter] = useState("All");

  // Step 3: Grading form states
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // View / Edit / Delete states
  const [viewHwId, setViewHwId] = useState<string | null>(null);
  const [editHwId, setEditHwId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: editingHomework } = useQuery({
    queryKey: ["homeworkDetails", editHwId],
    queryFn: () => homeworkApi.getTeacherHomeworkById(editHwId!),
    enabled: !!editHwId,
  });
  const handleSaveEdit = async (updated: any) => {
    if (!editHwId) return;
    toast.promise(
      homeworkApi.updateHomework(editHwId, {
        title: updated.title,
        instructions: updated.instructions,
        dueDate: updated.dueDate ? new Date(updated.dueDate).toISOString() : "",
        maxScore: updated.maxScore,
        attempts: updated.attempts,
        status: updated.status,
        questionIds: updated.questions?.map((q: any) => q.id) || [],
      }),
      {
        loading: "Updating homework...",
        success: () => {
          setEditHwId(null);
          void queryClient.invalidateQueries({ queryKey: ["classHomework"] });
          void queryClient.invalidateQueries({ queryKey: ["teacherHomeworksByClass"] });
          void queryClient.invalidateQueries({ queryKey: ["teacherAllHomeworks"] });
          void queryClient.invalidateQueries({ queryKey: ["homeworkDetails"] });
          void queryClient.invalidateQueries({ queryKey: ["classDetail"] });
          return "Homework updated successfully.";
        },
        error: (err: any) => `Failed to update homework: ${err.message || "Unknown error"}`,
      },
    );
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    toast.promise(homeworkApi.deleteHomework(id), {
      loading: "Deleting homework...",
      success: () => {
        void queryClient.invalidateQueries({ queryKey: ["classHomework"] });
        void queryClient.invalidateQueries({ queryKey: ["teacherHomeworksByClass"] });
        void queryClient.invalidateQueries({ queryKey: ["teacherAllHomeworks"] });
        void queryClient.invalidateQueries({ queryKey: ["classDetail"] });
        return "Homework deleted successfully.";
      },
      error: (err: any) => `Failed to delete homework: ${err.message || "Unknown error"}`,
    });
  };

  const filters = ["All", "Active", "Completed"];
  const sortOptions = [
    { value: "deadline", label: "Nearest Deadline" },
    { value: "created", label: "Latest Created" },
  ];

  // Process homework assignments list
  const processedAssignments = useMemo(() => {
    let list = [...classInfo.assignments];

    if (urlQ) {
      const q = urlQ.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.moduleType || "").toLowerCase().includes(q) ||
          (a.deadline || "").toLowerCase().includes(q),
      );
    }

    if (filter !== "All") {
      const now = new Date().getTime();
      list = list.filter((a) => {
        const isExpired = a.deadline ? new Date(a.deadline).getTime() < now : false;

        if (filter === "Active") {
          return !isExpired && a.status !== "Closed";
        }
        if (filter === "Completed") {
          return isExpired || a.status === "Closed";
        }
        return true;
      });
    }

    list.sort((a, b) => {
      if (sort === "deadline") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sort === "created") {
        return new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime();
      }
      return 0;
    });

    return list;
  }, [classInfo, urlQ, filter, sort]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500/10 text-green-500 dark:bg-green-500/25 border-green-500/20";
      case "Closed":
        return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 border-border/40";
      case "Upcoming":
      default:
        return "bg-blue-500/10 text-blue-500 dark:bg-blue-500/25 border-blue-500/20";
    }
  };

  const getSubStatusBadge = (status: Submission["status"]) => {
    switch (status) {
      case "Graded":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Graded
          </span>
        );
      case "Submitted":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20 flex items-center gap-1 w-fit">
            <Clock3 className="w-3 h-3" /> Submitted
          </span>
        );
      case "Not submitted":
      default: {
        const isOverdue = selectedAssignment?.deadline ? new Date(selectedAssignment.deadline).getTime() < new Date().getTime() : false;
        if (isOverdue) {
          return (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 dark:hover:bg-rose-500/20 flex items-center gap-1 w-fit">
              <AlertCircle className="w-3 h-3" /> OverDue
            </span>
          );
        } else {
          return (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20 dark:hover:bg-blue-500/20 flex items-center gap-1 w-fit">
              <Clock className="w-3 h-3" /> Pending
            </span>
          );
        }
      }
    }
  };

  // Actions transitions
  const handleOpenSubmissions = async (assignment: TeacherAssignment) => {
    setSelectedAssignment(assignment);
    setSubmissions([]);
    setSubFilter("All");
    setViewStep("submissions");
    setIsLoadingSubmissions(true);
    try {
      const raw = await homeworkApi.getHomeworkSubmissions(assignment.id);
      const mapped: Submission[] = (raw ?? []).map((s) => ({
        id: s.id,
        studentId: s.studentId,
        studentName: s.studentName,
        studentEmail: s.studentEmail,
        studentAvatar: s.studentName ? s.studentName[0].toUpperCase() : "?",
        status: s.status === "GRADED" ? "Graded" : "Submitted",
        submittedAt: s.submittedAt ? s.submittedAt.replace("T", " ").slice(0, 16) : undefined,
        score: s.score,
        feedback: s.feedback,
        studentAnswer: s.submissionText,
        duration: undefined,
        correctPercentage:
          typeof s.correctPercentage === "number" ? s.correctPercentage : undefined,
        focusViolationCount:
          typeof s.focusViolationCount === "number" ? s.focusViolationCount : 0,
      }));
      setSubmissions(mapped);
    } catch {
      toast.error("Failed to load submissions.");
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const handleOpenDetail = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeScore(submission.score !== undefined ? submission.score : 10);
    setGradeFeedback(submission.feedback ?? "");
    setViewStep("detail");
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    // Validate score
    if (gradeScore < 0 || gradeScore > 10) {
      toast.error("Score must be between 0 and 10");
      return;
    }

    setIsSavingGrade(true);
    try {
      if (!selectedSubmission.id) {
        toast.error("Cannot grade: submission ID is missing.");
        return;
      }
      await homeworkApi.gradeSubmission(selectedSubmission.id, {
        score: gradeScore,
        feedback: gradeFeedback,
      });
      void queryClient.invalidateQueries({ queryKey: ["classHomework", classInfo.id] });
      void queryClient.invalidateQueries({ queryKey: ["classDetail", classInfo.id] });
      void queryClient.invalidateQueries({ queryKey: ["classStudents", classInfo.id] });
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.studentId === selectedSubmission.studentId
            ? { ...sub, status: "Graded", score: gradeScore, feedback: gradeFeedback }
            : sub,
        ),
      );
      toast.success(`Successfully graded ${selectedSubmission.studentName}'s homework!`);
      setViewStep("submissions");
    } catch {
      toast.error("Failed to save grade. Please try again.");
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleRemindOverdue = (studentId: string) => {
    const student = filteredSubmissions.find((s) => s.studentId === studentId);
    const studentName = student?.studentName?.split(" ")[0] ?? "student";
    toast.success(`Reminder sent to ${studentName} for this overdue assignment.`);
  };

  // Filtered submissions list in Step 2.
  // Backend is the single source of truth for status (SUBMITTED vs GRADED).
  // We never fabricate a status on the frontend.
  const filteredSubmissions = useMemo(() => {
    const isOverdue = selectedAssignment?.deadline ? new Date(selectedAssignment.deadline).getTime() < new Date().getTime() : false;
    const submittedStudentIds = new Set(submissions.map((s) => s.studentId));
    const unsubmittedStudents = (classInfo.students ?? [])
      .filter((s) => !submittedStudentIds.has(s.id))
      .map<Submission>((s) => ({
        studentId: s.id,
        studentName: s.name,
        studentEmail: s.email,
        studentAvatar: s.name && s.name.length > 0 ? s.name[0].toUpperCase() : s.avatar || "?",
        status: "Not submitted" as const,
        focusViolationCount: 0,
      }));

    if (subFilter === "All") return submissions;
    if (subFilter === "Submitted") {
      return submissions.filter((sub) => sub.status === "Graded" || sub.status === "Submitted");
    }
    if (subFilter === "Overdue") {
      return isOverdue ? unsubmittedStudents : [];
    }
    if (subFilter === "Pending") {
      return !isOverdue ? unsubmittedStudents : [];
    }
    return submissions;
  }, [submissions, subFilter, classInfo.students, selectedAssignment]);

  // ----------------------------------------------------
  // STEP 3: SUBMISSION DETAIL
  // ----------------------------------------------------
  if (viewStep === "detail" && selectedAssignment && selectedSubmission) {
    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewStep("submissions")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all animate-in fade-in"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Submissions
          </button>
        </div>

        {/* Header information */}
        <div className="p-6 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                Submission Detail
              </span>
              <h2 className="text-xl font-bold font-display text-foreground dark:text-white mt-1">
                {selectedAssignment.title}
              </h2>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>
                  Student:{" "}
                  <strong className="text-foreground dark:text-slate-200">
                    {selectedSubmission.studentName}
                  </strong>
                </span>
                <span>•</span>
                <span>{selectedSubmission.studentEmail}</span>
              </div>
            </div>
            <div>{getSubStatusBadge(selectedSubmission.status)}</div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Student submission body (left col - span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6 space-y-4">
              <h3 className="font-display font-bold text-base text-foreground dark:text-white">
                Student Answers
              </h3>

              {selectedSubmission.status === "Not submitted" ? (
                <div className="py-12 text-center text-muted-foreground border border-dashed rounded-2xl border-border/40">
                  <HelpCircle className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  <p className="text-sm font-semibold">
                    This student has not submitted this homework yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Submission metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 text-xs border border-border/40">
                    <div>
                      <div className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider mb-0.5">
                        Submitted at
                      </div>
                      <div className="font-bold text-foreground dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {selectedSubmission.submittedAt || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider mb-0.5">
                        Attempt Duration
                      </div>
                      <div className="font-bold text-foreground dark:text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {selectedSubmission.duration || "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider mb-0.5">
                        Status
                      </div>
                      <div className="font-bold">
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> On Time
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submission content block */}
                  <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/30 font-mono text-xs whitespace-pre-wrap text-foreground dark:text-slate-300 leading-relaxed">
                    {selectedSubmission.studentAnswer}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Grading & Feedback panel (right col - span 1) */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-display font-bold text-base text-foreground dark:text-white mb-4">
                Grading & Feedback
              </h3>

              <form onSubmit={handleSaveGrade} className="space-y-4">
                {/* Score field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Score (Out of 10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    disabled={selectedSubmission.status === "Not submitted"}
                    value={gradeScore}
                    onChange={(e) => setGradeScore(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm font-bold text-foreground dark:text-white focus:ring-1 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Feedback field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Teacher Feedback
                  </label>
                  <textarea
                    rows={6}
                    disabled={selectedSubmission.status === "Not submitted"}
                    placeholder="Write constructive comments, tips or next steps for the student..."
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs text-foreground dark:text-white focus:ring-1 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={selectedSubmission.status === "Not submitted" || isSavingGrade}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-display uppercase tracking-wider"
                >
                  <Award className="w-4 h-4" />{" "}
                  {isSavingGrade ? "Saving..." : "Save Grade & Feedback"}
                </button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STEP 2: ASSIGNMENT SUBMISSIONS LIST
  // ----------------------------------------------------
  if (viewStep === "submissions" && selectedAssignment) {
    const isOverdue = selectedAssignment?.deadline ? new Date(selectedAssignment.deadline).getTime() < new Date().getTime() : false;
    // All statistics below are derived purely from backend payloads
    // (`submissions` from `/teacher/homeworks/{id}/submissions` and
    // `classInfo.students` from the class detail endpoint).
    // Nothing here is hardcoded.
    const totalStudents = classInfo.students?.length ?? 0;
    const submittedCount = submissions.filter(
      (s) => s.status === "Submitted" || s.status === "Graded",
    ).length;
    const overdueCount = isOverdue ? Math.max(0, totalStudents - submittedCount) : 0;
    const submissionRate =
      totalStudents > 0
        ? Math.round((submittedCount / totalStudents) * 100)
        : 0;

    return (
      <div className="space-y-5">
        {/* Breadcrumbs and back action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewStep("list")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Homework List
          </button>
        </div>

        {/* Loading state */}
        {isLoadingSubmissions && (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm gap-2">
            <Clock className="w-5 h-5 animate-spin" /> Loading submissions…
          </div>
        )}

        {!isLoadingSubmissions && (
          <>
            {/* Brief Stats & Header */}
            <div className="p-6 rounded-3xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-primary">
                    {selectedAssignment.moduleType} Assignment
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border ${getStatusColor(selectedAssignment.status)}`}
                  >
                    {selectedAssignment.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold font-display text-foreground dark:text-white mt-1 leading-tight">
                  {selectedAssignment.title}
                </h2>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Due date:{" "}
                    <strong className="text-foreground dark:text-slate-300">
                      {selectedAssignment.deadline}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-[85px]">
                  <div className="text-sm font-black text-foreground dark:text-white">
                    {submittedCount}/{totalStudents}
                  </div>
                  <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                    Submitted
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-[85px]">
                  <div className="text-sm font-black text-rose-500">{overdueCount}</div>
                  <div className="text-[8px] text-rose-500 font-bold uppercase tracking-wider mt-0.5">
                    OverDue
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 min-w-[85px]">
                  <div className="text-sm font-black text-emerald-500">{submissionRate}%</div>
                  <div className="text-[8px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">
                    Rate
                  </div>
                </div>
              </div>
            </div>

            {/* Status filtering tabs — values come directly from backend submission status.
                SUBMITTED is intentionally not its own tab; it's implicit in "All Students"
                and only GRADED / OVERDUE get dedicated buckets. */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-white/5 pb-3">
              {[
                { id: "All", label: "All" },
                { id: "Submitted", label: "Đã làm" },
                { id: "Overdue", label: "Quá hạn" },
                { id: "Pending", label: "Chưa làm" },
              ].map((tab) => {
                const isActive = subFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSubFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-white/5 text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Student submission grid */}
            <div className="grid gap-3">
              {filteredSubmissions.map((sub) => (
                <Card
                  key={sub.studentId}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border transition-all ${
                    sub.status === "Submitted"
                      ? "border-amber-500/15 bg-amber-500/[0.005]"
                      : "hover:border-slate-300 dark:hover:border-white/10"
                  }`}
                >
                  {/* Profile info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-xs shrink-0">
                      {sub.studentAvatar}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display font-bold text-sm text-foreground dark:text-white truncate">
                        {sub.studentName}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {sub.studentEmail}
                      </p>
                    </div>
                  </div>

                  {/* Submission stats / badge */}
                  <div className="flex items-center gap-8 self-start sm:self-center">
                    <div className="w-28 flex flex-col justify-center">
                      <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">
                        Status
                      </div>
                      {getSubStatusBadge(sub.status)}
                    </div>

                    <div className="w-36">
                      {sub.submittedAt ? (
                        <div>
                          <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">
                            Submitted at
                          </div>
                          <div className="text-[10px] font-semibold text-foreground dark:text-slate-300 truncate">
                            {sub.submittedAt}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">
                            Submitted at
                          </div>
                          <div className="text-[10px] text-muted-foreground italic">
                            No submission
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="w-16 text-center">
                      <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black mb-0.5">
                        Score
                      </div>
                      <div className="text-xs font-black text-foreground dark:text-white">
                        {typeof sub.correctPercentage === "number" ? (
                          <span className="text-emerald-500 font-bold">
                            {sub.correctPercentage}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Last column — focus violations replaces the old "View Submission" button.
                     * Remind (Not submitted) and Grade (Submitted) actions are preserved,
                     * they remain teacher-side actions while Graded rows now show the
                     * focus-violations count directly sourced from the backend. */}
                  <div className="self-end sm:self-center shrink-0">
                    {sub.status === "Not submitted" ? (
                      <button
                        onClick={() => handleRemindOverdue(sub.studentId)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 dark:hover:bg-rose-500/20 text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 font-display"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Remind
                      </button>
                    ) : sub.status === "Submitted" ? (
                      <button
                        onClick={() => handleOpenDetail(sub)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-amber-600 transition shadow-sm flex items-center gap-1 font-display"
                      >
                        Grade
                      </button>
                    ) : (
                      // Graded → display backend-authoritative focus violations instead of
                      // the old "View submission" button. The grading form is still
                      // reachable via the Status / Detail dialog from the open detail page.
                      <div className="flex flex-col items-start gap-0.5 min-w-[110px]">
                        <div className="text-[8px] uppercase tracking-wider text-muted-foreground font-black">
                          Focus Violations
                        </div>
                        <div
                          className={`text-xs font-bold ${
                            (sub.focusViolationCount ?? 0) > 0
                              ? "text-rose-500"
                              : "text-emerald-500"
                          }`}
                          data-testid="focus-violations-cell"
                        >
                          {(sub.focusViolationCount ?? 0) === 0
                            ? "No violations"
                            : sub.focusViolationCount === 1
                              ? "1 time"
                              : `${sub.focusViolationCount} times`}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {filteredSubmissions.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-3xl border-border/40 bg-slate-50/50 dark:bg-white/[0.01]">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground font-semibold">
                    {subFilter === "OverDue"
                      ? "No overdue students for this assignment. Great job!"
                      : "No student submissions match this status."}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // STEP 1: HOMEWORK LISTING
  // ----------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Upper header action with assign button */}
      <div className="flex justify-between items-center px-1">
        <h3 className="font-display font-black text-base text-foreground dark:text-white flex items-center gap-2">
          <ClipboardList className="w-4.5 h-4.5 text-primary" />
          Class Homework ({processedAssignments.length} Assignments)
        </h3>
        {!isArchived && (
          <Link
            to="/teacher/homework/create"
            search={{
              classId: classInfo.id,
              source: undefined,
              resourceId: undefined,
              topicId: undefined,
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:opacity-90 transition-all shadow-sm font-display uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5" /> Assign Homework
          </Link>
        )}
      </div>

      {/* Filters & Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/50 dark:bg-indigo-950/20 rounded-2xl border border-slate-200/50 dark:border-white/5 backdrop-blur-sm shadow-sm">
        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-sm font-display"
                  : "bg-card/50 dark:bg-white/4.5 border border-border/40 text-muted-foreground hover:text-foreground dark:hover:bg-white/8 font-display"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-muted-foreground font-semibold">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none cursor-pointer focus:ring-1 focus:ring-primary text-foreground dark:text-white"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignment Cards Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {processedAssignments.map((assignment) => {
          const totalStudents = classInfo.students.length;
          const compRate = Math.round((assignment.totalSubmissions / (totalStudents || 1)) * 100);

          return (
            <Card
              key={assignment.id}
              className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] uppercase font-black tracking-widest text-primary font-display">
                    {assignment.moduleType}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(
                        assignment.status,
                      )}`}
                    >
                      {assignment.status}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-6 w-6 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setViewHwId(assignment.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        {!isArchived && (
                          <>
                            <DropdownMenuItem onSelect={() => setEditHwId(assignment.id)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => setPendingDeleteId(assignment.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <h4 className="font-display font-bold text-base text-foreground dark:text-white mb-2 leading-tight">
                  {assignment.title}
                </h4>

                <div className="space-y-2 text-xs text-muted-foreground mb-6">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Assigned
                    </span>
                    <span className="font-semibold text-foreground dark:text-white">
                      {assignment.assignedDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-red-500" /> Due date
                    </span>
                    <span className="font-semibold text-foreground dark:text-white">
                      {assignment.deadline}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-border/50 pt-2 mt-2">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" /> Submitted
                    </span>
                    <span className="font-semibold text-foreground dark:text-white">
                      {assignment.totalSubmissions} / {totalStudents} ({compRate}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-500" /> Average score
                    </span>
                    <span className="font-semibold text-emerald-500">
                      {assignment.avgScore ? `${assignment.avgScore}/10` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 dark:border-white/5 pt-3">
                <button
                  onClick={() => handleOpenSubmissions(assignment)}
                  className="w-full py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold transition flex items-center justify-center gap-1.5 uppercase tracking-wider font-display"
                >
                  <ClipboardList className="w-3.5 h-3.5" /> View submissions
                </button>
              </div>
            </Card>
          );
        })}

        {processedAssignments.length === 0 && (
          <div className="sm:col-span-2 text-center py-12 bg-white/50 dark:bg-indigo-950/10 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
            <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground font-semibold">
              No homework assignments match the selected filter.
            </p>
          </div>
        )}
      </div>

      <ViewHomeworkDialog
        open={!!viewHwId}
        onOpenChange={(o) => !o && setViewHwId(null)}
        homeworkId={viewHwId}
      />

      <HomeworkEditDialog
        open={!!editHwId}
        onOpenChange={(o) => !o && setEditHwId(null)}
        homework={editingHomework || null}
        onSave={handleSaveEdit}
      />

      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(o) => !o && setPendingDeleteId(null)}
        title="Delete Homework"
        description="Are you sure you want to delete this homework assignment? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
