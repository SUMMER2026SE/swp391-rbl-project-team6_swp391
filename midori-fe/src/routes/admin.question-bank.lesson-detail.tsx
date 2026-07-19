import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSearch } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Trash2,
  BookOpen,
  Upload,
  FileSpreadsheet,
  Pencil,
  ArrowLeft,
  Filter,
  X,
  Eye,
  Edit3,
  CheckCircle,
  Music,
  Clock,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  XCircle,
} from "lucide-react";
import {
  questionBankService,
  useQuestionBank,
  type Question,
} from "../services/questionBankService";
import { isListeningQuestion, formatDuration } from "../services/questionBank.types";
import { QuestionBankStickyHeader } from "../components/question-bank-sticky-header";

// ─── Routes ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/question-bank/lesson-detail")({
  component: QuestionBankLessonDetailPage,
});

// Types
type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type QuestionType = "Vocabulary" | "Grammar" | "Reading" | "Listening";
type Difficulty = "Easy" | "Medium" | "Hard";

// ─── Delete Confirmation Dialog ─────────────────────────────────────────────────

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-md glass-modal rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="font-display font-bold text-primary-col text-lg text-center">{title}</h3>
          <p className="text-secondary-col text-sm text-center">{message}</p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t separator">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl glass-surface text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-md hover:bg-red-600 transition"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function QuestionBankLessonDetailPage() {
  const search = useSearch({ from: "/admin/question-bank/lesson-detail" }) as {
    level?: string;
    lessonId?: string;
  };
  const navigate = useNavigate();

  const level = (search.level?.toUpperCase() || "N5") as JLPTLevel;
  const lessonId = parseInt(search.lessonId || "1");

  const { lessons, questions: allQuestions, isLoading, deleteQuestion } = useQuestionBank(level);

  // Get lesson data from service
  const lesson = lessons.find((l) => l.id === lessonId);
  const lessonName = lesson?.lessonName || `Lesson ${lessonId}`;

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<QuestionType | "">("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "">("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; questionId: string | null }>({
    open: false,
    questionId: null,
  });
  const [collapsedSkills, setCollapsedSkills] = useState<Record<string, boolean>>({});

  const questions = allQuestions.filter((q) => q.lesson === lessonId);

  const filteredQuestions = questions.filter((q) => {
    const matchSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !typeFilter || q.type === typeFilter;
    const matchDifficulty = !difficultyFilter || q.difficulty === difficultyFilter;
    return matchSearch && matchType && matchDifficulty;
  });

  const byType = {
    Vocabulary: questions.filter((q) => q.type === "Vocabulary").length,
    Grammar: questions.filter((q) => q.type === "Grammar").length,
    Reading: questions.filter((q) => q.type === "Reading").length,
    Listening: questions.filter((q) => q.type === "Listening").length,
  };

  const groupedQuestions = useMemo(() => {
    const groups: Record<QuestionType, Question[]> = {
      Vocabulary: [],
      Grammar: [],
      Reading: [],
      Listening: [],
    };
    filteredQuestions.forEach((q) => {
      if (groups[q.type]) {
        groups[q.type].push(q);
      }
    });
    return groups;
  }, [filteredQuestions]);

  const handleDelete = (id: string) => {
    setDeleteConfirm({ open: true, questionId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.questionId) {
      try {
        await deleteQuestion(deleteConfirm.questionId);
        toast.success("Question deleted successfully");
      } catch (err: any) {
        toast.error(err?.message || "Failed to delete question");
      }
    }
    setDeleteConfirm({ open: false, questionId: null });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setDifficultyFilter("");
  };

  const hasFilters = searchTerm || typeFilter || difficultyFilter;

  return (
    <div className="space-y-6">
      {/* Sticky Header with Breadcrumb */}
      <QuestionBankStickyHeader
        backHref="/admin/question-bank/$level"
        backLabel="Back"
        level={level}
        breadcrumbs={[
          { label: "Question Bank", href: "/admin/question-bank" },
          { label: level, href: `/admin/question-bank/${level.toLowerCase()}` },
          { label: lessonName },
        ]}
        title={lessonName}
        subtitle="Manage lesson questions and content"
        actionButtons={
          <>
            <button
              onClick={() =>
                navigate({
                  to: `/admin/question-bank/import-excel?level=${level.toLowerCase()}&lessonId=${lessonId}`,
                })
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--status-active)]/12 text-[var(--status-active)] text-sm font-semibold border border-[var(--status-active)]/20 hover:bg-[var(--status-active)]/20 transition"
            >
              <Upload className="w-4 h-4" />
              Import PDF with AI
            </button>
            <button
              onClick={() =>
                navigate({
                  to: `/admin/question-bank/question-builder?level=${level.toLowerCase()}&lessonId=${lessonId}`,
                })
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              Create Question
            </button>
          </>
        }
        stats={
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="card-base p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-medium">
                    Total
                  </p>
                  <p className="font-display font-black text-xl text-primary-col">
                    {questions.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="card-base p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/12 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-medium">
                    Vocabulary
                  </p>
                  <p className="font-display font-black text-xl text-primary-col">
                    {byType.Vocabulary}
                  </p>
                </div>
              </div>
            </div>
            <div className="card-base p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/12 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-medium">
                    Grammar
                  </p>
                  <p className="font-display font-black text-xl text-primary-col">
                    {byType.Grammar}
                  </p>
                </div>
              </div>
            </div>
            <div className="card-base p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/12 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-medium">
                    Reading
                  </p>
                  <p className="font-display font-black text-xl text-primary-col">
                    {byType.Reading}
                  </p>
                </div>
              </div>
            </div>
            <div className="card-base p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/12 flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-col uppercase tracking-wider font-medium">
                    Listening
                  </p>
                  <p className="font-display font-black text-xl text-primary-col">
                    {byType.Listening}
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* Filters */}
      <div className="card-base p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as QuestionType | "")}
            className="px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          >
            <option value="">All Types</option>
            <option value="Vocabulary">Vocabulary</option>
            <option value="Grammar">Grammar</option>
            <option value="Reading">Reading</option>
            <option value="Listening">Listening</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | "")}
            className="px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-col hover:text-primary hover:bg-muted transition"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Question List Table */}
      {filteredQuestions.length === 0 ? (
        <div className="card-base p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-base font-semibold text-primary-col mb-2">
            {hasFilters ? "No Matching Questions" : "No Questions Yet"}
          </h3>
          <p className="text-sm text-muted-col mb-6 max-w-sm">
            {hasFilters
              ? "Try adjusting your search or filters."
              : "Add your first question to this lesson."}
          </p>
          {!hasFilters && (
            <button
              onClick={() =>
                navigate({
                  to: `/admin/question-bank/question-builder?level=${level.toLowerCase()}&lessonId=${lessonId}`,
                })
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition"
            >
              <Plus className="w-4 h-4" />
              Create Question
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {(["Vocabulary", "Grammar", "Reading", "Listening"] as QuestionType[]).map((skill) => {
            const list = groupedQuestions[skill];
            if (list.length === 0) return null;
            const isCollapsed = !!collapsedSkills[skill];

            return (
              <div key={skill} className="card-base overflow-hidden">
                {/* Skill Header */}
                <div
                  onClick={() => setCollapsedSkills((prev) => ({ ...prev, [skill]: !prev[skill] }))}
                  className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-muted/20 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-3 py-0.5 rounded text-xs font-extrabold uppercase tracking-wide border",
                      skill === "Vocabulary" && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                      skill === "Grammar" && "bg-purple-500/10 text-purple-600 border-purple-500/20",
                      skill === "Reading" && "bg-orange-500/10 text-orange-600 border-orange-500/20",
                      skill === "Listening" && "bg-pink-500/10 text-pink-600 border-pink-500/20"
                    )}>
                      {skill}
                    </span>
                    <span className="text-xs text-muted-col font-medium">({list.length} questions)</span>
                  </div>
                  <span className="text-muted-col hover:text-primary transition-colors">
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </span>
                </div>

                {!isCollapsed && (
                  <>
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-3 px-5 py-2.5 border-b border-[var(--border)] bg-muted/5 flex items-center">
                      <div className="col-span-1 text-[11px] uppercase tracking-wider text-muted-col font-bold">
                        No.
                      </div>
                      <div className="col-span-7 text-[11px] uppercase tracking-wider text-muted-col font-bold">
                        Question
                      </div>
                      <div className="col-span-1 text-center text-[11px] uppercase tracking-wider text-muted-col font-bold">
                        Diff
                      </div>
                      <div className="col-span-3 text-right text-[11px] uppercase tracking-wider text-muted-col font-bold">
                        Actions
                      </div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-[var(--border)]">
                      {list.map((q, index) => (
                        <div
                          key={q.id}
                          className="grid grid-cols-12 gap-3 px-5 py-4 hover:bg-[var(--accent)]/30 transition items-center"
                        >
                          <div className="col-span-1 flex items-center">
                            <span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-sm font-medium">
                              {index + 1}
                            </span>
                          </div>
                          <div className="col-span-7 flex items-center">
                            <div className="min-w-0">
                              {/* Listening audio badge */}
                              {isListeningQuestion(q) && q.audio?.audioUrl && (
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/12 text-pink-600 text-xs font-medium">
                                    <Music className="w-3 h-3" />
                                    Listening
                                  </span>
                                  <span className="flex items-center gap-1 text-xs text-muted-col">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(q.audio.audioDuration)}
                                  </span>
                                </div>
                              )}
                              <p className="text-sm text-primary-col font-medium line-clamp-2">
                                {q.questionText}
                              </p>
                              {/* Show audio file name for listening */}
                              {isListeningQuestion(q) && q.audio?.audioFileName && (
                                <p className="text-xs text-muted-col mt-1 truncate">
                                  {q.audio.audioFileName}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                                q.difficulty === "Easy"
                                  ? "bg-green-500/12 text-green-600 border-green-500/20"
                                  : q.difficulty === "Medium"
                                    ? "bg-yellow-500/12 text-yellow-600 border-yellow-500/20"
                                    : "bg-red-500/12 text-red-600 border-red-500/20"
                              }`}
                            >
                              {q.difficulty}
                            </span>
                          </div>
                          <div className="col-span-3 flex items-center justify-end gap-1.5">
                            <button
                              onClick={() =>
                                navigate({
                                  to: `/admin/question-bank/question-builder?level=${level.toLowerCase()}&lessonId=${lessonId}&editId=${q.id}`,
                                })
                              }
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition text-xs font-medium"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(q.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, questionId: null })}
        onConfirm={confirmDelete}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
      />
    </div>
  );
}
