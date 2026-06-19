import { useState, useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  BrainCircuit,
  GraduationCap,
  Layers,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { speakJapanese } from "@/data/japanese-learning-data";
import { katakanaLoanwordsLesson, type LoanWord } from "@/mock/alphabet/katakanaLoanwords";

interface LoanWordLessonData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  totalCharacters: number;
  difficulty: number;
  estimatedTime: number;
  loanwords: LoanWord[];
  color: string;
}

export const Route = createFileRoute("/student/learning/alphabet/katakana/loanwords")({
  component: KatakanaLoanwordsPage,
});

function KatakanaLoanwordsPage() {
  const lesson: LoanWordLessonData = katakanaLoanwordsLesson;

  const [viewMode, setViewMode] = useState<"learn" | "quiz">("learn");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);

  // Progress state
  const [progress, setProgress] = useState({
    completed: false,
    score: 0,
    attempts: 0,
    wordsLearned: [] as string[],
  });

  // Load progress
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem("alphabet-progress-katakana-loanwords");
      if (saved) {
        setProgress(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load progress:", e);
    }
  }, []);

  // Save progress
  const saveProgress = (newProgress: typeof progress) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("alphabet-progress-katakana-loanwords", JSON.stringify(newProgress));
    } catch (e) {
      console.error("Failed to save progress:", e);
    }
    setProgress(newProgress);
  };

  if (!lesson || !lesson.loanwords || lesson.loanwords.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 dark:text-indigo-200/60">Lesson not found</p>
          <Link to="/student/learning/alphabet" className="text-primary hover:underline mt-2 inline-block">
            Back to Alphabet
          </Link>
        </div>
      </div>
    );
  }

  const currentWord = lesson.loanwords[currentIdx];

  // Learn Mode
  const renderLearnMode = () => (
    <div className="space-y-6">
      {/* Word Display */}
      <motion.div
        key={currentIdx}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 dark:bg-indigo-950/50 backdrop-blur-xl rounded-3xl p-8 text-center border border-slate-200/60 dark:border-white/20 shadow-xl"
      >
        <button
          onClick={() => speakJapanese(currentWord.word)}
          className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition shadow-lg"
        >
          <Volume2 className="w-8 h-8" />
        </button>

        <div
          className="text-6xl md:text-7xl font-black text-slate-800 dark:text-white mb-4 select-none"
          style={{ fontFamily: "var(--font-japanese)" }}
        >
          {currentWord.word}
        </div>

        <AnimatePresence>
          {showAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              <div className="text-2xl font-bold text-primary">
                {currentWord.romaji}
              </div>
              <div className="text-lg text-slate-600 dark:text-indigo-200/80">
                {currentWord.meaning}
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100/80 dark:bg-white/10 text-sm text-muted-foreground">
                {currentWord.category}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="mt-6 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-200/80 transition"
        >
          {showAnswer ? "Hide" : "Show"} Answer
        </button>
      </motion.div>

      {/* Progress */}
      <div className="bg-white/70 dark:bg-indigo-950/50 rounded-2xl p-4 border border-slate-200/60 dark:border-white/10">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600 dark:text-indigo-200/80">Progress</span>
          <span className="font-bold text-slate-800 dark:text-white">
            {currentIdx + 1} / {lesson.loanwords.length}
          </span>
        </div>
        <div className="h-2 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIdx + 1) / lesson.loanwords.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (currentIdx > 0) {
              setCurrentIdx((i) => i - 1);
              setShowAnswer(false);
            }
          }}
          disabled={currentIdx === 0}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-bold hover:bg-white/90 disabled:opacity-30 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={() => {
            if (currentIdx < lesson.loanwords.length - 1) {
              setCurrentIdx((i) => i + 1);
              setShowAnswer(false);
            }
          }}
          disabled={currentIdx === lesson.loanwords.length - 1}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 disabled:opacity-30 transition"
        >
          Next
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Mark as learned */}
      <Button
        onClick={() => {
          if (!progress.wordsLearned.includes(currentWord.id)) {
            saveProgress({
              ...progress,
              wordsLearned: [...progress.wordsLearned, currentWord.id],
            });
          }
        }}
        variant={progress.wordsLearned.includes(currentWord.id) ? "secondary" : "default"}
        className="w-full"
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        {progress.wordsLearned.includes(currentWord.id) ? "Learned!" : "Mark as Learned"}
      </Button>

      {/* Quiz CTA */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10 rounded-2xl p-5 border border-amber-200/40 dark:border-amber-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Ready for the Quiz?</h3>
            <p className="text-sm text-slate-600 dark:text-indigo-200/60">
              Test your knowledge with {lesson.loanwords.length} questions
            </p>
          </div>
          <button
            onClick={() => setViewMode("quiz")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition"
          >
            <BrainCircuit className="w-5 h-5" />
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );

  // Quiz Mode
  const renderQuizMode = () => {
    if (quizFinished) {
      const percentage = Math.round((quizScore / lesson.loanwords.length) * 100);
      const passed = percentage >= 70;

      return (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 dark:bg-indigo-950/50 backdrop-blur-xl rounded-3xl p-8 text-center border border-slate-200/60 dark:border-white/20 shadow-xl"
          >
            {passed ? (
              <CheckCircle2 className="w-20 h-20 mx-auto text-green-500 mb-4" />
            ) : (
              <XCircle className="w-20 h-20 mx-auto text-red-500 mb-4" />
            )}

            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
              {passed ? "Congratulations!" : "Keep Practicing!"}
            </h2>

            <div className="text-6xl font-black text-primary mb-4">{percentage}%</div>

            <p className="text-slate-600 dark:text-indigo-200/80 mb-6">
              You got {quizScore} out of {lesson.loanwords.length} correct.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setViewMode("learn");
                  setQuizFinished(false);
                }}
                className="flex-1 py-4 rounded-2xl bg-slate-100/80 dark:bg-white/10 text-slate-700 dark:text-white font-bold hover:bg-slate-200/80 transition"
              >
                Review Words
              </button>
              <button
                onClick={() => {
                  setQuizScore(0);
                  setQuizAnswer(null);
                  setQuizFinished(false);
                  setCurrentIdx(0);
                }}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    const word = lesson.loanwords[currentIdx];

    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600 dark:text-indigo-200/80">
            Question <span className="font-bold text-slate-800 dark:text-white">{currentIdx + 1}</span> of{" "}
            <span className="text-slate-500">{lesson.loanwords.length}</span>
          </span>
          <span className="text-slate-800 dark:text-white font-bold">Score: {quizScore}</span>
        </div>
        <div className="h-2 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / lesson.loanwords.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/80 dark:bg-indigo-950/50 backdrop-blur-xl rounded-3xl p-8 text-center border border-slate-200/60 dark:border-white/20 shadow-xl"
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-indigo-200/60 mb-4">
            What does this word mean?
          </div>

          <button
            onClick={() => speakJapanese(word.word)}
            className="mb-4 p-3 rounded-xl bg-slate-100/80 dark:bg-white/10 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-200/80 transition inline-flex"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          <div
            className="text-5xl md:text-6xl font-black text-slate-800 dark:text-white select-none mb-4"
            style={{ fontFamily: "var(--font-japanese)" }}
          >
            {word.word}
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-slate-100/80 dark:bg-white/10 text-sm text-muted-foreground mb-4">
            {word.category}
          </div>
        </motion.div>

        {/* Answer Options */}
        <div className="space-y-2">
          <button
            onClick={() => {
              if (!quizAnswer) {
                setQuizAnswer(word.meaning);
                if (word.meaning === word.meaning) setQuizScore((s) => s + 1);
              }
            }}
            disabled={!!quizAnswer}
            className={cn(
              "w-full p-4 rounded-xl text-left font-medium transition-all",
              quizAnswer
                ? "bg-green-500/20 border-2 border-green-500 text-green-700 dark:text-green-300"
                : "bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100/80"
            )}
          >
            {word.meaning}
          </button>

          {/* Wrong answers for display */}
          {quizAnswer && quizAnswer !== word.meaning && (
            <div className="p-4 rounded-xl bg-red-500/20 border-2 border-red-500 text-left font-medium text-red-700 dark:text-red-300">
              {quizAnswer}
            </div>
          )}
        </div>

        {/* Next Button */}
        {quizAnswer && (
          <button
            onClick={() => {
              if (currentIdx < lesson.loanwords.length - 1) {
                setCurrentIdx((i) => i + 1);
                setQuizAnswer(null);
              } else {
                setQuizFinished(true);
                const finalScore = quizScore;
                saveProgress({
                  ...progress,
                  completed: Math.round((finalScore / lesson.loanwords.length) * 100) >= 70,
                  score: Math.max(
                    progress.score,
                    Math.round((finalScore / lesson.loanwords.length) * 100)
                  ),
                  attempts: progress.attempts + 1,
                });
              }
            }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition"
          >
            {currentIdx < lesson.loanwords.length - 1 ? "Next Question" : "See Results"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <SakuraBg count={15} />
      <div className="relative z-10">
        <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                to="/student/learning/alphabet/katakana"
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white">{lesson.title}</h1>
                <p className="text-xs text-slate-500 dark:text-indigo-200/60">
                  {lesson.loanwords.length} words
                  {progress.attempts > 0 && ` • Best: ${progress.score}%`}
                </p>
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: "learn" as const, icon: GraduationCap, label: "Learn" },
              { id: "quiz" as const, icon: BrainCircuit, label: "Quiz" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setViewMode(mode.id);
                  setQuizAnswer(null);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  viewMode === mode.id
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                    : "bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-indigo-200 hover:bg-white/90"
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
              {viewMode === "learn" && renderLearnMode()}
              {viewMode === "quiz" && renderQuizMode()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
