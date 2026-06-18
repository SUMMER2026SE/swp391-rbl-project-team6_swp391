import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Eye, Edit3, Trash2, Loader2, CheckCircle,
  X, ChevronDown, ChevronRight, Filter, List, Tag, BookOpen,
  GraduationCap, AlertCircle
} from "lucide-react";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type Category = "Vocabulary" | "Grammar" | "Reading";
type Difficulty = "Easy" | "Medium" | "Hard";

// Consistent JLPT levels array matching project pattern
const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

interface Question {
  id: string;
  level: JLPTLevel;
  lesson: number;
  category: Category;
  difficulty: Difficulty;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

// â”€â”€â”€ Mock Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockQuestions: Question[] = [
  {
    id: "q001",
    level: "N5",
    lesson: 1,
    category: "Vocabulary",
    difficulty: "Easy",
    questionText: "ã€Œå±±ã€ã®èª­ã¿æ–¹æ­£ç¡®çš„æ˜¯ï¼š",
    options: ["ã‚„ã¾", "ã•ã‚", "ãŸã‘", "ãŸã‹ã•"],
    correctIndex: 0,
    explanation: "ã€Œå±±ã€ã®èª­ã¿æ–¹ã¯ã€Œã‚„ã¾ã€ã§ã™ã€‚"
  },
  {
    id: "q002",
    level: "N5",
    lesson: 1,
    category: "Vocabulary",
    difficulty: "Easy",
    questionText: "ã€Œæ°´ã€ã®èª­ã¿æ–¹æ­£ç¡®çš„æ˜¯ï¼š",
    options: ["ã¿ãš", "ã™ã„", "ã¿ãšãš", "ã¿ã‚‹"],
    correctIndex: 0,
    explanation: "ã€Œæ°´ã€ã®èª­ã¿æ–¹ã¯ã€Œã¿ãšã€ã§ã™ã€‚"
  },
  {
    id: "q003",
    level: "N5",
    lesson: 2,
    category: "Grammar",
    difficulty: "Easy",
    questionText: "ã“ã‚Œã¯____ã§ã™ã€‚",
    options: ["ã¨ã‚‚ã ã¡", "ãŒã£ã“ã†", "ã›ã‚“ã›ã„", "ãã‚‹ã¾"],
    correctIndex: 0,
    explanation: "ã€Œã¨ã‚‚ã ã¡ã€ã¯ã€Œå‹é”ã€ã¨æ›¸ãã€Œæœ‹å‹ã€ã‚’æ„å‘³ã—ã¾ã™ã€‚"
  },
  {
    id: "q004",
    level: "N5",
    lesson: 2,
    category: "Grammar",
    difficulty: "Medium",
    questionText: "ç§ã¯æ—¥æœ¬____è¡Œãã¾ã—ãŸã€‚",
    options: ["ã§", "ã«", "ã‚’", "ãŒ"],
    correctIndex: 1,
    explanation: "ã€Œã«ã€ã¯ç§»å‹•ã®ç›®çš„åœ°ã‚’è¡¨ã—ã¾ã™ã€‚"
  },
  {
    id: "q005",
    level: "N5",
    lesson: 3,
    category: "Reading",
    difficulty: "Medium",
    questionText: "æœ¬æ–‡ã®å†…å®¹ã¨ä¸€è‡´ã™ã‚‹ã®ã¯ã©ã‚Œã§ã™ã‹ï¼Ÿ",
    options: ["è¨˜è¿°1", "è¨˜è¿°2", "è¨˜è¿°3", "è¨˜è¿°4"],
    correctIndex: 1,
    explanation: "æœ¬æ–‡ã«ã¯è¨˜è¿°2ãŒè¨˜è¼‰ã•ã‚Œã¦ã„ã¾ã™ã€‚"
  },
  {
    id: "q006",
    level: "N4",
    lesson: 1,
    category: "Vocabulary",
    difficulty: "Easy",
    questionText: "ã€Œå‹é”ã€çš„æ±‰å­—å†™ä½œï¼š",
    options: ["å­¦æ ¡", "å‹é”", "å…ˆç”Ÿ", "ä¼šç¤¾"],
    correctIndex: 1,
    explanation: "ã€Œå‹é”ã€è¯»ä½œã€Œã¨ã‚‚ã ã¡ã€ï¼Œæ„æ€æ˜¯æœ‹å‹ã€‚"
  },
  {
    id: "q007",
    level: "N4",
    lesson: 1,
    category: "Grammar",
    difficulty: "Medium",
    questionText: "æ˜Žæ—¥ä¼šè­°____ã€æ¬ å¸­ã™ã‚‹å ´åˆã¯äº‹å‰ã«é€£çµ¡ã—ã¦ãã ã•ã„ã€‚",
    options: ["ã®ã‚ã‚‹", "ãŒã‚ã‚‹å ´åˆ", "ãŒã‚ã‚‹å ´åˆã«", "ã®ã‚ã‚‹ã¨ã"],
    correctIndex: 1,
    explanation: "ã€Œã€œãŒã‚ã‚‹å ´åˆã¯ã€â€¦ã€ã¯ä»®å®šã€æ¡ä»¶ã‚’è¡¨ã™æ–‡æ³•ã§ã™ã€‚"
  },
  {
    id: "q008",
    level: "N4",
    lesson: 2,
    category: "Grammar",
    difficulty: "Hard",
    questionText: "å½¼ã¯å¿™ã—____ã€é›»è©±ã«å‡ºã¦ãã‚Œãªã„ã€‚",
    options: ["ãã†ã§", "ãã†ã§ã‚‚", "ãã†ãª", "ãã†ãªã®ã«"],
    correctIndex: 2,
    explanation: "ã€Œã€œãã†ã§ã€ã¯æ§˜æ…‹ã®æ„å‘³ã§ã€Œã€œã®æ§˜å­ã§ã€ã‚’è¡¨ã—ã¾ã™ã€‚"
  },
  {
    id: "q009",
    level: "N3",
    lesson: 1,
    category: "Vocabulary",
    difficulty: "Medium",
    questionText: "ã€Œç’°å¢ƒã€ã®æ„å‘³æ­£ç¡®çš„æ˜¯ï¼š",
    options: ["è‡ªç„¶", "å‘¨å›²/ç’°å¢ƒ", "çµŒæ¸ˆ", "æ–‡åŒ–"],
    correctIndex: 1,
    explanation: "ã€Œç’°å¢ƒã€ã®æ„å‘³ã¯å‘¨å›²/ç’°å¢ƒã§ã™ã€‚"
  },
  {
    id: "q010",
    level: "N3",
    lesson: 2,
    category: "Grammar",
    difficulty: "Hard",
    questionText: "é›¨ã«____ã€è©¦åˆã¯ä¸­æ­¢ã«ãªã‚Šã¾ã™ã€‚",
    options: ["ãªã‚Œã°", "ãªã£ã¦ã‚‚", "ãªã£ãŸã‚‰", "ãªã£ã¦"],
    correctIndex: 2,
    explanation: "ã€Œã€œãŸã‚‰ã€ã¯æ¡ä»¶ã‚’è¡¨ã—ã€æœªæ¥ã®ç¢ºå®šæ¡ä»¶ã«ä½¿ã„ã¾ã™ã€‚"
  },
  {
    id: "q011",
    level: "N2",
    lesson: 1,
    category: "Grammar",
    difficulty: "Medium",
    questionText: "ã“ã®æœ¬ã¯____ã€ã¨ã¦ã‚‚å‹‰å¼·ã«ãªã£ãŸã€‚",
    options: ["é¢ç™½ã„ã®ã«", "é¢ç™½ã„ã®ã§", "é¢ç™½ã„ã§", "é¢ç™½ã„ã§ã¯"],
    correctIndex: 1,
    explanation: "ã€Œã€œã®ã§ã€ã¯åŽŸå› ãƒ»ç†ç”±ã‚’è¡¨ã—ã¾ã™ã€‚"
  },
  {
    id: "q012",
    level: "N2",
    lesson: 1,
    category: "Reading",
    difficulty: "Hard",
    questionText: "ç­†è€…ã®è€ƒãˆã¨ä¸€è‡´ã™ã‚‹ã®ã¯ã©ã‚Œã§ã™ã‹ï¼Ÿ",
    options: ["è¨˜è¿°1", "è¨˜è¿°2", "è¨˜è¿°3", "è¨˜è¿°4"],
    correctIndex: 2,
    explanation: "ç­†è€…ã®è€ƒãˆã¯è¨˜è¿°3ã«è¨˜è¼‰ã•ã‚Œã¦ã„ã¾ã™ã€‚"
  },
  {
    id: "q013",
    level: "N1",
    lesson: 1,
    category: "Grammar",
    difficulty: "Hard",
    questionText: "å½¼ã¯____ã€ç†è§£ã§ããªã‹ã£ãŸã€‚",
    options: ["complexion", "complex", "complicated", "simplify"],
    correctIndex: 2,
    explanation: "ã€Œcomplexedã€ï¼ˆè¤‡é›‘ãªï¼‰ã¯N1ãƒ¬ãƒ™ãƒ«ã®èªžå½™ã§ã™ã€‚"
  },
];

// â”€â”€â”€ Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const Route = createFileRoute("/admin/exams")({
  component: QuestionBankPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      level: (search.level as JLPTLevel | undefined) || undefined,
    };
  },
});

function QuestionBankPage() {
  const search = useSearch({ from: "/admin/exams" });
  const currentLevel = search.level?.toUpperCase() as JLPTLevel | undefined;
  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [searchTerm, setSearchTerm] = useState("");
  const [lessonFilter, setLessonFilter] = useState<number | "">("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "">("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "">("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState<Question | null>(null);
  const [showEditModal, setShowEditModal] = useState<Question | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create/Edit form state - level is auto-assigned based on URL
  const [formData, setFormData] = useState<Partial<Question>>({
    level: currentLevel || "N5",
    lesson: 1,
    category: "Vocabulary",
    difficulty: "Easy",
    questionText: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  });

  // Update form level when URL changes
  useEffect(() => {
    if (currentLevel) {
      setFormData(prev => ({ ...prev, level: currentLevel }));
    }
  }, [currentLevel]);

  // Filter questions - always filter by current level from URL
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = !searchTerm ||
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.options.some(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = !currentLevel || q.level === currentLevel;
    const matchesLesson = !lessonFilter || q.lesson === lessonFilter;
    const matchesCategory = !categoryFilter || q.category === categoryFilter;
    const matchesDifficulty = !difficultyFilter || q.difficulty === difficultyFilter;
    return matchesSearch && matchesLevel && matchesLesson && matchesCategory && matchesDifficulty;
  });

  // Stats - based on current level
  const levelQuestions = currentLevel ? questions.filter(q => q.level === currentLevel) : questions;
  const totalQuestions = levelQuestions.length;
  const byCategory = {
    Vocabulary: levelQuestions.filter(q => q.category === "Vocabulary").length,
    Grammar: levelQuestions.filter(q => q.category === "Grammar").length,
    Reading: levelQuestions.filter(q => q.category === "Reading").length,
  };

  // Get available lessons for current level
  const availableLessons = [...new Set(questions.filter(q => !currentLevel || q.level === currentLevel).map(q => q.lesson))].sort((a, b) => a - b);

  // Reset form with current level
  const resetForm = () => {
    setFormData({
      level: currentLevel || "N5",
      lesson: 1,
      category: "Vocabulary",
      difficulty: "Easy",
      questionText: "",
      options: ["", "", "", ""],
      correctIndex: 0,
      explanation: "",
    });
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleView = (q: Question) => {
    setShowViewModal(q);
  };

  const handleEdit = (q: Question) => {
    setFormData({ ...q, options: [...q.options] });
    setShowEditModal(q);
  };

  const handleDelete = (q: Question) => {
    setShowDeleteConfirm(q);
  };

  const confirmDelete = () => {
    if (!showDeleteConfirm) return;
    setQuestions(prev => prev.filter(q => q.id !== showDeleteConfirm.id));
    setShowDeleteConfirm(null);
  };

  const handleFormChange = (field: keyof Question, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData(prev => {
      const newOptions = [...(prev.options || ["", "", "", ""])];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const handleSubmitCreate = () => {
    if (!formData.questionText?.trim()) {
      alert("Question text is required");
      return;
    }
    if (formData.options?.some(opt => !opt.trim())) {
      alert("All options are required");
      return;
    }

    const newQuestion: Question = {
      id: `q${Date.now()}`,
      level: formData.level as JLPTLevel,
      lesson: formData.lesson as number,
      category: formData.category as Category,
      difficulty: formData.difficulty as Difficulty,
      questionText: formData.questionText!,
      options: formData.options as string[],
      correctIndex: formData.correctIndex as number,
      explanation: formData.explanation,
    };

    setQuestions(prev => [newQuestion, ...prev]);
    setShowCreateModal(false);
    resetForm();
  };

  const handleSubmitEdit = () => {
    if (!showEditModal) return;
    if (!formData.questionText?.trim()) {
      alert("Question text is required");
      return;
    }

    const updatedQuestion: Question = {
      ...showEditModal,
      level: formData.level as JLPTLevel,
      lesson: formData.lesson as number,
      category: formData.category as Category,
      difficulty: formData.difficulty as Difficulty,
      questionText: formData.questionText!,
      options: formData.options as string[],
      correctIndex: formData.correctIndex as number,
      explanation: formData.explanation,
    };

    setQuestions(prev => prev.map(q => q.id === showEditModal.id ? updatedQuestion : q));
    setShowEditModal(null);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setLessonFilter("");
    setCategoryFilter("");
    setDifficultyFilter("");
  };

  const hasFilters = searchTerm || lessonFilter || categoryFilter || difficultyFilter;

  // Page title based on current level
  const pageTitle = currentLevel ? `${currentLevel} Question Bank` : "Question Bank";
  const pageDescription = currentLevel
    ? `Manage all ${currentLevel} questions used for automatic exam generation.`
    : "Manage all questions used for automatic exam generation.";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-black">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pageDescription}</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          Create Question
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
          <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
          <div className="text-xs text-muted-foreground">Total Questions</div>
        </div>
        <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
          <div className="text-2xl font-bold text-green-600">{byCategory.Vocabulary}</div>
          <div className="text-xs text-muted-foreground">Vocabulary</div>
        </div>
        <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
          <div className="text-2xl font-bold text-purple-600">{byCategory.Grammar}</div>
          <div className="text-xs text-muted-foreground">Grammar</div>
        </div>
        <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
          <div className="text-2xl font-bold text-orange-600">{byCategory.Reading}</div>
          <div className="text-xs text-muted-foreground">Reading</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary transition"
          />
        </div>

        {/* Lesson Filter */}
        <select
          value={lessonFilter}
          onChange={(e) => setLessonFilter(e.target.value ? parseInt(e.target.value) : "")}
          className="px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary transition"
        >
          <option value="">All Lessons</option>
          {availableLessons.map(l => (
            <option key={l} value={l}>Lesson {l}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as Category | "")}
          className="px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary transition"
        >
          <option value="">All Categories</option>
          <option value="Vocabulary">Vocabulary</option>
          <option value="Grammar">Grammar</option>
          <option value="Reading">Reading</option>
        </select>

        {/* Difficulty Filter */}
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | "")}
          className="px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:border-primary transition"
        >
          <option value="">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filteredQuestions.length} of {totalQuestions} questions</span>
      </div>

      {/* Question Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Question</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Lesson</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Difficulty</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No questions found. {hasFilters ? "Try adjusting your filters." : "Create your first question."}
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q, i) => (
                  <motion.tr
                    key={q.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025 }}
                    className="border-b border-border hover:bg-muted/30 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm text-foreground line-clamp-2 max-w-md">{q.questionText}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold">
                        Lesson {q.lesson}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        q.category === "Vocabulary" ? "bg-green-500/10 text-green-600" :
                        q.category === "Grammar" ? "bg-purple-500/10 text-purple-600" :
                        "bg-orange-500/10 text-orange-600"
                      }`}>
                        {q.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        q.difficulty === "Easy" ? "bg-green-500/10 text-green-600" :
                        q.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-600" :
                        "bg-red-500/10 text-red-600"
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(q)}
                          className="p-2 rounded-lg hover:bg-muted transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleEdit(q)}
                          className="p-2 rounded-lg hover:bg-muted transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(q)}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Question Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <QuestionFormModal
                title="Create Question"
                formData={formData}
                onChange={handleFormChange}
                onOptionChange={handleOptionChange}
                onCancel={() => setShowCreateModal(false)}
                onSubmit={handleSubmitCreate}
                submitLabel="Create Question"
                isCreate={true}
                currentLevel={currentLevel}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Question Modal */}
      <AnimatePresence>
        {showViewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowViewModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <QuestionViewModal question={showViewModal} onClose={() => setShowViewModal(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Question Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowEditModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
            >
              <QuestionFormModal
                title="Edit Question"
                formData={formData}
                onChange={handleFormChange}
                onOptionChange={handleOptionChange}
                onCancel={() => setShowEditModal(null)}
                onSubmit={handleSubmitEdit}
                submitLabel="Save Changes"
                isCreate={false}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">Delete Question?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  This action cannot be undone. The question will be permanently deleted.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface QuestionFormModalProps {
  title: string;
  formData: Partial<Question>;
  onChange: (field: keyof Question, value: any) => void;
  onOptionChange: (index: number, value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  isCreate?: boolean;
  currentLevel?: JLPTLevel;
}

function QuestionFormModal({
  title,
  formData,
  onChange,
  onOptionChange,
  onCancel,
  onSubmit,
  submitLabel,
  isCreate = false,
  currentLevel,
}: QuestionFormModalProps) {
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-lg font-bold">{title}</h2>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-muted transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
        {/* Metadata Row - Level is auto-assigned for Create */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Level - Only show for Edit, auto-assigned for Create */}
          {!isCreate ? (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Level *</label>
              <select
                value={formData.level}
                onChange={(e) => onChange("level", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:border-primary"
              >
                {JLPT_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Level</label>
              <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-semibold text-primary">
                {currentLevel || formData.level}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Lesson *</label>
            <input
              type="number"
              value={formData.lesson}
              onChange={(e) => onChange("lesson", parseInt(e.target.value) || 1)}
              min={1}
              className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => onChange("category", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:border-primary"
            >
              <option value="Vocabulary">Vocabulary</option>
              <option value="Grammar">Grammar</option>
              <option value="Reading">Reading</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Difficulty *</label>
            <select
              value={formData.difficulty}
              onChange={(e) => onChange("difficulty", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:border-primary"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Question Text */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Question Content *</label>
          <textarea
            value={formData.questionText}
            onChange={(e) => onChange("questionText", e.target.value)}
            placeholder="Enter the question text..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-muted-foreground uppercase">Answer Options *</label>
          <div className="space-y-2">
            {formData.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  formData.correctIndex === index
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {optionLabels[index]}
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => onOptionChange(index, e.target.value)}
                  placeholder={`Answer ${optionLabels[index]}...`}
                  className="flex-1 px-4 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:border-primary"
                />
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={formData.correctIndex === index}
                  onChange={() => onChange("correctIndex", index)}
                  className="w-4 h-4 text-green-500"
                  title="Mark as correct"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Click the radio button to mark the correct answer</p>
        </div>

        {/* Explanation */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Explanation</label>
          <textarea
            value={formData.explanation}
            onChange={(e) => onChange("explanation", e.target.value)}
            placeholder="Explain why the correct answer is correct..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:border-primary resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/20">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition"
        >
          {submitLabel}
        </button>
      </div>
    </>
  );
}

function QuestionViewModal({ question, onClose }: { question: Question; onClose: () => void }) {
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="text-lg font-bold">Question Details</h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">{question.level}</span>
          <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold">Lesson {question.lesson}</span>
          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
            question.category === "Vocabulary" ? "bg-green-500/10 text-green-600" :
            question.category === "Grammar" ? "bg-purple-500/10 text-purple-600" :
            "bg-orange-500/10 text-orange-600"
          }`}>{question.category}</span>
          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
            question.difficulty === "Easy" ? "bg-green-500/10 text-green-600" :
            question.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-600" :
            "bg-red-500/10 text-red-600"
          }`}>{question.difficulty}</span>
        </div>

        {/* Question */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Question</div>
          <div className="text-sm">{question.questionText}</div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase">Options</div>
          {question.options.map((option, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                question.correctIndex === index
                  ? "bg-green-500/10 border-green-500/30"
                  : "bg-muted/30 border-border"
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                question.correctIndex === index
                  ? "bg-green-500 text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {optionLabels[index]}
              </span>
              <span className={`flex-1 text-sm ${
                question.correctIndex === index ? "text-green-600 font-medium" : ""
              }`}>
                {option}
              </span>
              {question.correctIndex === index && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
          ))}
        </div>

        {/* Explanation */}
        {question.explanation && (
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="text-xs font-bold text-blue-600 uppercase mb-2">Explanation</div>
            <div className="text-sm text-muted-foreground">{question.explanation}</div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-border bg-muted/20">
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition"
        >
          Close
        </button>
      </div>
    </>
  );
}
