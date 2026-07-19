import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Pencil,
  Archive,
  RotateCcw,
  Search,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examsApi, type ExamResponse } from "@/lib/api/exams";

type LevelUpper = "N5" | "N4" | "N3" | "N2" | "N1";
type ExamStatus = "Active" | "Draft" | "Archived";

function mapStatusToUi(status: string): ExamStatus {
  if (status === "PUBLISHED") return "Active";
  if (status === "ARCHIVED") return "Archived";
  return "Draft";
}

function StatusBadge({ status }: { status: ExamStatus }) {
  const configs: Record<ExamStatus, { label: string; color: string; bg: string }> = {
    Active: {
      label: "Active",
      color: "text-[var(--status-active)]",
      bg: "bg-[var(--status-active)]",
    },
    Draft: {
      label: "Draft",
      color: "text-[var(--status-pending)]",
      bg: "bg-[var(--status-pending)]",
    },
    Archived: {
      label: "Archived",
      color: "text-[var(--status-suspended)]",
      bg: "bg-[var(--status-suspended)]",
    },
  };
  const cfg = configs[status] || configs["Active"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
      {cfg.label}
    </span>
  );
}

export const Route = createFileRoute("/admin/jlpt-exam/$level/_index")({
  component: ExamListPage,
});

function ExamListPage() {
  const { level } = Route.useParams();
  const upperLevel = level.toUpperCase() as LevelUpper;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [archiveExam, setArchiveExam] = useState<ExamResponse | null>(null);
  const [restoreExam, setRestoreExam] = useState<ExamResponse | null>(null);

  const {
    data: rawExams = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["exam-bank", upperLevel],
    queryFn: async () => {
      const res = await examsApi.getAllExams();
      return res;
    },
  });

  const exams = rawExams.filter((e) => e.level === upperLevel && e.category === "JLPT");

  const archiveMutation = useMutation({
    mutationFn: (examId: string) => examsApi.updateExam(examId, { status: "ARCHIVED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-bank", upperLevel] });
      setArchiveExam(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (examId: string) => examsApi.updateExam(examId, { status: "PUBLISHED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-bank", upperLevel] });
      setRestoreExam(null);
    },
  });

  const filteredExams = exams.filter(
    (exam) => !search || exam.title.toLowerCase().includes(search.toLowerCase()),
  );

  const handleArchive = (exam: ExamResponse) => {
    archiveMutation.mutate(exam.id);
  };

  const handleRestore = (exam: ExamResponse) => {
    restoreMutation.mutate(exam.id);
  };

  return (
    <div className="space-y-5">
      {/* Back Button */}
      <Link
        to="/admin/jlpt-exam"
        className="inline-flex items-center gap-2 text-sm text-muted-col hover:text-primary-col transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to JLPT Exam
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-display font-black text-primary-col">
              {upperLevel} JLPT Exam
            </h1>
            <p className="text-sm text-secondary-col mt-0.5">{exams.length} exams</p>
          </div>
          <Link
            to="/admin/jlpt-exam/$level/create"
            params={{ level: level }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Create Exam
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.18_270)]/12 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Total Exams
            </p>
            <p className="font-display font-black text-lg text-primary-col">{exams.length}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-[var(--status-active)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Active</p>
            <p className="font-display font-black text-lg text-primary-col">
              {exams.filter((e) => mapStatusToUi(e.status) === "Active").length}
            </p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-pending)]/12 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[var(--status-pending)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Draft</p>
            <p className="font-display font-black text-lg text-primary-col">
              {exams.filter((e) => mapStatusToUi(e.status) === "Draft").length}
            </p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-suspended)]/12 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5 text-[var(--status-suspended)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">
              Archived
            </p>
            <p className="font-display font-black text-lg text-primary-col">
              {exams.filter((e) => mapStatusToUi(e.status) === "Archived").length}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-col" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exams..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30"
        />
      </div>

      {/* Exams Table */}
      {isLoading ? (
        <div className="card-base p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="card-base p-12 flex flex-col items-center justify-center">
          <FileText className="w-12 h-12 text-muted-col/40 mb-3" />
          <h3 className="text-primary-col font-semibold text-sm">No exams found</h3>
          <p className="text-secondary-col text-xs mt-1">Create your first exam to get started</p>
          {!search && (
            <Link
              to="/admin/jlpt-exam/$level/create"
              params={{ level: level }}
              className="mt-4 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
            >
              Create Exam
            </Link>
          )}
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b separator">
            <div className="col-span-5 text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Exam
            </div>
            <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Status
            </div>
            <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Questions
            </div>
            <div className="col-span-3 text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">
              Actions
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[var(--border)]">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-[var(--accent)]/50 transition items-center"
              >
                <div className="col-span-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.18_270)]/12 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary-col">{exam.title}</p>
                      <p className="text-xs text-muted-col mt-0.5">{exam.timeLimit} min</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <StatusBadge status={mapStatusToUi(exam.status)} />
                </div>
                <div className="col-span-2 text-center">
                  <span className="text-sm font-medium text-muted-col">
                    {exam.questions?.length ?? exam.totalQuestions ?? 0}
                  </span>
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <Link
                    to="/admin/jlpt-exam/$level/$examId/edit"
                    params={{ level: upperLevel.toLowerCase(), examId: exam.id }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[oklch(0.62_0.18_270)]/10 text-[oklch(0.62_0.18_270)] hover:bg-[oklch(0.62_0.18_270)]/20 transition text-xs font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  {mapStatusToUi(exam.status) === "Archived" ? (
                    <button
                      onClick={() => handleRestore(exam)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--status-active)]/10 text-[var(--status-active)] hover:bg-[var(--status-active)]/20 transition text-xs font-medium"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => setArchiveExam(exam)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 transition text-xs font-medium"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Archive
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Archive Confirm Modal */}
      <AlertDialog open={!!archiveExam} onOpenChange={(open) => !open && setArchiveExam(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-2">
              <Archive className="w-6 h-6 text-yellow-500" />
            </div>
            <AlertDialogTitle className="text-center">Archive Exam</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to archive "{archiveExam?.title}"? This exam will be hidden but
              can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setArchiveExam(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveExam && handleArchive(archiveExam)}
              className="bg-yellow-500 hover:bg-yellow-600"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirm Modal */}
      <AlertDialog open={!!restoreExam} onOpenChange={(open) => !open && setRestoreExam(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="w-12 h-12 rounded-full bg-[var(--status-active)]/10 flex items-center justify-center mx-auto mb-2">
              <RotateCcw className="w-6 h-6 text-[var(--status-active)]" />
            </div>
            <AlertDialogTitle className="text-center">Restore Exam</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to restore "{restoreExam?.title}"? This exam will be available
              for students again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRestoreExam(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreExam && handleRestore(restoreExam)}
              className="bg-[var(--status-active)] hover:opacity-90"
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
