import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  Volume1,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Play,
  Shuffle,
  Eye,
  EyeOff,
  GraduationCap,
  BrainCircuit,
  Pencil,
  Layers,
  Star,
  Clock,
  Target,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import { getLessonById, LESSONS, speakJapanese, type Lesson } from "@/data/japanese-learning-data";

// Progress storage
const PROGRESS_STORAGE_KEY = "japanese-learning-progress";

function loadProgress() {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

export const Route = createFileRoute("/student/learning/japanese/lesson/$lessonId")({
  component: LessonDetailPage,
});

type ViewMode = "learn" | "flashcard" | "quiz" | "writing" | "result";

interface QuizQuestion {
  char: string;
  romaji: string;
  options: string[];
  correctAnswer: string;
  type: "recognize" | "listen" | "type";
}

function generateQuiz(lesson: Lesson): QuizQuestion[] {
  const chars = [...lesson.characters].sort(() => Math.random() - 0.5);
  const questions: QuizQuestion[] = [];

  chars.forEach((char) => {
    // Recognition question
    const wrongOptions = lesson.characters
      .filter((c) => c.romaji !== char.romaji)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.romaji);

    questions.push({
      char: char.char,
      romaji: char.romaji,
      options: [char.romaji, ...wrongOptions].sort(() => Math.random() - 0.5),
      correctAnswer: char.romaji,
      type: "recognize",
    });
  });

  return questions.slice(0, lesson.quizCount || 10);
}

function LessonDetailPage() {
  const { lessonId } = Route.useParams();
  const navigate = useNavigate();
  const lesson = getLessonById(lessonId);

  const [viewMode, setViewMode] = useState<ViewMode>("learn");
  const [currentCharIdx, setCurrentCharIdx] = useState(0);
  const [showRomaji, setShowRomaji] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledChars, setShuffledChars] = useState<{ char: string; romaji: string }[]>([]);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState("");

  // Writing state
  const [showGuide, setShowGuide] = useState(true);

  // Load progress
  const [progress, setProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    if (lesson) {
      setShuffledChars([...lesson.characters].sort(() => Math.random() - 0.5));
      setQuizQuestions(generateQuiz(lesson));
    }
  }, [lesson]);

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 dark:text-indigo-200/60">Lesson not found</p>
          <Link
            to="/student/learning/japanese"
            className="text-primary hover:underline mt-2 inline-block"
          >
            Back to Learning
          </Link>
        </div>
      </div>
    );
  }

  const currentChar = lesson.characters[currentCharIdx];
  const lessonProgress = progress[lessonId];

  // Handle answer selection
  const handleAnswer = (answer: string) => {
    setQuizAnswer(answer);
    if (answer === quizQuestions[quizIdx].correctAnswer) {
      setQuizScore((s) => s + 1);
    }
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (quizIdx < quizQuestions.length - 1) {
      setQuizIdx((i) => i + 1);
      setQuizAnswer(null);
      setTypedAnswer("");
    } else {
      // Finish quiz
      const finalScore = Math.round(
        ((quizScore + (quizAnswer === quizQuestions[quizIdx].correctAnswer ? 1 : 0)) /
          quizQuestions.length) *
          100,
      );
      const newProgress = {
        ...progress,
        [lessonId]: {
          completed: true,
          score: finalScore,
          attempts: (lessonProgress?.attempts || 0) + 1,
          lastAttempt: new Date().toISOString(),
        },
      };
      saveProgress(newProgress);
      setProgress(newProgress);
      setQuizFinished(true);
      setViewMode("result");
    }
  };

  // Reset and start quiz
  const startQuiz = () => {
    setQuizQuestions(generateQuiz(lesson));
    setQuizIdx(0);
    setQuizAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setViewMode("quiz");
  };

  // Render different views
  const renderContent = () => {
    switch (viewMode) {
      case "learn":
        return renderLearnMode();
      case "flashcard":
        return renderFlashcardMode();
      case "quiz":
        return renderQuizMode();
      case "writing":
        return renderWritingMode();
      case "result":
        return renderResultMode();
      default:
        return renderLearnMode();
    }
  };

  // Learn Mode
  function renderLearnMode() {
    return (
      <div className="space-y-6">
        {/* Character Display */}
        <motion.div
          key={currentCharIdx}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 dark:bg-indigo-950/50 backdrop-blur-xl rounded-3xl p-8 text-center border border-slate-200/60 dark:border-white/20 shadow-xl"
        >
          <button
            onClick={() => speakJapanese(currentChar.char)}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 transition shadow-lg"
          >
            <Volume2 className="w-8 h-8" />
          </button>

          <div
            className="text-8xl md:text-9xl font-black text-slate-800 dark:text-white mb-4 select-none"
            style={{ fontFamily: "var(--font-japanese)" }}
          >
            {currentChar.char}
          </div>

          <AnimatePresence>
            {showRomaji && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-3xl font-bold text-primary mb-4"
              >
                {currentChar.romaji}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setShowRomaji(!showRomaji)}
            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-200/80 transition"
          >
            {showRomaji ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showRomaji ? "Hide" : "Show"} Romaji
          </button>
        </motion.div>

        {/* Progress */}
        <div className="bg-white/70 dark:bg-indigo-950/50 rounded-2xl p-4 border border-slate-200/60 dark:border-white/10">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-indigo-200/80">Progress</span>
            <span className="font-bold text-slate-800 dark:text-white">
              {currentCharIdx + 1} / {lesson.characters.length}
            </span>
          </div>
          <div className="h-2 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentCharIdx + 1) / lesson.characters.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentCharIdx > 0) {
                setCurrentCharIdx((i) => i - 1);
                setShowRomaji(false);
              }
            }}
            disabled={currentCharIdx === 0}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-bold hover:bg-white/90 disabled:opacity-30 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            onClick={() => speakJapanese(currentChar.char)}
            className="p-4 rounded-2xl bg-slate-100/60 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-200/60 transition"
          >
            <Volume1 className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (currentCharIdx < lesson.characters.length - 1) {
                setCurrentCharIdx((i) => i + 1);
                setShowRomaji(false);
              }
            }}
            disabled={currentCharIdx === lesson.characters.length - 1}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:opacity-90 disabled:opacity-30 transition"
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mini Test CTA */}
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10 rounded-2xl p-5 border border-amber-200/40 dark:border-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Ready for the Mini Test?</h3>
              <p className="text-sm text-slate-600 dark:text-indigo-200/60">
                Test what you've learned with {lesson.quizCount} questions
              </p>
            </div>
            <button
              onClick={startQuiz}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition"
            >
              <BrainCircuit className="w-5 h-5" />
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Flashcard Mode
  function renderFlashcardMode() {
    const shuffledIndex = shuffledChars.findIndex((c) => c.char === currentChar.char);

    return (
      <div className="space-y-6">
        <style>{`
          .perspective-1000 { perspective: 1000px; }
          .transform-style-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
          .rotate-y-180 { transform: rotateY(180deg); }
        `}</style>

        {/* Card Progress */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600 dark:text-indigo-200/80">
            Card{" "}
            <span className="font-bold text-slate-800 dark:text-white">{currentCharIdx + 1}</span>{" "}
            of <span className="text-slate-500">{lesson.characters.length}</span>
          </span>
          <span className="text-slate-600 dark:text-indigo-200/80">
            {Math.round(((currentCharIdx + 1) / lesson.characters.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentCharIdx + 1) / lesson.characters.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
          />
        </div>

        {/* Flashcard */}
        <div className="relative h-[350px] perspective-1000">
          <motion.div
            onClick={() => setIsFlipped(!isFlipped)}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-full transform-style-3d cursor-pointer"
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden rounded-3xl bg-white/90 dark:bg-indigo-950/60 backdrop-blur-xl border border-slate-200/60 dark:border-white/20 shadow-2xl flex flex-col items-center justify-center p-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-indigo-200/60 mb-4">
                Character
              </span>
              <div
                className="text-7xl font-black text-slate-800 dark:text-white"
                style={{ fontFamily: "var(--font-japanese)" }}
              >
                {currentChar.char}
              </div>
              <div className="mt-6 text-xs text-slate-500 dark:text-indigo-200/50">
                Click to flip
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl bg-gradient-to-br from-pink-500/90 to-purple-600/90 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col items-center justify-center p-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-4">
                Romaji
              </span>
              <div className="text-5xl font-black text-white">{currentChar.romaji}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakJapanese(currentChar.char);
                }}
                className="mt-6 p-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentCharIdx > 0) {
                setCurrentCharIdx((i) => i - 1);
                setIsFlipped(false);
              }
            }}
            disabled={currentCharIdx === 0}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-bold disabled:opacity-30 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            onClick={() => {
              setShuffledChars([...lesson.characters].sort(() => Math.random() - 0.5));
              setCurrentCharIdx(0);
              setIsFlipped(false);
            }}
            className="p-4 rounded-2xl bg-slate-100/60 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-200/60 transition"
          >
            <Shuffle className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (currentCharIdx < lesson.characters.length - 1) {
                setCurrentCharIdx((i) => i + 1);
                setIsFlipped(false);
              }
            }}
            disabled={currentCharIdx === lesson.characters.length - 1}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold disabled:opacity-30 transition"
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="hidden sm:flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-indigo-200/50 font-medium">
          <span>← → Navigate</span>
          <span>Space Flip</span>
          <span>V Pronounce</span>
        </div>
      </div>
    );
  }

  // Quiz Mode
  function renderQuizMode() {
    if (quizFinished) {
      return renderResultMode();
    }

    const question = quizQuestions[quizIdx];

    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600 dark:text-indigo-200/80">
            Question <span className="font-bold text-slate-800 dark:text-white">{quizIdx + 1}</span>{" "}
            of <span className="text-slate-500">{quizQuestions.length}</span>
          </span>
          <span className="text-slate-800 dark:text-white font-bold">Score: {quizScore}</span>
        </div>
        <div className="h-2 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${((quizIdx + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <motion.div
          key={quizIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-indigo-950/50 backdrop-blur-xl rounded-3xl p-8 text-center border border-slate-200/60 dark:border-white/20 shadow-xl"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-indigo-200/60 mb-4">
            What is the romaji for?
          </div>

          <button
            onClick={() => speakJapanese(question.char)}
            className="mb-4 p-3 rounded-xl bg-slate-100/80 dark:bg-white/10 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-200/80 transition inline-flex"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          <div
            className="text-7xl md:text-8xl font-black text-slate-800 dark:text-white select-none"
            style={{ fontFamily: "var(--font-japanese)" }}
          >
            {question.char}
          </div>
        </motion.div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {question.options.map((option) => {
            const isSelected = quizAnswer === option;
            const isCorrect = option === question.correctAnswer;
            const showCorrect = quizAnswer !== null && isCorrect;
            const showIncorrect = quizAnswer !== null && isSelected && !isCorrect;

            let btnStyle =
              "bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white hover:bg-white/90";
            if (showCorrect) {
              btnStyle = "bg-green-500/20 border-green-500/40 text-green-600 dark:text-green-300";
            } else if (showIncorrect) {
              btnStyle = "bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-300";
            } else if (quizAnswer !== null) {
              btnStyle = "bg-slate-100/50 dark:bg-white/5 text-slate-400 cursor-default";
            }

            return (
              <button
                key={option}
                onClick={() => !quizAnswer && handleAnswer(option)}
                disabled={quizAnswer !== null}
                className={cn(
                  "py-4 px-4 rounded-2xl border font-bold text-center transition-all text-sm",
                  btnStyle,
                )}
              >
                {option}
                {showCorrect && <CheckCircle2 className="w-5 h-5 inline ml-2" />}
                {showIncorrect && <XCircle className="w-5 h-5 inline ml-2" />}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        {quizAnswer && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={handleNextQuestion}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:opacity-90 transition"
            >
              {quizIdx < quizQuestions.length - 1 ? "Next Question" : "See Results"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Type Answer Option */}
        {quizAnswer === null && (
          <div className="mt-4">
            <input
              type="text"
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && typedAnswer.trim()) {
                  handleAnswer(typedAnswer.trim().toLowerCase());
                }
              }}
              placeholder="Type the romaji..."
              className="w-full px-4 py-3 rounded-xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white text-center font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-primary/40"
            />
            {typedAnswer && (
              <button
                onClick={() => handleAnswer(typedAnswer.toLowerCase())}
                className="w-full mt-2 py-2 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary hover:text-white transition text-sm"
              >
                Submit Answer
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Result Mode
  function renderResultMode() {
    const finalScore = Math.round((quizScore / quizQuestions.length) * 100);
    const passed = finalScore >= 70;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div
          className={cn(
            "w-24 h-24 rounded-full mx-auto flex items-center justify-center shadow-2xl",
            passed
              ? "bg-gradient-to-br from-green-400 to-emerald-500"
              : "bg-gradient-to-br from-amber-400 to-orange-500",
          )}
        >
          <Trophy className="w-12 h-12 text-white" />
        </div>

        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
            {passed ? "Great Job!" : "Keep Practicing!"}
          </h2>
          <p className="text-slate-600 dark:text-indigo-200/60">
            You scored <span className="font-bold text-primary">{finalScore}%</span>
          </p>
        </div>

        <div className="bg-white/80 dark:bg-indigo-950/50 rounded-3xl p-6 border border-slate-200/60 dark:border-white/20 max-w-sm mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-600 dark:text-indigo-200/80">Correct Answers</span>
            <span className="text-2xl font-black text-green-500">{quizScore}</span>
          </div>
          <div className="h-3 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                passed
                  ? "bg-gradient-to-r from-green-400 to-emerald-500"
                  : "bg-gradient-to-r from-amber-400 to-orange-500",
              )}
              style={{ width: `${finalScore}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3 max-w-sm mx-auto">
          <button
            onClick={() => {
              setQuizIdx(0);
              setQuizAnswer(null);
              setQuizScore(0);
              setQuizFinished(false);
              setViewMode("quiz");
            }}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-bold hover:bg-white/90 transition"
          >
            <RotateCcw className="w-5 h-5" />
            Retry
          </button>
          <button
            onClick={() => navigate({ to: "/student/learning/japanese" })}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:opacity-90 transition"
          >
            Back to Lessons
          </button>
        </div>
      </motion.div>
    );
  }

  // Writing Mode
  function renderWritingMode() {
    return (
      <div className="space-y-6">
        <div className="bg-white/80 dark:bg-indigo-950/50 rounded-3xl p-6 border border-slate-200/60 dark:border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white">Practice Writing</h3>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition",
                showGuide
                  ? "bg-primary/10 text-primary"
                  : "bg-slate-100/60 dark:bg-white/10 text-slate-600 dark:text-indigo-200/80",
              )}
            >
              {showGuide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showGuide ? "Hide" : "Show"} Guide
            </button>
          </div>

          <div className="relative">
            {/* Guide Character */}
            {showGuide && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <span
                  className="text-[200px] font-black text-slate-800 dark:text-white select-none"
                  style={{ fontFamily: "var(--font-japanese)" }}
                >
                  {currentChar.char}
                </span>
              </div>
            )}

            {/* Canvas for writing */}
            <DrawingCanvas character={currentChar.char} />
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => speakJapanese(currentChar.char)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-white/10 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-200/80 transition"
            >
              <Volume2 className="w-4 h-4" />
              Listen
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (currentCharIdx > 0) {
                setCurrentCharIdx((i) => i - 1);
              }
            }}
            disabled={currentCharIdx === 0}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-bold disabled:opacity-30 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>
          <button
            onClick={() => {
              if (currentCharIdx < lesson.characters.length - 1) {
                setCurrentCharIdx((i) => i + 1);
              }
            }}
            disabled={currentCharIdx === lesson.characters.length - 1}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold disabled:opacity-30 transition"
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center">
          <div
            className="text-4xl font-black text-slate-800 dark:text-white"
            style={{ fontFamily: "var(--font-japanese)" }}
          >
            {currentChar.char}
          </div>
          <div className="text-lg text-slate-500 dark:text-indigo-200/60">{currentChar.romaji}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SakuraBg count={15} />
      <div className="relative z-10">
        <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                to="/student/learning/japanese"
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white">
                  {lesson.title}
                </h1>
                <p className="text-xs text-slate-500 dark:text-indigo-200/60">
                  {lesson.characters.length} characters
                </p>
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: "learn" as ViewMode, icon: GraduationCap, label: "Learn" },
              { id: "flashcard" as ViewMode, icon: Layers, label: "Flashcards" },
              { id: "quiz" as ViewMode, icon: BrainCircuit, label: "Quiz" },
              { id: "writing" as ViewMode, icon: Pencil, label: "Writing" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setViewMode(mode.id);
                  setIsFlipped(false);
                  setQuizAnswer(null);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  viewMode === mode.id
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                    : "bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-indigo-200 hover:bg-white/90",
                )}
              >
                <mode.icon className="w-4 h-4" />
                {mode.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Drawing Canvas Component
function DrawingCanvas({ character }: { character: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const coords = getCoordinates(e);
      setIsDrawing(true);
      setCurrentPath([coords]);
    },
    [getCoordinates],
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;

      const coords = getCoordinates(e);

      ctx.beginPath();
      ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      setCurrentPath((prev) => [...prev, coords]);
    },
    [isDrawing, currentPath, getCoordinates],
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing && currentPath.length > 0) {
      setPaths((prev) => [...prev, currentPath]);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  }, [isDrawing, currentPath]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPaths([]);
    setCurrentPath([]);
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={300}
        height={300}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full aspect-square bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/20 touch-none"
      />
      <button
        onClick={clearCanvas}
        className="absolute top-2 right-2 p-2 rounded-xl bg-white/80 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-500 hover:text-red-500 transition"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
}
