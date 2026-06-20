import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  CheckCircle,
  Loader2,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  FileText,
  Headphones,
  Clock,
  Save,
  Pencil,
  Trash2,
  Plus,
  AlertCircle,
  Upload,
  Play,
  Pause,
  X,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Settings,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type JLPTLevel,
  type JLPTExam,
  type ExamStatus,
  type ExamQuestion,
  getExamById,
  getExamQuestions,
  updateExam,
} from "@/mocks/jlptExamMock";

export const Route = createFileRoute("/admin/jlpt-exam/$level/$examId/edit")({
  component: EditExamPage,
});

type JLPTLevelUpper = "N5" | "N4" | "N3" | "N2" | "N1";

const JLPT_STRUCTURE: Record<JLPTLevelUpper, { vocab: number; grammar: number; reading: number; listening: number }> = {
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

const SECTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  vocabulary: { bg: "bg-[oklch(0.62_0.18_270)]/10", text: "text-[oklch(0.62_0.18_270)]", border: "border-[oklch(0.62_0.18_270)]/20" },
  grammar: { bg: "bg-[oklch(0.72_0.15_230)]/10", text: "text-[oklch(0.72_0.15_230)]", border: "border-[oklch(0.72_0.15_230)]/20" },
  reading: { bg: "bg-[var(--status-pending)]/10", text: "text-[var(--status-pending)]", border: "border-[var(--status-pending)]/20" },
  listening: { bg: "bg-[oklch(0.6_0.22_25)]/10", text: "text-[oklch(0.6_0.22_25)]", border: "border-[oklch(0.6_0.22_25)]/20" },
};

const STATUS_CONFIG: Record<ExamStatus, { label: string; color: string; bg: string }> = {
  Active: { label: "Active", color: "text-[var(--status-active)]", bg: "bg-[var(--status-active)]" },
  Draft: { label: "Draft", color: "text-[var(--status-pending)]", bg: "bg-[var(--status-pending)]" },
  Archived: { label: "Archived", color: "text-[var(--status-suspended)]", bg: "bg-[var(--status-suspended)]" },
};

function StatusBadge({ status }: { status: ExamStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.bg}`} />
      {cfg.label}
    </span>
  );
}

// ============================================
// EXAM SETTINGS CARD (Collapsible)
// ============================================
function ExamSettingsCard({
  examName,
  setExamName,
  duration,
  setDuration,
  status,
  setStatus,
}: {
  examName: string;
  setExamName: (v: string) => void;
  duration: number;
  setDuration: (v: number) => void;
  status: ExamStatus;
  setStatus: (v: ExamStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="card-base overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--accent)] transition"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-muted-col" />
          <span className="text-sm font-bold text-primary-col">Exam Settings</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-col" /> : <ChevronDown className="w-4 h-4 text-muted-col" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Exam Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Exam Name</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:border-primary/40 transition"
                  placeholder="Enter exam name"
                />
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Duration (min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
                  min={1}
                  max={300}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:border-primary/40 transition"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ExamStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:border-primary/40 transition cursor-pointer"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// QUESTION CARD (Compact)
// ============================================
function QuestionCard({
  question,
  sectionColor,
  onEdit,
  onDelete,
}: {
  question: ExamQuestion;
  sectionColor: { bg: string; text: string; border: string };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className={`card-base p-4 border-l-4 ${sectionColor.border}`}>
      <div className="flex items-start gap-4">
        {/* Question Number */}
        <div className={`w-8 h-8 rounded-lg ${sectionColor.bg} ${sectionColor.text} flex items-center justify-center text-sm font-bold shrink-0`}>
          {question.questionNumber}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Passage for Reading */}
          {question.passage && (
            <p className="text-xs text-muted-col italic bg-[var(--accent)] p-2 rounded-lg line-clamp-2">
              {question.passage}
            </p>
          )}

          {/* Audio File for Listening */}
          {question.audioFileName && (
            <div className="flex items-center gap-2 text-xs text-muted-col">
              <Headphones className="w-3.5 h-3.5" />
              {question.audioFileName}
            </div>
          )}

          {/* Question Text */}
          <p className="text-sm text-primary-col">{question.question}</p>

          {/* Options */}
          {question.options && question.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {question.options.map((opt, i) => (
                <span
                  key={i}
                  className={`text-xs px-2 py-1 rounded-lg ${
                    question.correctAnswer === i
                      ? `${sectionColor.bg} ${sectionColor.text} font-medium`
                      : "bg-[var(--accent)] text-muted-col"
                  }`}
                >
                  {optionLabels[i]}. {opt}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-[oklch(0.62_0.18_270)]/10 text-[oklch(0.62_0.18_270)] hover:bg-[oklch(0.62_0.18_270)]/20 transition"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// QUESTION EDITOR DIALOG
// ============================================
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

  useEffect(() => {
    if (question) {
      setQuestionText(question.question);
      setOptions(question.options || ["", "", "", ""]);
      setCorrectAnswer(question.correctAnswer ?? 0);
      setExplanation(question.explanation || "");
      setPassage(question.passage || "");
    } else {
      setQuestionText("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(0);
      setExplanation("");
      setPassage("");
    }
  }, [question, open]);

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
      audioFileName: question?.audioFileName,
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
            <span className={`w-6 h-6 rounded ${sectionColor.bg} ${sectionColor.text} flex items-center justify-center text-xs font-bold`}>
              {section[0]}
            </span>
            {question ? "Edit Question" : `Add ${section} Question`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reading Passage */}
          {section === "Reading" && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Reading Passage</label>
              <textarea
                value={passage}
                onChange={(e) => setPassage(e.target.value)}
                rows={2}
                placeholder="Enter reading passage..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:border-primary/40 transition resize-none"
              />
            </div>
          )}

          {/* Question */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Question</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={2}
              placeholder="Enter question text..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm text-primary-col focus:outline-none focus:border-primary/40 transition resize-none"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Answer Options</label>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
                  correctAnswer === i ? `${sectionColor.bg} ${sectionColor.text}` : "bg-[var(--accent)] text-muted-col"
                }`}>
                  {optionLabels[i]}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...options];
                    newOptions[i] = e.target.value;
                    setOptions(newOptions);
                  }}
                  placeholder={`Option ${optionLabels[i]}`}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm focus:outline-none focus:border-primary/40 transition"
                />
                <button
                  onClick={() => setCorrectAnswer(i)}
                  className={`px-2 py-1 rounded text-xs font-bold transition ${
                    correctAnswer === i ? `${sectionColor.bg} ${sectionColor.text}` : "bg-[var(--accent)] text-muted-col hover:bg-[var(--border)]"
                  }`}
                >
                  {correctAnswer === i ? "Correct" : "Set"}
                </button>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-col uppercase tracking-wider">Explanation (Optional)</label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Brief explanation..."
              className="w-full px-3 py-2 rounded-lg bg-[var(--accent)] border border-[var(--border)] text-sm focus:outline-none focus:border-primary/40 transition"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-secondary-col text-sm font-bold hover:bg-[var(--border)] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!questionText.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition disabled:opacity-50"
            >
              {question ? "Update" : "Add"} Question
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// LISTENING AUDIO MANAGER
// ============================================
function ListeningAudioManager({ questions, onUpdate }: { questions: ExamQuestion[]; onUpdate: (q: ExamQuestion[]) => void }) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const listeningQuestions = questions.filter((q) => q.section === "Listening");
  const hasAudio = listeningQuestions.some((q) => q.audioFileName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="card-base p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-[oklch(0.6_0.22_25)]" />
          <span className="text-sm font-bold text-primary-col">Audio Files</span>
        </div>
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[oklch(0.6_0.22_25)]/10 text-[oklch(0.6_0.22_25)] text-xs font-bold cursor-pointer hover:bg-[oklch(0.6_0.22_25)]/20 transition">
          <Upload className="w-3.5 h-3.5" />
          Upload Audio
          <input type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" onChange={handleFileChange} className="hidden" />
        </label>
      </div>

      {audioUrl && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--accent)]">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-full bg-[oklch(0.6_0.22_25)] text-white flex items-center justify-center hover:bg-[oklch(0.6_0.22_25)]/80 transition"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-col truncate">{audioFile?.name}</p>
            <audio src={audioUrl} className="hidden" />
          </div>
          <span className="text-xs text-muted-col">{listeningQuestions.length} questions</span>
        </div>
      )}

      {!hasAudio && !audioUrl && (
        <p className="text-xs text-muted-col text-center py-4">No audio files uploaded yet</p>
      )}
    </div>
  );
}

// ============================================
// SECTION CONTENT (Vocabulary/Grammar/Reading/Listening)
// ============================================
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <SectionIcon className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <h3 className="font-bold text-primary-col">{section} Questions</h3>
            <p className="text-xs text-muted-col">
              {count}/{required} {isComplete ? <span className="text-[var(--status-active)] ml-1">Complete</span> : ""}
            </p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Questions */}
      {sectionQuestions.length === 0 ? (
        <div className="card-base p-8 text-center">
          <SectionIcon className="w-8 h-8 text-muted-col mx-auto mb-2" />
          <p className="text-sm text-muted-col mb-3">No questions yet</p>
          <button
            onClick={onAdd}
            className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition"
          >
            <Plus className="w-4 h-4 inline mr-1" />
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

// ============================================
// TOTAL TAB CONTENT
// ============================================
function TotalContent({
  exam,
  questions,
  structure,
}: {
  exam: JLPTExam;
  questions: ExamQuestion[];
  structure: { vocab: number; grammar: number; reading: number; listening: number };
}) {
  const vocabCount = questions.filter((q) => q.section === "Vocabulary").length;
  const grammarCount = questions.filter((q) => q.section === "Grammar").length;
  const readingCount = questions.filter((q) => q.section === "Reading").length;
  const listeningCount = questions.filter((q) => q.section === "Listening").length;

  const stats = [
    { label: "Total", value: questions.length, color: "bg-primary/10 text-primary", icon: BarChart3 },
    { label: "Vocabulary", value: vocabCount, color: SECTION_COLORS.vocabulary.bg + " " + SECTION_COLORS.vocabulary.text, icon: BookOpen },
    { label: "Grammar", value: grammarCount, color: SECTION_COLORS.grammar.bg + " " + SECTION_COLORS.grammar.text, icon: GraduationCap },
    { label: "Reading", value: readingCount, color: SECTION_COLORS.reading.bg + " " + SECTION_COLORS.reading.text, icon: FileText },
    { label: "Listening", value: listeningCount, color: SECTION_COLORS.listening.bg + " " + SECTION_COLORS.listening.text, icon: Headphones },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-base p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-black text-primary-col">{stat.value}</p>
              <p className="text-xs text-muted-col">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Info Bar */}
      <div className="card-base p-4">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-col" />
            <span className="text-secondary-col">Duration:</span>
            <span className="font-bold text-primary-col">{exam.duration} min</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary-col">Status:</span>
            <StatusBadge status={exam.status} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary-col">Last updated:</span>
            <span className="text-muted-col">{new Date(exam.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
function EditExamPage() {
  const { level, examId } = Route.useParams();
  const navigate = useNavigate();
  const upperLevel = level.toUpperCase() as JLPTLevelUpper;

  const [exam, setExam] = useState<JLPTExam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [examName, setExamName] = useState("");
  const [status, setStatus] = useState<ExamStatus>("Draft");
  const [duration, setDuration] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("total");

  // Modal states
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingSection, setEditingSection] = useState<"Vocabulary" | "Grammar" | "Reading" | "Listening">("Vocabulary");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);

  const structure = JLPT_STRUCTURE[upperLevel] || JLPT_STRUCTURE.N5;

  useEffect(() => {
    setLoading(true);
    const foundExam = getExamById(examId);
    if (foundExam && foundExam.level === upperLevel) {
      setExam(foundExam);
      setExamName(foundExam.name);
      setStatus(foundExam.status);
      setDuration(foundExam.duration);
      setQuestions(getExamQuestions(foundExam));
    }
    setLoading(false);
  }, [examId, upperLevel]);

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
      const updatedExam: JLPTExam = {
        ...exam,
        name: examName,
        status,
        vocabularyQuestions: questions.filter((q) => q.section === "Vocabulary").length,
        grammarQuestions: questions.filter((q) => q.section === "Grammar").length,
        readingQuestions: questions.filter((q) => q.section === "Reading").length,
        listeningQuestions: questions.filter((q) => q.section === "Listening").length,
        duration,
      };

      updateExam(updatedExam);
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
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm text-muted-col">Loading exam...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-16 h-16 text-[var(--status-rejected)]/50 mb-4" />
        <h2 className="text-xl font-bold text-primary-col mb-2">Exam Not Found</h2>
        <Link to="/admin/jlpt-exam/$level" params={{ level }} className="px-4 py-2 rounded-xl bg-primary/12 text-primary text-sm font-bold hover:bg-primary/20 transition">
          Back to Exam List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/admin/jlpt-exam" className="text-muted-col hover:text-primary transition">JLPT Exam</Link>
        <ChevronRight className="w-4 h-4 text-muted-col" />
        <span className="text-primary-col font-medium">JLPT {upperLevel}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-black text-primary-col">Exam Editor</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
            upperLevel === "N5" ? "bg-[oklch(0.62_0.18_270)]/12 text-[oklch(0.62_0.18_270)] border-[oklch(0.62_0.18_270)]/20" :
            upperLevel === "N4" ? "bg-[oklch(0.72_0.15_230)]/12 text-[oklch(0.72_0.15_230)] border-[oklch(0.72_0.15_230)]/20" :
            "bg-[var(--accent)] text-muted-col border-[var(--border)]"
          }`}>
            {upperLevel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: "/admin/jlpt-exam/$level", params: { level } })}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-secondary-col text-sm font-bold hover:bg-[var(--border)] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Exam Settings Card */}
      <ExamSettingsCard
        examName={examName}
        setExamName={setExamName}
        duration={duration}
        setDuration={setDuration}
        status={status}
        setStatus={setStatus}
      />

      {/* Success/Error Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50 px-5 py-3 rounded-xl bg-[var(--status-active)] text-white shadow-lg flex items-center gap-2 font-medium"
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
            className="px-4 py-3 rounded-xl bg-[var(--status-rejected)]/10 text-[var(--status-rejected)] text-sm font-medium flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="card-base p-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary/12 text-primary"
                  : "text-muted-col hover:text-primary-col hover:bg-[var(--accent)]"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? "bg-primary/20 text-primary" : "bg-[var(--accent)] text-muted-col"
              }`}>
                {tabCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "total" && (
          <TotalContent exam={exam} questions={questions} structure={structure} />
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
          <div className="space-y-4">
            <ListeningAudioManager questions={questions} onUpdate={setQuestions} />
            <SectionContent
              section="Listening"
              questions={questions}
              required={structure.listening}
              onAdd={handleAddQuestion}
              onEdit={handleEditQuestion}
              onDelete={handleDeleteClick}
            />
          </div>
        )}
      </div>

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
            <AlertDialogCancel onClick={() => setDeletingQuestionId(null)}>Cancel</AlertDialogCancel>
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
