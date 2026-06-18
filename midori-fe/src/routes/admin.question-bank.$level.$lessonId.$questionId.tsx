import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, Edit3, Trash2, CheckCircle, ChevronRight, X, Plus, AlertCircle } from "lucide-react";

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockQuestions: Question[] = [
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
  { id: "q011", level: "N4", lesson: 1, category: "Vocabulary", difficulty: "Easy", questionText: "「友達」的汉字写作：", options: ["学校", "友達", "先生", "会社"], correctIndex: 1 },
  { id: "q012", level: "N4", lesson: 1, category: "Grammar", difficulty: "Medium", questionText: "明日会議____、欠席する場合は事前に連絡してください。", options: ["のある", "がある場合", "がある場合に", "のあるとき"], correctIndex: 1 },
  { id: "q013", level: "N4", lesson: 2, category: "Grammar", difficulty: "Hard", questionText: "彼は忙し____、電話に出てくれない。", options: ["そうで", "そうでも", "そうな", "そうなのに"], correctIndex: 2 },
  { id: "q014", level: "N4", lesson: 2, category: "Vocabulary", difficulty: "Medium", questionText: "「環境」の意味正确的是：", options: ["自然", "周囲/環境", "経済", "文化"], correctIndex: 1 },
  { id: "q015", level: "N4", lesson: 3, category: "Grammar", difficulty: "Hard", questionText: "雨に____、試合は中止になります。", options: ["なれば", "なっても", "なったら", "なって"], correctIndex: 2 },
  { id: "q016", level: "N3", lesson: 1, category: "Vocabulary", difficulty: "Medium", questionText: "「環境」の意味正确的是：", options: ["自然", "周囲/環境", "経済", "文化"], correctIndex: 1 },
  { id: "q017", level: "N3", lesson: 1, category: "Grammar", difficulty: "Hard", questionText: "雨に____、試合は中止になります。", options: ["なれば", "なっても", "なったら", "なって"], correctIndex: 2 },
  { id: "q018", level: "N3", lesson: 2, category: "Reading", difficulty: "Medium", questionText: "本文の内容と一致するのはどれですか？", options: ["記述1", "記述2", "記述3", "記述4"], correctIndex: 1 },
  { id: "q019", level: "N2", lesson: 1, category: "Grammar", difficulty: "Medium", questionText: "この本は____、とても勉強になった。", options: ["面白いのに", "面白いので", "面白いで", "面白いでは"], correctIndex: 1 },
  { id: "q020", level: "N2", lesson: 1, category: "Reading", difficulty: "Hard", questionText: "筆者の考えと一致するのはどれですか？", options: ["記述1", "記述2", "記述3", "記述4"], correctIndex: 2 },
  { id: "q021", level: "N2", lesson: 2, category: "Vocabulary", difficulty: "Hard", questionText: "「複雑」の意味正确的是：", options: ["simple", "complex", "easy", "difficult"], correctIndex: 1 },
  { id: "q022", level: "N1", lesson: 1, category: "Grammar", difficulty: "Hard", questionText: "彼は____、理解できなかった。", options: ["complexion", "complex", "complicated", "simplify"], correctIndex: 2 },
  { id: "q023", level: "N1", lesson: 1, category: "Reading", difficulty: "Hard", questionText: "この文章の論旨は何ですか？", options: ["記述1", "記述2", "記述3", "記述4"], correctIndex: 3 },
  { id: "q024", level: "N1", lesson: 2, category: "Vocabulary", difficulty: "Hard", questionText: "「聡明」の意味正确的是：", options: ["clever", "stupid", "rich", "poor"], correctIndex: 0 },
];

// ─── Routes ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/admin/question-bank/$level/$lessonId/$questionId")({
  component: QuestionDetailPage,
});

function QuestionDetailPage() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const level = params.level?.toUpperCase() as JLPTLevel;
  const lessonId = parseInt(params.lessonId);
  const questionId = params.questionId;

  // Find the question
  const question = mockQuestions.find(q => q.id === questionId);

  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Question>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data when question changes
  useEffect(() => {
    if (question) {
      setFormData({ ...question, options: [...question.options] });
    }
  }, [question]);

  if (!question) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/admin/question-bank" className="hover:text-foreground transition">Question Bank</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/admin/question-bank/${level?.toLowerCase()}`} className="hover:text-foreground transition">{level} Lessons</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/admin/question-bank/${level?.toLowerCase()}/${lessonId}`} className="hover:text-foreground transition">Lesson {lessonId}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Question Not Found</span>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Question Not Found</h3>
          <p className="text-sm text-muted-foreground mb-4">The question you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate({ to: `/admin/question-bank/${level?.toLowerCase()}/${lessonId}` })}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition"
          >
            Back to Lesson
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (field: keyof Question, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData(prev => {
      const newOptions = [...(prev.options || question.options)];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  const handleSave = () => {
    // In real app, would save to API here
    console.log("Saving question:", formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({ ...question, options: [...question.options] });
    setIsEditing(false);
  };

  const handleDelete = () => {
    // In real app, would delete via API
    console.log("Deleting question:", questionId);
    navigate({ to: `/admin/question-bank/${level?.toLowerCase()}/${lessonId}` });
  };

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/question-bank" className="hover:text-foreground transition">Question Bank</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/admin/question-bank/${level?.toLowerCase()}`} className="hover:text-foreground transition">{level} Lessons</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to={`/admin/question-bank/${level?.toLowerCase()}/${lessonId}`} className="hover:text-foreground transition">Lesson {lessonId}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-semibold text-foreground">Question Detail</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-black">Question Detail</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{question.questionText.slice(0, 50)}...</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg hover:bg-primary/90 transition"
              >
                <Edit3 className="w-4 h-4" />
                Edit Question
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold shadow-lg hover:bg-red-600 transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold shadow-lg hover:bg-green-600 transition"
              >
                <CheckCircle className="w-4 h-4" />
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Question Info Card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="font-bold text-lg">Question Information</h2>
        </div>

        {isEditing ? (
          <div className="p-6 space-y-5">
            {/* Metadata Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">JLPT Level</label>
                <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-semibold text-primary">
                  {question.level}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Lesson</label>
                <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm font-semibold text-primary">
                  Lesson {question.lesson}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:border-primary"
                >
                  <option value="Vocabulary">Vocabulary</option>
                  <option value="Grammar">Grammar</option>
                  <option value="Reading">Reading</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => handleChange("difficulty", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:border-primary"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">Question Content *</label>
              <textarea
                value={formData.questionText}
                onChange={(e) => handleChange("questionText", e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:border-primary resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-bold">{question.level}</span>
              <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 text-sm font-semibold">Lesson {question.lesson}</span>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                question.category === "Vocabulary" ? "bg-green-500/10 text-green-600" :
                question.category === "Grammar" ? "bg-purple-500/10 text-purple-600" :
                "bg-orange-500/10 text-orange-600"
              }`}>{question.category}</span>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                question.difficulty === "Easy" ? "bg-green-500/10 text-green-600" :
                question.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-600" :
                "bg-red-500/10 text-red-600"
              }`}>{question.difficulty}</span>
            </div>

            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Question</div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border text-sm">
                {question.questionText}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Answers Card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <h2 className="font-bold text-lg">Answers</h2>
        </div>

        {isEditing ? (
          <div className="p-6 space-y-3">
            {(formData.options || question.options).map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  formData.correctIndex === index ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {optionLabels[index]}
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:border-primary"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={formData.correctIndex === index}
                    onChange={() => handleChange("correctIndex", index)}
                    className="w-4 h-4 text-green-500"
                  />
                  <span className="text-muted-foreground">Correct</span>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 space-y-3">
            {(formData.options || question.options).map((option, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-4 rounded-lg border ${
                  question.correctIndex === index
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-muted/30 border-border"
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  question.correctIndex === index ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {optionLabels[index]}
                </span>
                <span className={`flex-1 text-sm ${question.correctIndex === index ? "text-green-600 font-medium" : ""}`}>
                  {option}
                </span>
                {question.correctIndex === index && (
                  <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-600 text-xs font-bold">
                    CORRECT
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explanation Card */}
      {(question.explanation || isEditing) && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <h2 className="font-bold text-lg">Explanation</h2>
          </div>
          <div className="p-6">
            {isEditing ? (
              <textarea
                value={formData.explanation || ""}
                onChange={(e) => handleChange("explanation", e.target.value)}
                rows={3}
                placeholder="Explain why the correct answer is correct..."
                className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:border-primary resize-none"
              />
            ) : (
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm">
                {question.explanation}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
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
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
