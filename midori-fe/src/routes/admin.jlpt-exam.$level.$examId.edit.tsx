import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Check,
  Loader2,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  FileText,
  Headphones,
  Save,
  Pencil,
  Trash2,
  Plus,
  MoreHorizontal,
  BarChart3,
  Settings,
  ArrowLeft,
} from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { examsApi, type ExamResponse, type ExamQuestionResponse } from "@/lib/api/exams";

type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type ExamStatus = "Active" | "Draft" | "Archived";

export interface ExamQuestion {
  id: string;
  section: "Vocabulary" | "Grammar" | "Reading" | "Listening";
  questionNumber: number;
  type: "Multiple Choice" | "Fill in Blank" | "Listening Audio";
  question: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  audioUrl?: string;
  audioFileName?: string;
  passage?: string;
}

export const Route = createFileRoute("/admin/jlpt-exam/$level/$examId/edit")({
  component: EditExamPage,
});

type JLPTLevelUpper = "N5" | "N4" | "N3" | "N2" | "N1";

const JLPT_STRUCTURE: Record<
  JLPTLevelUpper,
  { vocab: number; grammar: number; reading: number; listening: number }
> = {
  N5: { vocab: 20, grammar: 25, reading: 25, listening: 30 },
  N4: { vocab: 25, grammar: 25, reading: 25, listening: 25 },
  N3: { vocab: 25, grammar: 25, reading: 25, listening: 25 },
  N2: { vocab: 30, grammar: 25, reading: 25, listening: 25 },
  N1: { vocab: 30, grammar: 30, reading: 25, listening: 25 },
};

type TabType = "total" | "vocabulary" | "grammar" | "reading" | "listening";

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "total", label: "Total", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "vocabulary", label: "Vocabulary", icon: <BookOpen className="w-4 h-4" /> },
  { id: "grammar", label: "Grammar", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "reading", label: "Reading", icon: <FileText className="w-4 h-4" /> },
  { id: "listening", label: "Listening", icon: <Headphones className="w-4 h-4" /> },
];

const SECTION_COLORS: Record<string, { text: string; border: string }> = {
  vocabulary: { text: "text-[oklch(0.62_0.18_270)]", border: "border-[oklch(0.62_0.18_270)]" },
  grammar: { text: "text-[oklch(0.72_0.15_230)]", border: "border-[oklch(0.72_0.15_230)]" },
  reading: { text: "text-[var(--status-pending)]", border: "border-[var(--status-pending)]" },
  listening: { text: "text-[oklch(0.6_0.22_25)]", border: "border-[oklch(0.6_0.22_25)]" },
};

const STATUS_CONFIG: Record<ExamStatus, { label: string; color: string; bg: string }> = {
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

function StatusBadge({ status }: { status: ExamStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
      {cfg.label}
    </span>
  );
}

// Row Action Menu Component
function RowActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-lg text-muted-col hover:text-primary-col hover:bg-[var(--accent)] transition opacity-0 group-hover:opacity-100"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-full mt-1 z-20 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden min-w-[120px]"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-primary-col hover:bg-[var(--accent)] transition"
            >
              <Pencil className="w-3.5 h-3.5 text-[oklch(0.62_0.18_270)]" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Question Card Component - Clean Design
function QuestionCard({
  question,
  sectionColor,
  onEdit,
  onDelete,
}: {
  question: ExamQuestion;
  sectionColor: { text: string };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="group flex items-start gap-4 px-4 py-4 hover:bg-[var(--accent)]/30 transition rounded-xl border border-transparent hover:border-[var(--border)]">
      <div
        className={`w-8 h-8 rounded-lg bg-[var(--accent)] ${sectionColor.text} flex items-center justify-center text-sm font-bold shrink-0 mt-0.5`}
      >
        {question.questionNumber}
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {question.passage && (
          <p className="text-xs text-muted-col italic bg-[var(--accent)]/50 p-2.5 rounded-lg line-clamp-2">
            {question.passage}
          </p>
        )}

        {question.audioFileName && (
          <div className="flex items-center gap-2 text-xs text-muted-col">
            <Headphones className="w-3.5 h-3.5" />
            <span className="truncate">{question.audioFileName}</span>
          </div>
        )}

        <p className="text-sm text-primary-col font-medium leading-relaxed">{question.question}</p>

        {question.options && question.options.length > 0 && (
          <div className="space-y-1.5">
            {question.options.map((opt, i) => {
              const isCorrect = question.correctAnswer === i;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 text-sm ${
                    isCorrect ? `${sectionColor.text} font-medium` : "text-muted-col"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded flex items-center justify-center text-xs font-semibold shrink-0 ${
                      isCorrect
                        ? `bg-[oklch(0.62_0.18_270)]/10 ${sectionColor.text}`
                        : "bg-[var(--accent)] text-muted-col/60"
                    }`}
                  >
                    {optionLabels[i]}
                  </span>
                  <span className="flex-1 truncate">{opt}</span>
                  {isCorrect && <Check className="w-4 h-4 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RowActionMenu onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

// Question Editor Dialog
function QuestionEditorDialog({
  open,
  onClose,
  question,
  section,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  question: ExamQuestion | null;
  section: "Vocabulary" | "Grammar" | "Reading" | "Listening";
  onSave: (q: ExamQuestion) => void;
}) {
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [passage, setPassage] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    if (question) {
      setQuestionText(question.question);
      setOptions(question.options || ["", "", "", ""]);
      setCorrectAnswer(question.correctAnswer ?? 0);
      setExplanation(question.explanation || "");
      setPassage(question.passage || "");
      setAudioFile(null);
    } else {
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(0);
      setExplanation("");
      setPassage("");
      setAudioFile(null);
    }
  }, [question, open]);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleSave = () => {
    if (!questionText.trim()) return;

    const newQuestion: ExamQuestion = {
      id: question?.id || `new-${Date.now()}`,
      section,
      questionNumber: question?.questionNumber || 0,
      type: section === "Listening" ? "Listening Audio" : "Multiple Choice",
      question: questionText,
      options: options.filter((o) => o.trim()),
      correctAnswer,
      explanation: explanation || undefined,
      passage: section === "Reading" ? passage : undefined,
      audioFileName: audioFile?.name || question?.audioFileName,
    };
    onSave(newQuestion);
    onClose();
  };

  const optionLabels = ["A", "B", "C", "D"];
  const sectionColor = SECTION_COLORS[section.toLowerCase() as keyof typeof SECTION_COLORS];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded ${sectionColor.text} bg-[var(--accent)] flex items-center justify-center text-xs font-bold`}
            >
              {section[0]}
            </span>
            {question ? "Edit Question" : `Add ${section} Question`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {section === "Reading" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-col uppercase tracking-wider">
                Reading Passage
              </label>
              <textarea
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
                rows={3}
                placeholder="Enter reading passage..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30 focus:border-[oklch(0.62_0.18_270)] transition resize-none"
              />
            </div>
          )}

          {section === "Listening" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-col uppercase tracking-wider">
                Audio File
              </label>
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[var(--border)] hover:border-[oklch(0.62_0.18_270)]/40 cursor-pointer transition bg-[var(--accent)]">
                <Headphones className="w-5 h-5 text-muted-col" />
                <span className="text-sm text-muted-col flex-1 truncate">
                  {audioFile ? audioFile.name : "Click to upload audio file..."}
                </span>
                <input
                  type="file"
                  accept=".mp3,.wav,audio/mpeg,audio/wav"
                  onChange={handleAudioChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-col uppercase tracking-wider">
              Question
            </label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              placeholder="Enter question text..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30 focus:border-[oklch(0.62_0.18_270)] transition resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-col uppercase tracking-wider">
              Answer Options
            </label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => setCorrectAnswer(i)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition shrink-0 ${
                    correctAnswer === i
                      ? `${sectionColor.text} bg-[oklch(0.62_0.18_270)]/10 ring-2 ring-[oklch(0.62_0.18_270)]/30`
                      : "bg-[var(--accent)] text-muted-col hover:bg-[var(--border)]"
                  }`}
                >
                  {correctAnswer === i ? <Check className="w-4 h-4" /> : optionLabels[i]}
                </button>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[i] = e.target.value;
                    setOptions(newOptions);
                  }}
                  placeholder={`Option ${optionLabels[i]}`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--accent)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30 focus:border-[oklch(0.62_0.18_270)] transition"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-col uppercase tracking-wider">
              Explanation <span className="normal-case font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Brief explanation..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30 focus:border-[oklch(0.62_0.18_270)] transition"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!questionText.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-50"
            >
              {question ? "Update" : "Add"} Question
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Section Content
function SectionContent({
  section,
  questions,
  required,
  onAdd,
  onEdit,
  onDelete,
}: {
  section: "Vocabulary" | "Grammar" | "Reading" | "Listening";
  questions: ExamQuestion[];
  required: number;
  onAdd: () => void;
  onEdit: (q: ExamQuestion) => void;
  onDelete: (id: string) => void;
}) {
  const sectionQuestions = questions.filter((q) => q.section === section);
  const count = sectionQuestions.length;
  const isComplete = count >= required;
  const colors = SECTION_COLORS[section.toLowerCase() as keyof typeof SECTION_COLORS];

  const SectionIcon = {
    Vocabulary: BookOpen,
    Grammar: GraduationCap,
    Reading: FileText,
    Listening: Headphones,
  }[section];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center`}
          >
            <SectionIcon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <h3 className="font-semibold text-primary-col">{section} Questions</h3>
            <p className="text-xs text-muted-col">
              {count}/{required}
              {isComplete && (
                <span className="text-[var(--status-active)] ml-1.5 font-medium">Complete</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[oklch(0.62_0.18_270)] hover:bg-[oklch(0.62_0.18_270)]/10 transition text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>

      {sectionQuestions.length === 0 ? (
        <div className="p-10 text-center rounded-xl border border-dashed border-[var(--border)]">
          <SectionIcon className="w-8 h-8 text-muted-col/50 mx-auto mb-3" />
          <p className="text-sm text-muted-col mb-4">No questions added yet</p>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[oklch(0.62_0.18_270)] hover:bg-[oklch(0.62_0.18_270)]/10 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add First Question
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sectionQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              sectionColor={colors}
              onEdit={() => onEdit(q)}
              onDelete={() => onDelete(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function mapSectionFromPrompt(prompt: string): {
  cleanPrompt: string;
  section: "Vocabulary" | "Grammar" | "Reading" | "Listening";
} {
  if (prompt.startsWith("[Vocabulary] ")) {
    return { cleanPrompt: prompt.substring(13), section: "Vocabulary" };
  }
  if (prompt.startsWith("[Grammar] ")) {
    return { cleanPrompt: prompt.substring(10), section: "Grammar" };
  }
  if (prompt.startsWith("[Reading] ")) {
    return { cleanPrompt: prompt.substring(10), section: "Reading" };
  }
  if (prompt.startsWith("[Listening] ")) {
    return { cleanPrompt: prompt.substring(12), section: "Listening" };
  }
  return { cleanPrompt: prompt, section: "Vocabulary" };
}

// Main Page Component
function EditExamPage() {
  const { level, examId } = Route.useParams();
  const navigate = useNavigate();
  const upperLevel = level.toUpperCase() as JLPTLevelUpper;
  const queryClient = useQueryClient();

  const {
    data: exam,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => examsApi.getExamById(examId),
  });

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [examName, setExamName] = useState("");
  const [status, setStatus] = useState<ExamStatus>("Draft");
  const [duration, setDuration] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>("total");

  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingSection, setEditingSection] = useState<
    "Vocabulary" | "Grammar" | "Reading" | "Listening"
  >("Vocabulary");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const structure = JLPT_STRUCTURE[upperLevel] || JLPT_STRUCTURE.N5;

  const [hasInitialized, setHasInitialized] = useState(false);
  useEffect(() => {
    if (exam && !hasInitialized) {
      setExamName(exam.title);
      setDuration(exam.timeLimit);

      let mappedStatus: ExamStatus = "Draft";
      if (exam.status === "PUBLISHED") mappedStatus = "Active";
      else if (exam.status === "ARCHIVED") mappedStatus = "Archived";
      setStatus(mappedStatus);

      const mappedQuestions: ExamQuestion[] = (exam.questions || []).map((q, idx) => {
        const { cleanPrompt, section } = mapSectionFromPrompt(q.prompt);
        return {
          id: q.id,
          section,
          questionNumber: q.displayOrder || idx + 1,
          type: "Multiple Choice",
          question: cleanPrompt,
          options: q.options,
          correctAnswer: q.correctAnswerIndex,
          explanation: "",
        };
      });
      setQuestions(mappedQuestions);
      setHasInitialized(true);
    }
  }, [exam, hasInitialized]);

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    const sectionMap: Record<TabType, "Vocabulary" | "Grammar" | "Reading" | "Listening"> = {
      total: "Vocabulary",
      vocabulary: "Vocabulary",
      grammar: "Grammar",
      reading: "Reading",
      listening: "Listening",
    };
    setEditingSection(sectionMap[activeTab]);
    setShowQuestionEditor(true);
  };

  const handleEditQuestion = (question: ExamQuestion) => {
    setEditingQuestion(question);
    setEditingSection(question.section);
    setShowQuestionEditor(true);
  };

  const handleSaveQuestion = (updatedQuestion: ExamQuestion) => {
    if (editingQuestion) {
      setQuestions((prev) => prev.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q)));
    } else {
      const newQuestion = {
        ...updatedQuestion,
        questionNumber: questions.filter((q) => q.section === updatedQuestion.section).length + 1,
      };
      setQuestions((prev) => [...prev, newQuestion]);
    }
  };

  const handleDeleteClick = (questionId: string) => {
    setDeletingQuestionId(questionId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deletingQuestionId) {
      setQuestions((prev) => prev.filter((q) => q.id !== deletingQuestionId));
      setDeletingQuestionId(null);
    }
    setShowDeleteConfirm(false);
  };

  const handleSubmit = async () => {
    if (!exam) return;
    if (!examName.trim()) {
      setError("Exam name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const backendStatus =
        status === "Active" ? "PUBLISHED" : status === "Draft" ? "DRAFT" : "ARCHIVED";

      await examsApi.updateExam(examId, {
        title: examName,
        timeLimit: duration,
        status: backendStatus,
      });

      const isUuid = (id: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

      await examsApi.updateExamQuestions(examId, {
        questions: questions.map((q, idx) => ({
          id: isUuid(q.id) ? q.id : undefined,
          prompt: `[${q.section}] ${q.question}`,
          options: q.options || [],
          correctAnswerIndex: q.correctAnswer || 0,
          points: 1,
          displayOrder: idx + 1,
        })),
      });

      queryClient.invalidateQueries({ queryKey: ["exam", examId] });
      queryClient.invalidateQueries({ queryKey: ["exam-bank", upperLevel] });
      queryClient.invalidateQueries({ queryKey: ["exam-bank"] });

      setSuccessMessage("Exam updated successfully!");

      setTimeout(() => {
        navigate({ to: "/admin/jlpt-exam/$level", params: { level } });
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  const tabCounts = {
    total: questions.length,
    vocabulary: questions.filter((q) => q.section === "Vocabulary").length,
    grammar: questions.filter((q) => q.section === "Grammar").length,
    reading: questions.filter((q) => q.section === "Reading").length,
    listening: questions.filter((q) => q.section === "Listening").length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-[oklch(0.62_0.18_270)]/30 border-t-[oklch(0.62_0.18_270)] rounded-full animate-spin mb-4" />
        <p className="text-sm text-muted-col">Loading exam...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-16 h-16 text-red-500/30 mb-4" />
        <h2 className="text-xl font-bold text-primary-col mb-2">Exam Not Found</h2>
        <Link
          to="/admin/jlpt-exam/$level"
          params={{ level }}
          className="px-4 py-2 rounded-xl bg-[oklch(0.62_0.18_270)]/10 text-[oklch(0.62_0.18_270)] text-sm font-medium hover:bg-[oklch(0.62_0.18_270)]/20 transition"
        >
          Back to Exam List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back Button */}
      <Link
        to="/admin/jlpt-exam/$level"
        params={{ level: level.toLowerCase() }}
        className="inline-flex items-center gap-2 text-sm text-muted-col hover:text-primary-col transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {upperLevel} JLPT Exam
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-black text-primary-col">
            {examName || "Exam Editor"}
          </h1>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/jlpt-exam/$level"
            params={{ level: level.toLowerCase() }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-secondary-col text-sm font-medium hover:bg-[var(--accent)] transition"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Container - Increased padding */}
      <div className="card-base p-6 space-y-8">
        {/* Exam Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-col" />
            <h2 className="text-sm font-semibold text-muted-col uppercase tracking-wider">
              Exam Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-col uppercase tracking-wider">
                Exam Name
              </label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30 focus:border-[oklch(0.62_0.18_270)] transition placeholder:text-muted-col/50"
                placeholder="Enter exam name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-col uppercase tracking-wider">
                Duration (min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
                min={1}
                max={300}
                className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30 focus:border-[oklch(0.62_0.18_270)] transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-col uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ExamStatus)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.18_270)]/30 focus:border-[oklch(0.62_0.18_270)] transition cursor-pointer"
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--border)]" />

        {/* Question Management Section */}
        <div className="space-y-5">
          <h2 className="text-sm font-semibold text-muted-col uppercase tracking-wider">
            Question Management
          </h2>

          {/* Redesigned Tabs - Underline Style */}
          <div className="border-b border-[var(--border)]">
            <div className="flex items-end gap-1 -mb-px overflow-x-auto">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition whitespace-nowrap border-b-2 ${
                      isActive
                        ? "text-[oklch(0.62_0.18_270)] border-[oklch(0.62_0.18_270)]"
                        : "text-muted-col border-transparent hover:text-primary-col hover:border-[var(--border)]"
                    }`}
                  >
                    <span className="hidden sm:inline">{tab.icon}</span>
                    {tab.label}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isActive
                          ? "bg-[oklch(0.62_0.18_270)]/10 text-[oklch(0.62_0.18_270)]"
                          : "bg-[var(--accent)] text-muted-col"
                      }`}
                    >
                      {tabCounts[tab.id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "total" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-col">All questions across all sections.</p>
                {questions.length === 0 ? (
                  <div className="p-10 text-center rounded-xl border border-dashed border-[var(--border)]">
                    <BarChart3 className="w-8 h-8 text-muted-col/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-col mb-4">No questions added yet</p>
                    <button
                      onClick={handleAddQuestion}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[oklch(0.62_0.18_270)] hover:bg-[oklch(0.62_0.18_270)]/10 transition text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add First Question
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]/50">
                    {questions.map((q) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        sectionColor={
                          SECTION_COLORS[q.section.toLowerCase() as keyof typeof SECTION_COLORS]
                        }
                        onEdit={() => handleEditQuestion(q)}
                        onDelete={() => handleDeleteClick(q.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {activeTab === "vocabulary" && (
              <SectionContent
                section="Vocabulary"
                questions={questions}
                required={structure.vocab}
                onAdd={handleAddQuestion}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteClick}
              />
            )}
            {activeTab === "grammar" && (
              <SectionContent
                section="Grammar"
                questions={questions}
                required={structure.grammar}
                onAdd={handleAddQuestion}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteClick}
              />
            )}
            {activeTab === "reading" && (
              <SectionContent
                section="Reading"
                questions={questions}
                required={structure.reading}
                onAdd={handleAddQuestion}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteClick}
              />
            )}
            {activeTab === "listening" && (
              <SectionContent
                section="Listening"
                questions={questions}
                required={structure.listening}
                onAdd={handleAddQuestion}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50 px-5 py-3 rounded-xl bg-[var(--status-active)] text-white shadow-lg flex items-center gap-2 text-sm font-medium"
          >
            <CheckCircle className="w-5 h-5" />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl bg-red-500/10 text-red-500 text-sm font-medium flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The question will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingQuestionId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question Editor Dialog */}
      <QuestionEditorDialog
        open={showQuestionEditor}
        onClose={() => {
          setShowQuestionEditor(false);
          setEditingQuestion(null);
        }}
        question={editingQuestion}
        section={editingSection}
        onSave={handleSaveQuestion}
      />
    </div>
  );
}
