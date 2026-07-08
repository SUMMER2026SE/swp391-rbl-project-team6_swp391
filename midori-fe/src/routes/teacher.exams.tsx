import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  examsApi,
  mapExamUiStatus,
  type ExamResponse,
  type ExamQuestionResponse as ApiQuestion,
} from "@/lib/api/exams";
import { teacherQuestionsApi } from "@/lib/api/teacherQuestions";
import { classesApi } from "@/lib/api/classes";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Clock,
  BarChart2,
  CheckCircle,
  X,
  ClipboardCheck,
  Users,
  AlertCircle,
  Star,
  Settings,
  ChevronRight,
  Upload,
  FileText,
  Sparkles,
  Wand2,
  Check,
  PlusCircle,
  GripVertical,
  CheckCheck,
  FileUp,
  Brain,
  ListChecks,
  BookOpen,
  GraduationCap,
  Headphones,
  ChevronLeft,
  ChevronUp,
  Circle,
  ChevronDown,
  Loader2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type QuestionType = "vocabulary" | "grammar" | "reading" | "listening" | "multiple-choice";
type Difficulty = "easy" | "medium" | "hard";
type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type ExamStatus = "draft" | "published" | "pending";
type ExamType = "Grammar" | "Vocabulary" | "Listening" | "Mixed";

interface ManualQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  score: number;
}

interface ManualExam {
  id: string;
  title: string;
  level: JLPTLevel;
  examType: ExamType;
  time: number;
  status: ExamStatus;
  questions: ManualQuestion[];
  totalQuestions: number;
  date: string;
}

interface GeneratedQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer?: number | string;
  explanation?: string;
  difficulty: Difficulty;
  jlptLevel: JLPTLevel;
}

// Sample AI generated questions (for PDF Generator — DO NOT MODIFY)
const sampleGeneratedQuestions: GeneratedQuestion[] = [
  {
    id: "gen_q1",
    type: "vocabulary",
    question: "Kankyou no imi wo machiga te imasu.",
    options: ["shizen", "shuui / surroundings environment", "keizai", "bunka"],
    correctAnswer: 1,
    explanation: "Kankyou means environment/surroundings. Kankyou mondai wa environmental issues.",
    difficulty: "medium",
    jlptLevel: "N3",
  },
  {
    id: "gen_q2",
    type: "grammar",
    question: "Nagara no imi wo sagashite imasu.",
    options: ["while", "during", "even though / although", "because"],
    correctAnswer: 2,
    explanation: "Nagara expresses even though/although - similar to noni but more formal.",
    difficulty: "medium",
    jlptLevel: "N3",
  },
  {
    id: "gen_q3",
    type: "multiple-choice",
    question:
      "Seikaku na keigo wo erande kudasai: Michi wo ___ toki, kyoukan ga abunai to koe wo kakemashita.",
    options: ["aruki nagara", "aruite ita", "aruite ita toki", "aruki nagara datta"],
    correctAnswer: 2,
    explanation: "Aruite ita toki is the correct form - past progressive + temporal marker.",
    difficulty: "hard",
    jlptLevel: "N2",
  },
  {
    id: "gen_q4",
    type: "reading",
    question:
      "Kono bunsyou no naiyou to icchi suru mono wo erande kudasai: Kono kaisha dewa, kankyou e no hairyo wo juuyou to site imasu. Risairukuru katsudou ni mo sekkyoku teki ni sankashite imasu.",
    options: [
      "Kono kaisha wa keizai rieki dake wo juuyou site imasu",
      "Kono kaisha wa kankyou mondai ni ki ni natte imasen",
      "Kono kaisha wa kankyou e no hairyo to risairukuru katsudou wo taisetu ni site imasu",
      "Kono kaisha no risairukuru katsudou e no sanka wa ninji de aru",
    ],
    correctAnswer: 2,
    explanation:
      "Bunsyou dewa kankyou e no hairyo wo juuyou to iimasu, risairukuru katsudou ni sekkyoku sanka to arimasu.",
    difficulty: "medium",
    jlptLevel: "N3",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];
const EXAM_TYPES: ExamType[] = ["Grammar", "Vocabulary", "Listening", "Mixed"];
const PAGE_SIZE = 5;

function QuestionTypeIcon({ type }: { type: QuestionType }) {
  const config: Record<QuestionType, { icon: React.ElementType; color: string }> = {
    vocabulary: { icon: BookOpen, color: "bg-blue-50 text-blue-500" },
    grammar: { icon: GraduationCap, color: "bg-purple-50 text-purple-500" },
    reading: { icon: FileText, color: "bg-green-50 text-green-500" },
    listening: { icon: Headphones, color: "bg-orange-50 text-orange-500" },
    "multiple-choice": { icon: ListChecks, color: "bg-pink-50 text-pink-500" },
  };
  const { icon: Icon, color } = config[type];
  return (
    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-3.5 h-3.5" />
    </div>
  );
}

function JLPTBadge({ level }: { level: JLPTLevel }) {
  const colors: Record<JLPTLevel, string> = {
    N5: "bg-blue-50 text-blue-500",
    N4: "bg-green-50 text-green-500",
    N3: "bg-yellow-50 text-yellow-600",
    N2: "bg-orange-50 text-orange-500",
    N1: "bg-red-50 text-red-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[level]}`}>
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: ExamStatus }) {
  const config: Record<ExamStatus, { label: string; color: string }> = {
    published: { label: "Published", color: "bg-green-50 text-green-600 dark:bg-green-950/30" },
    pending: { label: "Pending", color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30" },
    draft: { label: "Draft", color: "bg-slate-100 text-slate-500 dark:bg-slate-700" },
  };
  const { label, color } = config[status];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>{label}</span>;
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const colors: Record<Difficulty, string> = {
    easy: "bg-green-50 text-green-600",
    medium: "bg-yellow-50 text-yellow-600",
    hard: "bg-red-50 text-red-500",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${colors[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}

function createEmptyQuestion(jlptLevel: JLPTLevel = "N3"): ManualQuestion {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    score: 5,
  };
}

function mapApiQuestionsToManual(questions?: ApiQuestion[]): ManualQuestion[] {
  if (!questions || questions.length === 0) return [];
  return questions
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((q): ManualQuestion => ({
      id: q.id,
      question: q.prompt,
      options: q.options && q.options.length > 0 ? q.options : ["", "", "", ""],
      correctAnswer: typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
      explanation: "",
      score: typeof q.points === "number" ? q.points : 5,
    }));
}

function mapApiExamToManual(api: ExamResponse): ManualExam {
  return {
    id: api.id,
    title: api.title,
    level: api.level as JLPTLevel,
    examType: (api.category || "Grammar") as ExamType,
    time: api.timeLimit,
    status: mapExamUiStatus(api.status),
    totalQuestions: api.totalQuestions,
    questions: mapApiQuestionsToManual(api.questions),
    date: api.createdAt ? new Date(api.createdAt).toLocaleDateString() : "—",
  };
}

function manualQuestionsToPayload(questions: ManualQuestion[]): {
  id?: string;
  prompt: string;
  options: string[];
  correctAnswerIndex: number;
  points: number;
  displayOrder: number;
}[] {
  return questions.map((q, idx) => {
    const isExistingUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q.id);
    return {
      ...(isExistingUuid ? { id: q.id } : {}),
      prompt: q.question,
      options: q.options.map((o) => o ?? ""),
      correctAnswerIndex: q.correctAnswer,
      points: q.score,
      displayOrder: idx + 1,
    };
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const Route = createFileRoute("/teacher/exams")({
  validateSearch: (search: Record<string, unknown>) => ({
    classId: typeof search.classId === "string" ? search.classId : undefined,
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const { user } = useAuth();
  const { classId } = Route.useSearch() as any;
  const queryClient = useQueryClient();

  const { data: dbExams = [], isLoading, refetch } = useQuery({
    queryKey: ["exams", classId || user?.id],
    queryFn: () => {
      if (classId) {
        return examsApi.getExamsByClass(classId);
      }
      return examsApi.getExamsByTeacher(user!.id);
    },
    enabled: !!classId || !!user?.id,
  });

  const { data: filteredClass } = useQuery({
    queryKey: ["teacherClassDetail", classId],
    queryFn: () => classesApi.getClassById(classId!),
    enabled: !!classId,
  });

  const exams = useMemo((): ManualExam[] => {
    return (dbExams as ExamResponse[]).map((e): ManualExam => ({
      id: e.id,
      title: e.title,
      level: e.level as JLPTLevel,
      examType: (e.category || "Grammar") as ExamType,
      time: e.timeLimit,
      status: mapExamUiStatus(e.status),
      totalQuestions: e.totalQuestions,
      questions: mapApiQuestionsToManual(e.questions),
      date: e.createdAt
        ? new Date(e.createdAt).toLocaleDateString()
        : "—",
    }));
  }, [dbExams]);

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // ── PDF Generator states (UNCHANGED — DO NOT MODIFY) ───────────────────────
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [examTitle, setExamTitle] = useState("");
  const [examLevel, setExamLevel] = useState<JLPTLevel>("N3");
  const [editingQuestion, setEditingQuestion] = useState<GeneratedQuestion | null>(null);
  const [editingDraft, setEditingDraft] = useState<GeneratedQuestion | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Manual Create state ───────────────────────────────────────────────────
  const [showManualCreate, setShowManualCreate] = useState(false);
  const [manualDraft, setManualDraft] = useState<Partial<ManualExam>>({
    title: "",
    level: "N3",
    examType: "Grammar",
    time: 45,
    status: "draft",
    questions: [],
  });
  const [editingManualQuestion, setEditingManualQuestion] = useState<ManualQuestion | null>(null);

  // ── View / Edit / Delete state ─────────────────────────────────────────────
  const [showViewExam, setShowViewExam] = useState<ManualExam | null>(null);
  const [showEditExam, setShowEditExam] = useState<ManualExam | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // ── Filtered + paginated exams ────────────────────────────────────────────
  const filteredExams = exams.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === "All" || e.level === levelFilter;
    return matchSearch && matchLevel;
  });

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedExams = filteredExams.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ── PDF Generator handlers (UNCHANGED — DO NOT MODIFY) ─────────────────────
  const simulateAnalysis = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    const stages = [
      "Extracting text from PDF...",
      "Identifying vocabulary terms...",
      "Analyzing grammar patterns...",
      "Generating reading comprehension...",
      "Creating multiple-choice questions...",
      "Applying JLPT difficulty levels...",
      "Finalizing question bank...",
    ];
    for (let i = 0; i < stages.length; i++) {
      setAnalysisStage(stages[i]);
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    }
    const questions = sampleGeneratedQuestions.map((q, idx) => ({
      ...q,
      id: `q_${Date.now()}_${idx}`,
      question:
        idx === 0
          ? `PDF "${file.name.replace(".pdf", "")}" based vocabulary questions.`
          : q.question,
    }));
    setGeneratedQuestions(questions);
    setSelectedQuestions(new Set(questions.map((q) => q.id)));
    setIsAnalyzing(false);
  }, []);

  const handleFileUpload = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".pdf")) {
        alert("Please upload a PDF file");
        return;
      }
      setUploadedFile(file);
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            simulateAnalysis(file);
            return 100;
          }
          return p + Math.random() * 15;
        });
      }, 200);
    },
    [simulateAnalysis],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleToggleQuestion = useCallback((id: string) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDeleteQuestion = useCallback((id: string) => {
    setGeneratedQuestions((prev) => prev.filter((q) => q.id !== id));
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleSaveQuestionEdit = useCallback(() => {
    if (!editingDraft) return;
    setGeneratedQuestions((prev) => prev.map((q) => (q.id === editingDraft.id ? editingDraft : q)));
    setEditingQuestion(null);
    setEditingDraft(null);
  }, [editingDraft]);

  const handlePublish = useCallback(() => {
    const finalQuestions = generatedQuestions.filter((q) => selectedQuestions.has(q.id));
    alert(`Exam "${examTitle}" published with ${finalQuestions.length} questions!`);
    setShowPDFGenerator(false);
    setUploadedFile(null);
    setGeneratedQuestions([]);
    setSelectedQuestions(new Set());
    setExamTitle("");
  }, [examTitle, generatedQuestions, selectedQuestions]);

  const handleSaveDraft = useCallback(() => {
    const finalQuestions = generatedQuestions.filter((q) => selectedQuestions.has(q.id));
    alert(`Draft saved with ${finalQuestions.length} questions!`);
  }, [examTitle, generatedQuestions, selectedQuestions]);

  // ── Manual Create handlers ────────────────────────────────────────────────
  const resetManualDraft = () => {
    setManualDraft({
      title: "",
      level: "N3",
      examType: "Grammar",
      time: 45,
      status: "draft",
      questions: [],
    });
    setEditingManualQuestion(null);
  };

  const handleOpenManualCreate = () => {
    resetManualDraft();
    setShowManualCreate(true);
  };

  const handleAddQuestionToManual = () => {
    const newQ = createEmptyQuestion(manualDraft.level);
    setManualDraft((prev) => ({ ...prev, questions: [...(prev.questions || []), newQ] }));
    setEditingManualQuestion(newQ);
  };

  const handleUpdateManualQuestion = (updated: ManualQuestion) => {
    setManualDraft((prev) => ({
      ...prev,
      questions: prev.questions?.map((q) => (q.id === updated.id ? updated : q)) || [],
    }));
    setEditingManualQuestion(updated);
  };

  const handleDeleteManualQuestion = (id: string) => {
    setManualDraft((prev) => ({
      ...prev,
      questions: prev.questions?.filter((q) => q.id !== id) || [],
    }));
    if (editingManualQuestion?.id === id) setEditingManualQuestion(null);
  };

  const handleSaveManualExam = async (status: ExamStatus = "draft") => {
    if (!manualDraft.title?.trim()) {
      toast.error("Please enter an exam title.");
      return;
    }
    const draftQuestions = manualDraft.questions || [];
    if (draftQuestions.length === 0) {
      toast.error("Please add at least one question.");
      return;
    }
    for (let i = 0; i < draftQuestions.length; i++) {
      const q = draftQuestions[i];
      if (!q.question?.trim()) {
        toast.error(`Question ${i + 1} has an empty question prompt.`);
        return;
      }
      if (!q.options || q.options.length < 2) {
        toast.error(`Question ${i + 1} must have at least 2 options.`);
        return;
      }
      if (q.options.some((opt) => !opt?.trim())) {
        toast.error(`Please fill out all options for Question ${i + 1}.`);
        return;
      }
    }
    try {
      const savedQuestionIds: string[] = [];
      const draftQuestions = manualDraft.questions || [];
      for (const q of draftQuestions) {
        const res = await teacherQuestionsApi.createQuestion({
          prompt: q.question,
          options: q.options,
          correctAnswerIndex: q.correctAnswer,
          points: q.score,
          questionType: "MULTIPLE_CHOICE",
          difficulty: "MEDIUM",
          explanation: q.explanation || "Exam manual question",
        });
        savedQuestionIds.push(res.id);
      }

      await examsApi.createExam({
        title: manualDraft.title,
        level: manualDraft.level || "N3",
        totalQuestions: draftQuestions.length,
        timeLimit: manualDraft.time || 45,
        classIds: classId ? [classId] : [],
        questionIds: savedQuestionIds,
        status: status === "published" ? "PUBLISHED" : "DRAFT",
      });

      toast.success(status === "published" ? "Exam published & assigned!" : "Draft saved!");
      refetch();
      setShowManualCreate(false);
      resetManualDraft();
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save exam.");
    }
  };

  // ── View / Edit / Delete handlers ─────────────────────────────────────────
  const handleViewExam = (exam: ManualExam) => setShowViewExam(exam);
  const handleCloseView = () => setShowViewExam(null);

  const handleOpenEdit = async (exam: ManualExam) => {
    try {
      const fresh = await examsApi.getExamById(exam.id);
      setShowEditExam(mapApiExamToManual(fresh));
    } catch (err: any) {
      // Fallback to whatever is in the list (questions may already be cached there now).
      setShowEditExam({ ...exam, questions: [...exam.questions] });
      toast.warning(
        err?.message ||
          "Could not fetch the latest exam detail; showing local copy.",
      );
    }
  };

  const handleSaveEdit = async () => {
    if (!showEditExam) return;
    try {
      await examsApi.updateExam(showEditExam.id, {
        title: showEditExam.title,
        level: showEditExam.level,
        timeLimit: showEditExam.time,
        totalQuestions: showEditExam.questions.length,
        status: showEditExam.status === "published" ? "PUBLISHED" : "DRAFT",
      });
      await examsApi.updateExamQuestions(showEditExam.id, {
        questions: manualQuestionsToPayload(showEditExam.questions),
      });
      toast.success("Exam updated successfully!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["exams"] }),
        queryClient.invalidateQueries({ queryKey: ["exam", showEditExam.id] }),
      ]);
      await refetch();
      setShowEditExam(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save exam changes.");
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await examsApi.deleteExam(id);
      toast.success("Exam deleted successfully!");
      refetch();
      setShowDeleteConfirm(null);
      setCurrentPage(1);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete exam.");
    }
  };

  const handlePublishExam = async (id: string) => {
    try {
      await examsApi.publishExam(id);
      toast.success("Exam published successfully!");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish exam.");
    }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };
  const handleLevelFilter = (val: string) => {
    setLevelFilter(val);
    setCurrentPage(1);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-black">Exam Builder</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {classId && filteredClass
              ? `Showing exams for ${filteredClass.name}`
              : "Create JLPT exams with AI-powered PDF analysis"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPDFGenerator(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow-lg hover:opacity-90 transition"
          >
            <Wand2 className="w-4 h-4" />
            AI PDF Generator
          </button>
          <button
            onClick={handleOpenManualCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            Manual Create
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Exams",
            value: String(exams.length),
            icon: ClipboardCheck,
            color: "bg-blue-50 text-blue-500",
          },
          {
            label: "Published",
            value: String(exams.filter((e) => e.status === "published").length),
            icon: CheckCircle,
            color: "bg-green-50 text-green-500",
          },
          {
            label: "Drafts",
            value: String(exams.filter((e) => e.status === "draft").length),
            icon: Settings,
            color: "bg-orange-50 text-orange-500",
          },
          {
            label: "Pending",
            value: String(exams.filter((e) => e.status === "pending").length),
            icon: AlertCircle,
            color: "bg-purple-50 text-purple-500",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-black text-xl">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-64 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search exams..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
          {["All", "N5", "N4", "N3", "N2", "N1"].map((l) => (
            <button
              key={l}
              onClick={() => handleLevelFilter(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${levelFilter === l ? "bg-gradient-hero text-white shadow" : "text-muted-foreground hover:bg-muted"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Exam cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading exams…
            </div>
          </div>
        ) : paginatedExams.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">
              {exams.length === 0 ? "No exams yet" : "No exams found"}
            </p>
            <p className="text-sm">
              {exams.length === 0
                ? "Create your first exam using Manual Create or AI PDF Generator."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          paginatedExams.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    exam.status === "published"
                      ? "bg-green-50 dark:bg-green-950/30"
                      : exam.status === "pending"
                        ? "bg-yellow-50 dark:bg-yellow-950/30"
                        : "bg-slate-100 dark:bg-slate-700"
                  }`}
                >
                  <ClipboardCheck
                    className={`w-6 h-6 ${
                      exam.status === "published"
                        ? "text-green-500"
                        : exam.status === "pending"
                          ? "text-yellow-500"
                          : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-base">{exam.title}</span>
                    <JLPTBadge level={exam.level} />
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-muted-foreground">
                      {exam.examType}
                    </span>
                    <StatusBadge status={exam.status} />
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="w-3 h-3" /> {exam.totalQuestions} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {exam.time} min
                    </span>
                    <span>{exam.date}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpenEdit(exam)}
                    className="p-2 rounded-xl hover:bg-blue-50 text-blue-500 transition"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(exam.id)}
                    className="p-2 rounded-xl hover:bg-red-50 text-red-400 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewExam(exam)}
                    className="p-2 rounded-xl hover:bg-muted transition"
                    title="View"
                  >
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {exam.status !== "published" && (
                    <button
                      onClick={() => handlePublishExam(exam.id)}
                      className="p-2 rounded-xl hover:bg-green-50 text-green-500 transition"
                      title="Publish"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min((safePage - 1) * PAGE_SIZE + 1, filteredExams.length)}–
            {Math.min(safePage * PAGE_SIZE, filteredExams.length)} of {filteredExams.length} exams
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2 rounded-xl hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition ${p === safePage ? "bg-gradient-hero text-white shadow" : "hover:bg-muted"}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2 rounded-xl hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* AI PDF GENERATOR MODAL */}
      <AnimatePresence>
        {showPDFGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isAnalyzing && setShowPDFGenerator(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg">AI PDF Exam Generator</h2>
                    <p className="text-xs text-muted-foreground">
                      Upload a PDF and let AI create exam questions
                    </p>
                  </div>
                </div>
                {!isAnalyzing && (
                  <button
                    onClick={() => setShowPDFGenerator(false)}
                    className="p-2 rounded-xl hover:bg-muted transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {!uploadedFile && !isAnalyzing && (
                  <div className="space-y-4">
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/5"
                      }`}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <FileUp className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2">Drop your PDF here</h3>
                      <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold">
                        <Upload className="w-4 h-4" />
                        Choose File
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-3">
                        Supports PDF files up to 10MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f);
                        }}
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold mb-3">Or start with a template:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "JLPT N5", desc: "Basic vocabulary", level: "N5" as JLPTLevel },
                          { label: "JLPT N4", desc: "Everyday Japanese", level: "N4" as JLPTLevel },
                          { label: "JLPT N3", desc: "Intermediate", level: "N3" as JLPTLevel },
                          {
                            label: "JLPT N2",
                            desc: "Upper-intermediate",
                            level: "N2" as JLPTLevel,
                          },
                        ].map((t) => (
                          <button
                            key={t.label}
                            onClick={() => {
                              setExamLevel(t.level);
                              setUploadedFile({
                                name: `${t.label}_template.pdf`,
                              } as unknown as File);
                              setUploadProgress(100);
                              setTimeout(
                                () =>
                                  simulateAnalysis({
                                    name: `${t.label}_template.pdf`,
                                  } as unknown as File),
                                500,
                              );
                            }}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition text-left"
                          >
                            <div className="text-sm font-bold">{t.label}</div>
                            <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {uploadedFile && uploadProgress < 100 && !isAnalyzing && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <FileUp className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2">
                      Uploading {uploadedFile.name}
                    </h3>
                    <div className="w-full max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden mt-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-gradient-hero rounded-full"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {Math.round(uploadProgress)}% uploaded
                    </p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="text-center py-12">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-xl mb-2">
                      AI is analyzing your PDF
                    </h3>
                    <p className="text-muted-foreground mb-6">{analysisStage}</p>
                    <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                        Extracting
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                        Analyzing
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Generating
                      </div>
                    </div>
                  </div>
                )}

                {generatedQuestions.length > 0 && !isAnalyzing && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                          Exam Title
                        </label>
                        <input
                          value={examTitle}
                          onChange={(e) => setExamTitle(e.target.value)}
                          placeholder="e.g. JLPT N3 Reading Comprehension"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                          JLPT Level
                        </label>
                        <select
                          value={examLevel}
                          onChange={(e) => setExamLevel(e.target.value as JLPTLevel)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                        >
                          {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Selected: </span>
                          <span className="font-bold text-primary">{selectedQuestions.size}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            / {generatedQuestions.length} questions
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold">Generated Questions</h4>
                      <button
                        onClick={() =>
                          setSelectedQuestions((prev) =>
                            prev.size === generatedQuestions.length
                              ? new Set()
                              : new Set(generatedQuestions.map((q) => q.id)),
                          )
                        }
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        {selectedQuestions.size === generatedQuestions.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {generatedQuestions.map((q, i) => (
                        <div key={q.id} className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.has(q.id)}
                            onChange={() => handleToggleQuestion(q.id)}
                            className="mt-3 w-4 h-4 rounded accent-primary flex-shrink-0"
                          />
                          <div className="flex-1">
                            <GenQuestionCard
                              q={q}
                              index={i}
                              onEdit={(edited) => {
                                setEditingDraft(edited);
                                setEditingQuestion(q);
                              }}
                              onDelete={handleDeleteQuestion}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        const newQ: GeneratedQuestion = {
                          id: `custom_${Date.now()}`,
                          type: "multiple-choice",
                          question: "New question",
                          options: ["Option A", "Option B", "Option C", "Option D"],
                          correctAnswer: 0,
                          difficulty: "medium",
                          jlptLevel: examLevel,
                        };
                        setGeneratedQuestions((prev) => [...prev, newQ]);
                        setSelectedQuestions((prev) => new Set([...prev, newQ.id]));
                      }}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm text-muted-foreground hover:border-primary hover:text-primary transition flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add Custom Question
                    </button>
                  </div>
                )}
              </div>

              {generatedQuestions.length > 0 && !isAnalyzing && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-muted/20">
                  <button
                    onClick={() => {
                      setShowPDFGenerator(false);
                      setUploadedFile(null);
                      setGeneratedQuestions([]);
                      setSelectedQuestions(new Set());
                      setExamTitle("");
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDraft}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-muted transition"
                    >
                      Save Draft
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={!examTitle.trim() || selectedQuestions.size === 0}
                      className="px-5 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Publish Exam
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Question Modal */}
      <AnimatePresence>
        {editingQuestion && editingDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={() => {
              setEditingQuestion(null);
              setEditingDraft(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold">Edit Question</h3>
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setEditingDraft(null);
                  }}
                  className="p-2 rounded-xl hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Question
                  </label>
                  <textarea
                    value={editingDraft.question}
                    onChange={(e) =>
                      setEditingDraft((prev) =>
                        prev ? { ...prev, question: e.target.value } : null,
                      )
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Type
                    </label>
                    <select
                      value={editingDraft.type}
                      onChange={(e) =>
                        setEditingDraft((prev) =>
                          prev ? { ...prev, type: e.target.value as QuestionType } : null,
                        )
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none"
                    >
                      <option value="vocabulary">Vocabulary</option>
                      <option value="grammar">Grammar</option>
                      <option value="reading">Reading</option>
                      <option value="listening">Listening</option>
                      <option value="multiple-choice">Multiple Choice</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      JLPT Level
                    </label>
                    <select
                      value={editingDraft.jlptLevel}
                      onChange={(e) =>
                        setEditingDraft((prev) =>
                          prev ? { ...prev, jlptLevel: e.target.value as JLPTLevel } : null,
                        )
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none"
                    >
                      {["N5", "N4", "N3", "N2", "N1"].map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Difficulty
                    </label>
                    <select
                      value={editingDraft.difficulty}
                      onChange={(e) =>
                        setEditingDraft((prev) =>
                          prev ? { ...prev, difficulty: e.target.value as Difficulty } : null,
                        )
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Correct Answer
                    </label>
                    <select
                      value={editingDraft.correctAnswer ?? 0}
                      onChange={(e) =>
                        setEditingDraft((prev) =>
                          prev ? { ...prev, correctAnswer: parseInt(e.target.value) } : null,
                        )
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none"
                    >
                      {editingDraft.options?.map((_, i) => (
                        <option key={i} value={i}>
                          {String.fromCharCode(65 + i)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {editingDraft.options && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {editingDraft.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-5">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          <input
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(editingDraft.options || [])];
                              newOpts[i] = e.target.value;
                              setEditingDraft((prev) =>
                                prev ? { ...prev, options: newOpts } : null,
                              );
                            }}
                            className="flex-1 px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Explanation
                  </label>
                  <textarea
                    value={editingDraft.explanation || ""}
                    onChange={(e) =>
                      setEditingDraft((prev) =>
                        prev ? { ...prev, explanation: e.target.value } : null,
                      )
                    }
                    rows={2}
                    placeholder="Explain why this answer is correct..."
                    className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setEditingQuestion(null);
                      setEditingDraft(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-muted text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveQuestionEdit}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MANUAL CREATE MODAL */}
      <AnimatePresence>
        {showManualCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowManualCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg">Manual Create Exam</h2>
                    <p className="text-xs text-muted-foreground">
                      Create exam with custom questions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManualCreate(false)}
                  className="p-2 rounded-xl hover:bg-muted transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Exam Information
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                      Exam Title
                    </label>
                    <input
                      value={manualDraft.title || ""}
                      onChange={(e) =>
                        setManualDraft((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="e.g. JLPT N3 Grammar Final"
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                        JLPT Level
                      </label>
                      <select
                        value={manualDraft.level || "N3"}
                        onChange={(e) =>
                          setManualDraft((prev) => ({
                            ...prev,
                            level: e.target.value as JLPTLevel,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                      >
                        {JLPT_LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                        Exam Type
                      </label>
                      <select
                        value={manualDraft.examType || "Grammar"}
                        onChange={(e) =>
                          setManualDraft((prev) => ({
                            ...prev,
                            examType: e.target.value as ExamType,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                      >
                        {EXAM_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                        Time (min)
                      </label>
                      <input
                        type="number"
                        value={manualDraft.time || 45}
                        onChange={(e) =>
                          setManualDraft((prev) => ({
                            ...prev,
                            time: parseInt(e.target.value) || 45,
                          }))
                        }
                        min={5}
                        max={300}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                        Status
                      </label>
                      <select
                        value={manualDraft.status || "draft"}
                        onChange={(e) =>
                          setManualDraft((prev) => ({
                            ...prev,
                            status: e.target.value as ExamStatus,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      Questions ({manualDraft.questions?.length || 0})
                    </h3>
                    <button
                      onClick={handleAddQuestionToManual}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-hero text-white text-xs font-bold hover:opacity-90 transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Add Question
                    </button>
                  </div>

                  {manualDraft.questions && manualDraft.questions.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {manualDraft.questions.map((q, idx) => (
                        <ManualQuestionItem
                          key={q.id}
                          q={q}
                          index={idx}
                          isEditing={editingManualQuestion?.id === q.id}
                          onEdit={() => setEditingManualQuestion(q)}
                          onDelete={() => handleDeleteManualQuestion(q.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      <PlusCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-muted-foreground">No questions yet</p>
                      <p className="text-xs text-muted-foreground">
                        Click "Add Question" to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-muted/20">
                <button
                  onClick={() => setShowManualCreate(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-muted transition"
                >
                  Cancel
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveManualExam("draft")}
                    disabled={!manualDraft.title?.trim()}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-muted transition disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={() => handleSaveManualExam("published")}
                    disabled={!manualDraft.title?.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Publish Exam
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Question Editor Modal */}
      <AnimatePresence>
        {editingManualQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setEditingManualQuestion(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold">Edit Question</h3>
                <button
                  onClick={() => setEditingManualQuestion(null)}
                  className="p-2 rounded-xl hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ManualQuestionForm
                question={editingManualQuestion}
                onUpdate={handleUpdateManualQuestion}
                onCancel={() => setEditingManualQuestion(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW EXAM MODAL */}
      <AnimatePresence>
        {showViewExam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCloseView}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg">{showViewExam.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <JLPTBadge level={showViewExam.level} />
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-muted-foreground">
                        {showViewExam.examType}
                      </span>
                      <StatusBadge status={showViewExam.status} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCloseView}
                  className="p-2 rounded-xl hover:bg-muted transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <div className="font-display font-black text-xl">
                      {showViewExam.totalQuestions}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Questions</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <div className="font-display font-black text-xl">{showViewExam.time}m</div>
                    <div className="text-[10px] text-muted-foreground">Duration</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/50">
                    <div className="font-display font-black text-xl">
                      {showViewExam.questions.reduce((s, q) => s + (q.score || 0), 0)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Total Score</div>
                  </div>
                </div>

                {showViewExam.questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">
                      Question details are not loaded. This exam has {showViewExam.totalQuestions}{" "}
                      question(s).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {showViewExam.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">Q{idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-3">
                              {q.question || (
                                <span className="italic text-muted-foreground">
                                  No question text
                                </span>
                              )}
                            </p>
                            <div className="space-y-1.5">
                              {q.options.map((opt, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${q.correctAnswer === i ? "bg-green-50 text-green-600 dark:bg-green-950/30" : "bg-muted/50"}`}
                                >
                                  <span className="font-bold w-5">
                                    {String.fromCharCode(65 + i)}.
                                  </span>
                                  <span className="flex-1">
                                    {opt || (
                                      <span className="italic text-muted-foreground">Empty</span>
                                    )}
                                  </span>
                                  {q.correctAnswer === i && (
                                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                                  )}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <p className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                                <span className="font-bold">Explanation: </span>
                                {q.explanation}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-500">
                                Score: {q.score}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-muted/20">
                <button
                  onClick={handleCloseView}
                  className="w-full py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT EXAM MODAL */}
      <AnimatePresence>
        {showEditExam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowEditExam(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg">Edit Exam</h2>
                    <p className="text-xs text-muted-foreground">
                      Update exam details and questions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditExam(null)}
                  className="p-2 rounded-xl hover:bg-muted transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Exam Information
                  </h3>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                      Exam Title
                    </label>
                    <input
                      value={showEditExam.title}
                      onChange={(e) =>
                        setShowEditExam((prev) =>
                          prev ? { ...prev, title: e.target.value } : null,
                        )
                      }
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                        JLPT Level
                      </label>
                      <select
                        value={showEditExam.level}
                        onChange={(e) =>
                          setShowEditExam((prev) =>
                            prev ? { ...prev, level: e.target.value as JLPTLevel } : null,
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                      >
                        {JLPT_LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                        Exam Type
                      </label>
                      <select
                        value={showEditExam.examType}
                        onChange={(e) =>
                          setShowEditExam((prev) =>
                            prev ? { ...prev, examType: e.target.value as ExamType } : null,
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                      >
                        {EXAM_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                        Time (min)
                      </label>
                      <input
                        type="number"
                        value={showEditExam.time}
                        onChange={(e) =>
                          setShowEditExam((prev) =>
                            prev ? { ...prev, time: parseInt(e.target.value) || 45 } : null,
                          )
                        }
                        min={5}
                        max={300}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                        Status
                      </label>
                      <select
                        value={showEditExam.status}
                        onChange={(e) =>
                          setShowEditExam((prev) =>
                            prev ? { ...prev, status: e.target.value as ExamStatus } : null,
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      Questions ({showEditExam.questions.length})
                    </h3>
                    <button
                      onClick={() => {
                        const newQ = createEmptyQuestion(showEditExam.level);
                        setShowEditExam((prev) =>
                          prev ? { ...prev, questions: [...prev.questions, newQ] } : null,
                        );
                        setEditingManualQuestion(newQ);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-hero text-white text-xs font-bold hover:opacity-90 transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Add Question
                    </button>
                  </div>

                  {showEditExam.questions.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {showEditExam.questions.map((q, idx) => (
                        <EditQuestionItem
                          key={q.id}
                          q={q}
                          index={idx}
                          onDelete={() =>
                            setShowEditExam((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    questions: prev.questions.filter((x) => x.id !== q.id),
                                  }
                                : null,
                            )
                          }
                          onUpdate={(updated) =>
                            setShowEditExam((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    questions: prev.questions.map((x) =>
                                      x.id === updated.id ? updated : x,
                                    ),
                                  }
                                : null,
                            )
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                      <PlusCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm text-muted-foreground">No questions yet</p>
                      <p className="text-xs text-muted-foreground">
                        Click "Add Question" to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-muted/20">
                <button
                  onClick={() => setShowEditExam(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold hover:bg-muted transition"
                >
                  Cancel
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setShowEditExam((prev) =>
                        prev ? { ...prev, status: "draft" as ExamStatus } : null,
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-muted transition"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-5 py-2 rounded-xl bg-gradient-hero text-white text-sm font-bold shadow hover:opacity-90 transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Question Form Modal (for Edit Exam) */}
      <AnimatePresence>
        {editingManualQuestion && showEditExam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setEditingManualQuestion(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold">Edit Question</h3>
                <button
                  onClick={() => setEditingManualQuestion(null)}
                  className="p-2 rounded-xl hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ManualQuestionForm
                question={editingManualQuestion}
                onUpdate={(updated) => {
                  setShowEditExam((prev) =>
                    prev
                      ? {
                          ...prev,
                          questions: prev.questions.map((q) => (q.id === updated.id ? updated : q)),
                        }
                      : null,
                  );
                  setEditingManualQuestion(null);
                }}
                onCancel={() => setEditingManualQuestion(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Delete Exam?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                This action cannot be undone. All questions and data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteExam(showDeleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function GenQuestionCard({
  q,
  index,
  onEdit,
  onDelete,
}: {
  q: GeneratedQuestion;
  index: number;
  onEdit: (q: GeneratedQuestion) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="mt-1">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-muted-foreground">Q{index + 1}</span>
            <QuestionTypeIcon type={q.type} />
            <JLPTBadge level={q.jlptLevel} />
            <DifficultyBadge difficulty={q.difficulty} />
          </div>
          <p className="text-sm font-medium">{q.question}</p>
          {q.options && (
            <div className="mt-2 space-y-1">
              {q.options.map((opt, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${q.correctAnswer === i ? "bg-green-50 text-green-600 dark:bg-green-950/30" : "bg-muted/50"}`}
                >
                  <span className="font-bold w-5">{String.fromCharCode(65 + i)}.</span>
                  <span>{opt}</span>
                  {q.correctAnswer === i && <Check className="w-3.5 h-3.5 ml-auto" />}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(q)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(q.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-muted transition"
          >
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-muted/20"
          >
            <p className="text-xs text-muted-foreground">
              <span className="font-bold">Explanation: </span>
              {q.explanation || "No explanation provided."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ManualQuestionItem({
  q,
  index,
  isEditing,
  onEdit,
  onDelete,
}: {
  q: ManualQuestion;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <div className="flex items-start gap-3 p-4">
        <div className="mt-1">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-muted-foreground">Q{index + 1}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-500">
              Manual
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-muted-foreground">
              Score: {q.score}
            </span>
          </div>
          <p className="text-sm font-medium">
            {q.question || <span className="italic text-muted-foreground">No question text</span>}
          </p>
          {q.options.filter((o) => o.trim()).length > 0 && (
            <div className="mt-2 space-y-1">
              {q.options.map((opt, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${q.correctAnswer === i ? "bg-green-50 text-green-600 dark:bg-green-950/30" : "bg-muted/50"}`}
                >
                  <span className="font-bold w-5">{String.fromCharCode(65 + i)}.</span>
                  <span className="flex-1">
                    {opt || <span className="italic text-muted-foreground">Empty</span>}
                  </span>
                  {q.correctAnswer === i && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-muted transition"
          >
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 bg-muted/20"
          >
            <p className="text-xs text-muted-foreground">
              <span className="font-bold">Explanation: </span>
              {q.explanation || "No explanation provided."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EditQuestionItem({
  q,
  index,
  onDelete,
  onUpdate,
}: {
  q: ManualQuestion;
  index: number;
  onDelete: () => void;
  onUpdate: (q: ManualQuestion) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [localQ, setLocalQ] = useState(q);

  const update = (field: keyof ManualQuestion, value: unknown) => {
    const updated = { ...localQ, [field]: value };
    setLocalQ(updated);
    onUpdate(updated);
  };

  const updateOption = (i: number, val: string) => {
    const opts = [...localQ.options];
    opts[i] = val;
    update("options", opts);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">Q{index + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {localQ.question || (
                <span className="italic text-muted-foreground">No question text</span>
              )}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3"
          >
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Question Text
              </label>
              <textarea
                value={localQ.question}
                onChange={(e) => update("question", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Answer Options
              </label>
              <div className="space-y-1.5">
                {localQ.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <input
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-sm outline-none"
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    />
                    <button
                      onClick={() => update("correctAnswer", i)}
                      className={`p-1.5 rounded-lg transition flex-shrink-0 ${localQ.correctAnswer === i ? "bg-green-50 text-green-500" : "hover:bg-muted text-muted-foreground"}`}
                    >
                      {localQ.correctAnswer === i ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Click the circle icon to mark correct answer
              </p>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">
                Explanation
              </label>
              <textarea
                value={localQ.explanation}
                onChange={(e) => update("explanation", e.target.value)}
                rows={2}
                placeholder="Explain why this answer is correct..."
                className="w-full px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Score</label>
              <input
                type="number"
                value={localQ.score}
                onChange={(e) => update("score", parseInt(e.target.value) || 1)}
                min={1}
                max={100}
                className="w-24 px-3 py-1.5 rounded-xl bg-muted/50 border border-border text-sm outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ManualQuestionForm({
  question,
  onUpdate,
  onCancel,
}: {
  question: ManualQuestion;
  onUpdate: (q: ManualQuestion) => void;
  onCancel: () => void;
}) {
  const [local, setLocal] = useState(question);

  const set = (field: keyof ManualQuestion, value: unknown) => {
    const updated = { ...local, [field]: value };
    setLocal(updated);
    onUpdate(updated);
  };

  const updateOption = (i: number, val: string) => {
    const opts = [...local.options];
    opts[i] = val;
    set("options", opts);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
          Question Text
        </label>
        <textarea
          value={local.question}
          onChange={(e) => set("question", e.target.value)}
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none resize-none"
          placeholder="Enter your question..."
        />
      </div>

      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
          Answer Options
        </label>
        <div className="space-y-2">
          {local.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground w-5">
                {String.fromCharCode(65 + i)}.
              </span>
              <input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm outline-none"
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
              />
              <button
                onClick={() => set("correctAnswer", i)}
                className={`p-2 rounded-xl transition flex-shrink-0 ${local.correctAnswer === i ? "bg-green-50 text-green-500" : "hover:bg-muted text-muted-foreground"}`}
              >
                {local.correctAnswer === i ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Click the circle icon to select the correct answer
        </p>
      </div>

      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
          Explanation
        </label>
        <textarea
          value={local.explanation}
          onChange={(e) => set("explanation", e.target.value)}
          rows={2}
          placeholder="Explain why this answer is correct..."
          className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
          Score
        </label>
        <input
          type="number"
          value={local.score}
          onChange={(e) => set("score", parseInt(e.target.value) || 1)}
          min={1}
          max={100}
          className="w-28 px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm outline-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
        >
          Cancel
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-gradient-hero text-white text-sm font-bold hover:opacity-90 transition"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
