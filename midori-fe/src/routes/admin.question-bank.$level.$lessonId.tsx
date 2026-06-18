import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Eye, Edit3, Trash2, CheckCircle,
  X, AlertCircle, ChevronRight, BookOpen
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type Category = "Vocabulary" | "Grammar" | "Reading";
type Difficulty = "Easy" | "Medium" | "Hard";

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

// Consistent JLPT levels array matching project pattern
const JLPT_LEVELS: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockQuestions: Question[] = [
  // N5 Lessons
  { id: "q001", level: "N5", lesson: 1, category: "Vocabulary", difficulty: "Easy", questionText: "「山」の読み方正确的是：", options: ["やま", "さめ", "たけ", "たかさ"], correctIndex: 0 },
  { id: "q002", level: "N5", lesson: 1, category: "Vocabulary", difficulty: "Easy", questionText: "「水」の読み方正确的是：", options: ["みず", "すい", "みずず", "みる"], correctIndex: 0 },
  { id: "q003", level: "N5", lesson: 2, category: "Grammar", difficulty: "Easy", questionText: "これは____です。", options: ["ともだち", "がっこう", "せんせい", "くるま"], correctIndex: 0 },
  { id: "q004", level: "N5", lesson: 2, category: "Grammar", difficulty: "Medium", questionText: "私は日本____行きました。", options: ["で", "に", "を", "が"], correctIndex: 1 },
  { id: "q005", level: "N5", lesson: 3, category: "Reading", difficulty: "Medium", questionText: "本文の内容と一致するのはどれですか？", options: ["記述1", "記述2", "記述3", "記述4"], correctIndex: 1 },
  { id: "q006", level: "N5", lesson: 3, category: "Vocabulary", difficulty: "Easy", questionText: "「木」の読み方正确的是：", options: ["き", "こ", "もく", "ぼく"], correctIndex: 0 },
  { id: "q007", level: "N5", lesson: 4, category: "Grammar", difficulty: "Easy", questionText: "彼は学生____。", options: ["です", "だ", "ます", "した"], correctIndex: 0 },
  { id: "q008", level: "N5", lesson: 4, category: "Reading", difficulty: "Hard", questionText: "この文章的主要内容は何ですか？", options: ["記述1", "記述2", "記述3", "記述4"], correctIndex: 2 },
  { id: "q009", level: "N5", lesson: 5, category: "Vocabulary", difficulty: "Medium", questionText: "「火」の読み方正确的是：", options: ["ひ", "か", "ほ", "も"], correctIndex: 0 },
  { id: "q010", level: "N5", lesson: 5, category: "Grammar", difficulty: "Medium", questionText: "明日____映画を見ます。", options: ["に", "で", "を", "が"], correctIndex: 0 },
  // N4 Lessons
  { id: "q011", level: "N4", lesson: 1, category: "Vocabulary", difficulty: "Easy", questionText: "「友達」的汉字写作：", options: ["学校", "友達", "先生", "会社"], correctIndex: 1 },
  { id: "q012", level: "N4", lesson: 1, category: "Grammar", difficulty: "Medium", questionText: "明日会議____、欠席する場合は事前に連絡してください。", options: ["のある", "がある場合", "がある場合に", "のあるとき"], correctIndex: 1 },
  { id: "q013", level: "N4", lesson: 2, category: "Grammar", difficulty: "Hard", questionText: "彼は忙し____、電話に出てくれない。", options: ["そうで", "そうでも", "そうな", "そうなのに"], correctIndex: 2 },
  { id: "q014", level: "N4", lesson: 2, category: "Vocabulary", difficulty: "Medium", questionText: "「環境」の意味正确的是：", options: ["自然", "周囲/環境", "経済", "文化"], correctIndex: 1 },
  { id: "q015", level: "N4", lesson: 3, category: "Grammar", difficulty: "Hard", questionText: "雨に____、試合は中止になります。", options: ["なれば", "なっても", "なったら", "なって"], correctIndex: 2 },
  // N3 Lessons
  { id: "q016", level: "N3", lesson: 1, category: "Vocabulary", difficulty: "Medium", questionText: "「環境」の意味正确的是：", options: ["自然", "周囲/環境", "経済", "文化"], correctIndex: 1 },
  { id: "q017", level: "N3", lesson: 1, category: "Grammar", difficulty: "Hard", questionText: "雨に____、試合は中止になります。", options: ["なれば", "なっても", "なったら", "なって"], correctIndex: 2 },
  { id: "q018", level: "N3", lesson: 2, category: "Reading", difficulty: "Medium", questionText: "本文の内容と一致するのはどれですか？", options: ["記述1", "記述2", "記述3", "記述4"], correctIndex: 1 },
  // N2 Lessons
  { id: "q019", level: "N2", lesson: 1, category: "Grammar", difficulty: "Medium", questionText: "この本は____、とても勉強になった。", options: ["面白いのに", "面白いので", "面白いで", "面白いでは"], correctIndex: 1 },
  { id: "q020", level: "N2", lesson: 1, category: "Reading", difficulty: "Hard", questionText: "筆者の考えと一致するのはどれですか？", options: ["記述1", "記述2", "記述3", "記述4"], correctIndex: 2 },
  { id: "q021", level: "N2", lesson: 2, category: "Vocabulary", difficulty: "Hard", questionText: "「複雑」の意味正确的是：", options: ["simple", "complex", "easy", "difficult"], correctIndex: 1 },
  // N1 Lessons
  { id: "q022", level: "N1", lesson: 1, category: "Grammar", difficulty: "Hard", questionText: "彼は____、理解できなかった。", options: ["complexion", "complex", "complicated", "simplify"], correctIndex: 2 },
  { id: "q023", level: "N1", lesson: 1, category: "Reading", difficulty: "Hard", questionText: "この文章の論旨は何ですか？", options: ["記述1", "記述2", "記述3", "記述4"], correctIndex: 3 },
  { id: "q024", level: "N1", lesson: 2, category: "Vocabulary", difficulty: "Hard", questionText: "「聡明」の意味正确的是：", options: ["clever", "stupid", "rich", "poor"], correctIndex: 0 },
];

// ─── Routes ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/question-bank/$level/$lessonId")({
  component: QuestionBankLessonDetailPage,
});

function QuestionBankLessonDetailPage() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const level = params.level?.toUpperCase() as JLPTLevel;
  const lessonId = parseInt(params.lessonId);

  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "">("");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "">("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Question | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Question | null>(null);

  // Create/Edit form state - auto-assigned level and lesson
  const [formData, setFormData] = useState<Partial<Question>>({
    level: level,
    lesson: lessonId,
    category: "Vocabulary",
    difficulty: "Easy",
    questionText: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  });

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
      level: level,
      lesson: lessonId,
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

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setDifficultyFilter("");
  };

  const hasFilters = searchTerm || categoryFilter || difficultyFilter;

  // Filter questions for this level and lesson
  const lessonQuestions = questions.filter(q => q.level === level && q.lesson === lessonId);

  // Apply search and filter to lesson questions
  const filteredQuestions = lessonQuestions.filter(q => {
    const matchesSearch = !searchTerm ||
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || q.category === categoryFilter;
    const matchesDifficulty = !difficultyFilter || q.difficulty === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Stats
  const byCategory = {
    Vocabulary: lessonQuestions.filter(q => q.category === "Vocabulary").length,
    Grammar: lessonQuestions.filter(q => q.category === "Grammar").length,
    Reading: lessonQuestions.filter(q => q.category === "Reading").length,
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/question-bank" className="hover:text-foreground transition">
          Question Bank
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/admin/question-bank/${level.toLowerCase()}`} className="hover:text-foreground transition">
          {level} Lessons
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-semibold text-foreground">Lesson {lessonId}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-black">{level} - Lesson {lessonId}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage questions for Lesson {lessonId}</p>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
          <div className="text-2xl font-bold text-blue-600">{lessonQuestions.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
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
        <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20">
          <div className="text-2xl font-bold text-gray-600">{15 - lessonId}</div>
          <div className="text-xs text-muted-foreground">Lessons Left</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border">
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
        <span>Showing {filteredQuestions.length} of {lessonQuestions.length} questions</span>
      </div>

      {/* Question Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Question</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Difficulty</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No questions found. {hasFilters ? "Try adjusting your filters." : "Create your first question for this lesson."}
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
                          onClick={() => {
                            const targetPath = `/admin/question-bank/${params.level}/${lessonId}/${q.id}`;
                            console.log("Question navigation:", targetPath);
                            console.log("[VIEW] Clicked question:", q.id);
                            navigate({
                              to: "/admin/question-bank/$level/$lessonId/$questionId",
                              params: {
                                level: params.level,
                                lessonId: lessonId.toString(),
                                questionId: q.id
                              }
                            });
                          }}
                          className="p-2 rounded-lg hover:bg-muted transition"
                          title={`View question ${q.id}`}
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
                level={level}
                lessonId={lessonId}
              />
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
                level={level}
                lessonId={lessonId}
                isEdit
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

      {/* Outlet for child routes (Question Detail) */}
      <Outlet />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface QuestionFormModalProps {
  title: string;
  formData: Partial<Question>;
  onChange: (field: keyof Question, value: any) => void;
  onOptionChange: (index: number, value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  level: JLPTLevel;
  lessonId: number;
  isEdit?: boolean;
}

function QuestionFormModal({
  title,
  formData,
  onChange,
  onOptionChange,
  onCancel,
  onSubmit,
  submitLabel,
  level,
  lessonId,
  isEdit = false,
}: QuestionFormModalProps) {
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-xs text-muted-foreground">{level} - Lesson {lessonId}</p>
        </div>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-muted transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-220px)]">
        {/* Metadata Row - Level and Lesson are locked */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Level</label>
            <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-semibold text-primary">
              {level}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Lesson</label>
            <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-semibold text-primary">
              Lesson {lessonId}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
        <div>
          <h2 className="text-lg font-bold">Question Details</h2>
          <p className="text-xs text-muted-foreground">{question.level} - Lesson {question.lesson}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
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
