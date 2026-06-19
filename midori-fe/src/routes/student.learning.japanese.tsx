import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Volume2,
  BrainCircuit,
  Pencil,
  Zap,
  Target,
  Play,
  Volume1,
  Shuffle,
  RotateCcw,
  ArrowRight,
  Clock,
  GraduationCap,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import {
  LESSONS,
  type Lesson,
  type UserProgress,
  INITIAL_PROGRESS,
  speakJapanese,
  getLessonById,
} from "@/data/japanese-learning-data";
import { useRouterState } from "@tanstack/react-router";

// Progress storage key
const PROGRESS_STORAGE_KEY = "japanese-learning-progress";

// Load progress from localStorage
function loadProgress(): UserProgress {
  if (typeof window === "undefined") return INITIAL_PROGRESS;
  try {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load progress:", e);
  }
  return INITIAL_PROGRESS;
}

// Save progress to localStorage
function saveProgress(progress: UserProgress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save progress:", e);
  }
}

export const Route = createFileRoute("/student/learning/japanese")({
  component: JapaneseLearningPage,
});

type TabType = "lessons" | "practice" | "quizzes";

function JapaneseLearningPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("lessons");
  const [progress, setProgress] = useState<UserProgress>(INITIAL_PROGRESS);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showLessonDetail, setShowLessonDetail] = useState(false);

  // Load progress on mount
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  // Save progress when it changes
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Calculate stats
  const completedLessons = Object.values(progress.lessonProgress).filter((p) => p.completed).length;
  const totalLessons = LESSONS.length;
  const progressPercentage = Math.round((completedLessons / totalLessons) * 100);

  // Get current lesson type for tab display
  const routerState = useRouterState();
  const isChildRouteActive = routerState.location.pathname !== "/student/learning/japanese";

  if (isChildRouteActive) {
    return null;
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "lessons":
        return <LessonsTab lessons={LESSONS} progress={progress} onSelectLesson={setSelectedLesson} onStartLesson={(lesson) => navigate({ to: `/student/learning/japanese/lesson/${lesson.id}` })} />;
      case "practice":
        return <PracticeTab lessons={LESSONS} progress={progress} onSelectLesson={setSelectedLesson} />;
      case "quizzes":
        return <QuizzesTab lessons={LESSONS} progress={progress} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <SakuraBg count={20} />
      <div className="relative z-10">
        {/* Header */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                to="/student/learning/alphabet"
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 dark:hover:bg-white/20 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-display font-black text-slate-800 dark:text-white">Japanese Writing</h1>
                <p className="text-sm text-slate-500 dark:text-indigo-200/60">Master Hiragana & Katakana</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: "lessons" as TabType, icon: BookOpen, label: "Lessons" },
              { id: "practice" as TabType, icon: Pencil, label: "Practice" },
              { id: "quizzes" as TabType, icon: BrainCircuit, label: "Quizzes" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                    : "bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-indigo-200 hover:bg-white/90 dark:hover:bg-white/20"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Lesson Detail Modal */}
      <AnimatePresence>
        {showLessonDetail && selectedLesson && (
          <LessonDetailModal
            lesson={selectedLesson}
            progress={progress.lessonProgress[selectedLesson.id]}
            onClose={() => setShowLessonDetail(false)}
            onStartLesson={() => {
              setShowLessonDetail(false);
              navigate({ to: `/student/learning/japanese/lesson/${selectedLesson.id}` });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ LESSONS TAB ============
function LessonsTab({
  lessons,
  progress,
  onSelectLesson,
  onStartLesson,
}: {
  lessons: Lesson[];
  progress: UserProgress;
  onSelectLesson: (lesson: Lesson) => void;
  onStartLesson: (lesson: Lesson) => void;
}) {
  const [filter, setFilter] = useState<"all" | "hiragana" | "katakana">("all");

  const filteredLessons = filter === "all" ? lessons : lessons.filter((l) => l.script === filter);

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return "text-green-500 bg-green-500/10 border-green-500/20";
      case 2: return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case 3: return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case 4: return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case 5: return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2">
        {[
          { id: "all" as const, label: "All", count: lessons.length },
          { id: "hiragana" as const, label: "Hiragana", count: lessons.filter((l) => l.script === "hiragana").length },
          { id: "katakana" as const, label: "Katakana", count: lessons.filter((l) => l.script === "katakana").length },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              filter === f.id
                ? "bg-primary text-white"
                : "bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-indigo-200 hover:bg-white/90"
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Lessons Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredLessons.map((lesson, index) => {
          const isCompleted = progress.lessonProgress[lesson.id]?.completed;
          const lessonProgress = progress.lessonProgress[lesson.id];

          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "group bg-white/80 dark:bg-indigo-950/40 backdrop-blur-sm rounded-2xl p-5 border transition-all cursor-pointer",
                isCompleted
                  ? "border-green-300 dark:border-green-500/30 hover:shadow-lg hover:shadow-green-500/10"
                  : "border-slate-200/60 dark:border-white/10 hover:shadow-lg hover:-translate-y-1"
              )}
              onClick={() => onSelectLesson(lesson)}
            >
              <div className="flex items-start gap-4">
                <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl font-bold text-white shadow-lg", lesson.color)}>
                  {lesson.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors truncate">{lesson.title}</h3>
                    {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-indigo-200/60">{lesson.subtitle}</p>

                  {/* Meta info */}
                  <div className="flex items-center gap-3 mt-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", getDifficultyColor(lesson.difficulty))}>
                      Level {lesson.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-indigo-200/60">
                      <Clock className="w-3 h-3" />
                      {lesson.estimatedTime} min
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-indigo-200/60">
                      <Target className="w-3 h-3" />
                      {lesson.characters.length} chars
                    </span>
                  </div>

                  {/* Progress bar */}
                  {lessonProgress && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${lessonProgress.score}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-indigo-200/60 mt-1">
                        Best score: {lessonProgress.score}% ({lessonProgress.attempts} attempts)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartLesson(lesson);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-sm font-semibold"
                >
                  <Play className="w-4 h-4" />
                  {isCompleted ? "Review" : "Start"}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakJapanese(lesson.characters[0]?.char || "");
                  }}
                  className="p-2 rounded-xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/40 dark:border-white/10 text-slate-500 dark:text-indigo-200/60 hover:bg-slate-200/60 transition-all"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============ PRACTICE TAB ============
function PracticeTab({
  lessons,
  progress,
  onSelectLesson,
}: {
  lessons: Lesson[];
  progress: UserProgress;
  onSelectLesson: (lesson: Lesson) => void;
}) {
  const practiceModes = [
    {
      id: "writing",
      title: "Writing Practice",
      description: "Practice writing characters",
      icon: Pencil,
      color: "from-emerald-400 to-teal-500",
      link: "/student/learning/japanese/writing",
    },
    {
      id: "listening",
      title: "Listening Practice",
      description: "Train your ear",
      icon: Volume1,
      color: "from-blue-400 to-cyan-500",
      link: "/student/learning/japanese/listening",
    },
    {
      id: "speed",
      title: "Speed Challenge",
      description: "Test your recognition speed",
      icon: Zap,
      color: "from-amber-400 to-orange-500",
      link: "/student/learning/japanese/speed-challenge",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Practice Modes Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {practiceModes.map((mode, index) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={mode.link as any}
              className="group block bg-white/80 dark:bg-indigo-950/40 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg", mode.color)}>
                  <mode.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-primary transition-colors">{mode.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-indigo-200/60">{mode.description}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Character Sets */}
      <div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Character Sets to Practice</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "あ行", chars: "あいうえお", script: "hiragana" },
            { label: "か行", chars: "かきくけこ", script: "hiragana" },
            { label: "ア行", chars: "アイウエオ", script: "katakana" },
            { label: "カ行", chars: "カキクケコ", script: "katakana" },
            { label: "が行", chars: "がぎぐげご", script: "hiragana" },
            { label: "キャ", chars: "きゃきゅきょ", script: "hiragana" },
            { label: "ガ行", chars: "ガギグゲゴ", script: "katakana" },
            { label: "キャ", chars: "キャキュキョ", script: "katakana" },
          ].map((set) => (
            <Link
              key={set.label}
              to="/student/learning/japanese/writing"
              className="group bg-white/60 dark:bg-white/5 rounded-xl p-4 border border-slate-200/60 dark:border-white/10 hover:bg-white/80 hover:shadow-lg transition-all"
            >
              <div className="text-center">
                <span className="text-2xl font-bold text-slate-700 dark:text-white tracking-wider" style={{ fontFamily: "var(--font-japanese)" }}>
                  {set.chars}
                </span>
                <p className="text-xs text-slate-500 dark:text-indigo-200/60 mt-2">{set.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ QUIZZES TAB ============
function QuizzesTab({ lessons, progress }: { lessons: Lesson[]; progress: UserProgress }) {
  const quizTypes = [
    {
      id: "recognition",
      title: "Recognition Quiz",
      description: "Identify characters by romaji",
      icon: Target,
      color: "from-pink-400 to-rose-500",
      questionCount: 10,
    },
    {
      id: "listening",
      title: "Listening Quiz",
      description: "Listen and identify characters",
      icon: Volume2,
      color: "from-blue-400 to-cyan-500",
      questionCount: 10,
    },
    {
      id: "matching",
      title: "Matching Quiz",
      description: "Match characters to meanings",
      icon: Layers,
      color: "from-purple-400 to-violet-500",
      questionCount: 8,
    },
    {
      id: "wordbuilding",
      title: "Word Building",
      description: "Build words from characters",
      icon: Pencil,
      color: "from-emerald-400 to-teal-500",
      questionCount: 8,
    },
    {
      id: "fillblank",
      title: "Fill in the Blank",
      description: "Complete missing characters",
      icon: BookOpen,
      color: "from-amber-400 to-orange-500",
      questionCount: 10,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quiz Types */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quizTypes.map((quiz, index) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={`/student/learning/japanese/quiz/${quiz.id}` as any}
              className="group block bg-white/80 dark:bg-indigo-950/40 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", quiz.color)}>
                  <quiz.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{quiz.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-indigo-200/60">{quiz.questionCount} questions</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-indigo-200/80">{quiz.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-primary font-semibold">Start Quiz →</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Quiz Results */}
      <div className="bg-white/70 dark:bg-indigo-950/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/60 dark:border-white/10">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Recent Quiz Results
        </h3>
        {Object.entries(progress.lessonProgress).filter(([_, p]) => p.attempts > 0).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(progress.lessonProgress)
              .filter(([_, p]) => p.attempts > 0)
              .slice(0, 5)
              .map(([lessonId, data]) => {
                const lesson = getLessonById(lessonId);
                return (
                  <div key={lessonId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/40 dark:border-white/10">
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg", lesson?.color)}>
                      {lesson?.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 dark:text-white text-sm">{lesson?.title}</div>
                      <div className="text-xs text-slate-500 dark:text-indigo-200/60">{data.attempts} attempts</div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "text-lg font-black",
                        data.score >= 80 ? "text-green-500" : data.score >= 60 ? "text-amber-500" : "text-red-500"
                      )}>
                        {data.score}%
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-indigo-200/60">
            <BrainCircuit className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No quiz results yet. Start a quiz to see your progress!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ LESSON DETAIL MODAL ============
function LessonDetailModal({
  lesson,
  progress,
  onClose,
  onStartLesson,
}: {
  lesson: Lesson;
  progress?: { completed: boolean; score: number; attempts: number; lastAttempt: string };
  onClose: () => void;
  onStartLesson: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white/90 dark:bg-indigo-950/90 backdrop-blur-xl rounded-3xl p-6 max-w-lg w-full border border-slate-200/60 dark:border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl font-bold text-white shadow-lg", lesson.color)}>
            {lesson.icon}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-800 dark:text-white">{lesson.title}</h2>
            <p className="text-sm text-slate-500 dark:text-indigo-200/60">{lesson.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition"
          >
            ×
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 dark:text-indigo-200/80 mb-4">{lesson.description}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <span className="flex items-center gap-1 text-slate-500 dark:text-indigo-200/60">
            <Clock className="w-4 h-4" /> {lesson.estimatedTime} min
          </span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-indigo-200/60">
            <Target className="w-4 h-4" /> {lesson.characters.length} characters
          </span>
          <span className="flex items-center gap-1 text-slate-500 dark:text-indigo-200/60">
            <BrainCircuit className="w-4 h-4" /> {lesson.quizCount} quiz questions
          </span>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mb-4 p-3 rounded-xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/40 dark:border-white/10">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600 dark:text-indigo-200/80">Best Score</span>
              <span className="font-bold text-slate-800 dark:text-white">{progress.score}%</span>
            </div>
            <div className="h-2 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                style={{ width: `${progress.score}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-indigo-200/60 mt-1">{progress.attempts} attempts</p>
          </div>
        )}

        {/* Character Preview Toggle */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/40 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-indigo-200/80 hover:bg-slate-200/60 transition mb-4"
        >
          <span>{showPreview ? "Hide" : "Show"} Character Preview</span>
          <ChevronRight className={cn("w-4 h-4 transition-transform", showPreview && "rotate-90")} />
        </button>

        {showPreview && (
          <div className="grid grid-cols-6 gap-2 mb-4 max-h-40 overflow-y-auto">
            {lesson.characters.map((char) => (
              <button
                key={char.char}
                onClick={() => speakJapanese(char.char)}
                className="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-slate-200/40 dark:border-white/10 hover:bg-slate-100/60 dark:hover:bg-white/10 transition"
              >
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-japanese)" }}>
                    {char.char}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-indigo-200/60">{char.romaji}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to={`/student/learning/japanese/lesson/${lesson.id}` as any}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:opacity-90 transition"
          >
            <Play className="w-5 h-5" />
            {progress?.completed ? "Review Lesson" : "Start Lesson"}
          </Link>
          <Link
            to={`/student/learning/japanese/quiz/recognition?lesson=${lesson.id}` as any}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100/60 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-bold hover:bg-slate-200/60 transition"
          >
            <BrainCircuit className="w-5 h-5" />
            Take Quiz
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
