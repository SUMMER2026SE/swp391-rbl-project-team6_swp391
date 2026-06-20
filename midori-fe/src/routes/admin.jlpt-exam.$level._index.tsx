import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Pencil, Archive, RotateCcw,
  Search, ArrowLeft, Loader2, CheckCircle, Trash2, X
} from "lucide-react";
import {
  type JLPTLevel,
  type JLPTExam,
  type ExamStatus,
  getExamsByLevel,
} from "@/mocks/jlptExamMock";

type LevelUpper = "N5" | "N4" | "N3" | "N2" | "N1";

function StatusBadge({ status }: { status: ExamStatus }) {
  const configs: Record<ExamStatus, { label: string; color: string }> = {
    Active: { label: "Active", color: "bg-[var(--status-active)]/10 text-[var(--status-active)]" },
    Draft: { label: "Draft", color: "bg-[var(--status-pending)]/10 text-[var(--status-pending)]" },
    Archived: { label: "Archived", color: "bg-muted text-muted-col" },
  };
  const cfg = configs[status] || configs["Active"];
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export const Route = createFileRoute("/admin/jlpt-exam/$level/_index")({
  component: ExamListPage,
});

function ExamListPage() {
  const { level } = Route.useParams();
  const upperLevel = (level.toUpperCase() as LevelUpper);

  const [exams, setExams] = useState<JLPTExam[]>(() => getExamsByLevel(upperLevel as JLPTLevel));
  const [search, setSearch] = useState("");
  const [archiveExam, setArchiveExam] = useState<JLPTExam | null>(null);
  const [restoreExam, setRestoreExam] = useState<JLPTExam | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredExams = exams.filter(exam =>
    !search || exam.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleArchive = (exam: JLPTExam) => {
    setExams(prev => prev.map(e =>
      e.id === exam.id ? { ...e, status: "Archived" as ExamStatus } : e
    ));
    setArchiveExam(null);
  };

  const handleRestore = (exam: JLPTExam) => {
    setExams(prev => prev.map(e =>
      e.id === exam.id ? { ...e, status: "Active" as ExamStatus } : e
    ));
    setRestoreExam(null);
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
            <h1 className="text-2xl font-display font-black text-primary-col">{upperLevel} JLPT Exam</h1>
            <p className="text-sm text-secondary-col mt-0.5">{exams.length} exams</p>
          </div>
          <Link
            to="/admin/jlpt-exam/$level/create"
            params={{ level: level }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[oklch(0.62_0.18_270)] text-white text-sm font-bold shadow-md hover:opacity-90 transition"
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
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Total Exams</p>
            <p className="font-display font-black text-lg text-primary-col">{exams.length}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-active)]/12 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5 text-[var(--status-active)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Active</p>
            <p className="font-display font-black text-lg text-primary-col">{exams.filter(e => e.status === "Active").length}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--status-pending)]/12 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[var(--status-pending)]" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Draft</p>
            <p className="font-display font-black text-lg text-primary-col">{exams.filter(e => e.status === "Draft").length}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5 text-muted-col" />
          </div>
          <div>
            <p className="text-[10px] text-muted-col uppercase tracking-wider font-bold">Archived</p>
            <p className="font-display font-black text-lg text-primary-col">{exams.filter(e => e.status === "Archived").length}</p>
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
              className="mt-4 px-4 py-2.5 rounded-xl bg-[oklch(0.62_0.18_270)] text-white text-sm font-bold shadow-md hover:opacity-90 transition"
            >
              Create Exam
            </Link>
          )}
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b separator">
            <div className="col-span-5 text-[10px] uppercase tracking-wider text-muted-col font-bold">Exam</div>
            <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">Status</div>
            <div className="col-span-2 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">Questions</div>
            <div className="col-span-1 text-center text-[10px] uppercase tracking-wider text-muted-col font-bold">Duration</div>
            <div className="col-span-2 text-right text-[10px] uppercase tracking-wider text-muted-col font-bold">Actions</div>
          </div>
          {/* Table Rows */}
          <div>
            {filteredExams.map((exam, index) => (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-[var(--border)] hover:bg-[var(--accent)]/50 transition items-center"
              >
                <div className="col-span-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[oklch(0.62_0.18_270)]/12 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary-col">{exam.name}</p>
                      <div className="flex gap-2 mt-1 text-xs text-muted-col">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--status-active)]/10 text-[var(--status-active)]">V: {exam.vocabularyQuestions}</span>
                        <span className="px-1.5 py-0.5 rounded bg-[var(--status-pending)]/10 text-[var(--status-pending)]">G: {exam.grammarQuestions}</span>
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500">R: {exam.readingQuestions}</span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500">L: {exam.listeningQuestions}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <StatusBadge status={exam.status} />
                </div>
                <div className="col-span-2 flex justify-center gap-1">
                  <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                    {exam.vocabularyQuestions + exam.grammarQuestions + exam.readingQuestions + exam.listeningQuestions}
                  </span>
                </div>
                <div className="col-span-1 text-center text-sm text-muted-col">
                  {exam.duration} min
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Link
                    to="/admin/jlpt-exam/$level/$examId/edit"
                    params={{ level: upperLevel.toLowerCase(), examId: exam.id }}
                    className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  {exam.status === "Archived" ? (
                    <button
                      onClick={() => handleRestore(exam)}
                      className="p-2 rounded-lg bg-[var(--status-active)]/10 text-[var(--status-active)] hover:bg-[var(--status-active)]/20 transition"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setArchiveExam(exam)}
                      className="p-2 rounded-lg bg-muted text-muted-col hover:bg-muted/80 transition"
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Archive Confirm Modal */}
      <AnimatePresence>
        {archiveExam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setArchiveExam(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b separator">
                <h2 className="font-display font-bold text-primary-col text-base">Archive Exam</h2>
                <button 
                  onClick={() => setArchiveExam(null)} 
                  className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Archive className="w-6 h-6 text-muted-col" />
                </div>
                <h3 className="font-display font-bold text-primary-col text-lg text-center">Archive "{archiveExam.name}"?</h3>
                <p className="text-secondary-col text-sm text-center">
                  This exam will be hidden but can be restored later.
                </p>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t separator">
                <button 
                  onClick={() => setArchiveExam(null)} 
                  className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleArchive(archiveExam)} 
                  className="flex-1 py-2.5 rounded-xl bg-muted text-white text-sm font-bold shadow-md hover:bg-muted/80 transition"
                >
                  Archive
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restore Confirm Modal */}
      <AnimatePresence>
        {restoreExam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setRestoreExam(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b separator">
                <h2 className="font-display font-bold text-primary-col text-base">Restore Exam</h2>
                <button 
                  onClick={() => setRestoreExam(null)} 
                  className="p-2 rounded-xl glass-surface text-secondary-col hover:text-primary-col transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[var(--status-active)]/12 flex items-center justify-center mx-auto">
                  <RotateCcw className="w-6 h-6 text-[var(--status-active)]" />
                </div>
                <h3 className="font-display font-bold text-primary-col text-lg text-center">Restore "{restoreExam.name}"?</h3>
                <p className="text-secondary-col text-sm text-center">
                  This exam will be available for students again.
                </p>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t separator">
                <button 
                  onClick={() => setRestoreExam(null)} 
                  className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-bold hover:bg-[var(--accent)] transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleRestore(restoreExam)} 
                  className="flex-1 py-2.5 rounded-xl bg-[var(--status-active)] text-white text-sm font-bold shadow-md hover:opacity-90 transition"
                >
                  Restore
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
