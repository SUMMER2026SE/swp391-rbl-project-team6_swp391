import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronRight, Plus, X, Eye } from "lucide-react";

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

interface Lesson {
  id: number;
  name: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockLessons: Record<JLPTLevel, Lesson[]> = {
  N5: [
    { id: 1, name: "Introduction to Japanese" },
    { id: 2, name: "Basic Greetings" },
    { id: 3, name: "Numbers and Counting" },
    { id: 4, name: "Colors and Shapes" },
    { id: 5, name: "Days and Months" },
  ],
  N4: [
    { id: 1, name: "Daily Conversations" },
    { id: 2, name: "Travel Japanese" },
    { id: 3, name: "Shopping and Dining" },
  ],
  N3: [
    { id: 1, name: "Intermediate Grammar" },
    { id: 2, name: "Reading Comprehension" },
  ],
  N2: [
    { id: 1, name: "Advanced Grammar Patterns" },
    { id: 2, name: "Business Japanese" },
  ],
  N1: [
    { id: 1, name: "Advanced Expressions" },
    { id: 2, name: "Academic Japanese" },
  ],
};

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

export const Route = createFileRoute("/admin/question-bank/$level")({
  component: QuestionBankLessonListPage,
});

function QuestionBankLessonListPage() {
  const params = Route.useParams();
  const level = params.level?.toUpperCase() as JLPTLevel;

  // Local lessons state
  const [lessons, setLessons] = useState<Lesson[]>(mockLessons[level] || []);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLessonNumber, setNewLessonNumber] = useState("");
  const [newLessonName, setNewLessonName] = useState("");

  // Update lessons when level changes
  useState(() => {
    setLessons(mockLessons[level] || []);
  });

  // Get questions for this level
  const levelQuestions = mockQuestions.filter(q => q.level === level);

  // Calculate lesson stats
  const getLessonStats = (lessonId: number) => {
    const lessonQs = levelQuestions.filter(q => q.lesson === lessonId);
    return {
      total: lessonQs.length,
      Vocabulary: lessonQs.filter(q => q.category === "Vocabulary").length,
      Grammar: lessonQs.filter(q => q.category === "Grammar").length,
      Reading: lessonQs.filter(q => q.category === "Reading").length,
    };
  };

  const handleCreateLesson = () => {
    if (!newLessonNumber.trim() || !newLessonName.trim()) {
      alert("Please fill in both Lesson Number and Lesson Name");
      return;
    }

    const lessonNum = parseInt(newLessonNumber);
    if (isNaN(lessonNum) || lessonNum < 1) {
      alert("Please enter a valid lesson number");
      return;
    }

    // Check if lesson already exists
    if (lessons.some(l => l.id === lessonNum)) {
      alert("A lesson with this number already exists");
      return;
    }

    const newLesson: Lesson = { id: lessonNum, name: newLessonName.trim() };
    setLessons(prev => [...prev, newLesson].sort((a, b) => a.id - b.id));
    setNewLessonNumber("");
    setNewLessonName("");
    setShowCreateModal(false);
  };

  const pageTitle = level ? `${level} Question Bank` : "Question Bank";

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/question-bank" className="hover:text-foreground transition">
          Question Bank
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="font-semibold text-foreground">{level} Lessons</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-black">{pageTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Select a lesson to manage questions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          Create Lesson
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
          <div className="text-2xl font-bold text-blue-600">{lessons.length}</div>
          <div className="text-xs text-muted-foreground">Total Lessons</div>
        </div>
        <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
          <div className="text-2xl font-bold text-green-600">{levelQuestions.length}</div>
          <div className="text-xs text-muted-foreground">Total Questions</div>
        </div>
        <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
          <div className="text-2xl font-bold text-purple-600">
            {lessons.filter(l => getLessonStats(l.id).total > 0).length}
          </div>
          <div className="text-xs text-muted-foreground">Active Lessons</div>
        </div>
        <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
          <div className="text-2xl font-bold text-orange-600">
            {levelQuestions.filter(q => q.category === "Vocabulary").length}
          </div>
          <div className="text-xs text-muted-foreground">Vocabulary</div>
        </div>
      </div>

      {/* Lesson List */}
      {lessons.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first lesson to start adding questions</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition"
          >
            Create Lesson
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Lesson</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Questions</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Vocabulary</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Grammar</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Reading</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson, index) => {
                const stats = getLessonStats(lesson.id);
                return (
                  <motion.tr
                    key={lesson.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border hover:bg-muted/30 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {lesson.id}
                        </div>
                        <div>
                          <div className="font-semibold">Lesson {lesson.id}</div>
                          <div className="text-xs text-muted-foreground">{lesson.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 text-xs font-semibold">
                        {stats.total} questions
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-600 text-xs font-medium">
                        {stats.Vocabulary}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-600 text-xs font-medium">
                        {stats.Grammar}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-medium">
                        {stats.Reading}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to="/admin/question-bank/$level/$lessonId"
                          params={{ level: level.toLowerCase(), lessonId: lesson.id.toString() }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Lesson Modal */}
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
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-bold">Create Lesson</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-muted transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Lesson Number *</label>
                  <input
                    type="number"
                    value={newLessonNumber}
                    onChange={(e) => setNewLessonNumber(e.target.value)}
                    placeholder="Enter lesson number (e.g., 1, 2, 3...)"
                    min={1}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Lesson Name *</label>
                  <input
                    type="text"
                    value={newLessonName}
                    onChange={(e) => setNewLessonName(e.target.value)}
                    placeholder="Enter lesson name (e.g., Introduction, Greetings...)"
                    className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/20">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-sm font-semibold hover:bg-muted/80 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLesson}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition"
                >
                  Create Lesson
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
