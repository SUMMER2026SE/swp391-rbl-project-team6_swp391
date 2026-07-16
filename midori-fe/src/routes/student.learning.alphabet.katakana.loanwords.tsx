import { useState, useEffect, useMemo } from "react";
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
  Sparkles,
  Clock,
  BookOpen,
  Star
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

type ViewMode = "learn" | "quiz";

function KatakanaLoanwordsPage() {
  const lesson: LoanWordLessonData = katakanaLoanwordsLesson;

  const [viewMode, setViewMode] = useState<ViewMode>("learn");
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
          <Link
            to="/student/learning/alphabet"
            className="text-primary hover:underline mt-2 inline-block"
          >
            Back to Alphabet
          </Link>
        </div>
      </div>
    );
  }

  const currentWord = useMemo(() => {
    return lesson.loanwords[currentIdx] || lesson.loanwords[0];
  }, [lesson, currentIdx]);

  const quizOptions = useMemo(() => {
    if (!currentWord) return [];
    const wrongOptions = lesson.loanwords
      .filter((w) => w.meaning !== currentWord.meaning)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.meaning);
    return [currentWord.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);
  }, [currentWord, lesson.loanwords]);

  // Mark word as learned
  const toggleWordLearned = () => {
    const isLearned = progress.wordsLearned.includes(currentWord.id);
    let updatedLearned = [...progress.wordsLearned];
    if (isLearned) {
      updatedLearned = updatedLearned.filter((id) => id !== currentWord.id);
    } else {
      updatedLearned.push(currentWord.id);
    }
    const newProgress = {
      ...progress,
      wordsLearned: updatedLearned,
    };
    saveProgress(newProgress);
  };

  const progressPercent = Math.round((progress.wordsLearned.length / lesson.loanwords.length) * 100);

  // Handle quiz next
  const handleQuizNext = () => {
    if (currentIdx < lesson.loanwords.length - 1) {
      setCurrentIdx((i) => i + 1);
      setQuizAnswer(null);
    } else {
      setQuizFinished(true);
      const finalScore = Math.round(
        ((quizScore + (quizAnswer === currentWord.meaning ? 1 : 0)) / lesson.loanwords.length) * 100
      );
      saveProgress({
        ...progress,
        completed: finalScore >= 70,
        score: Math.max(progress.score, finalScore),
        attempts: progress.attempts + 1,
      });
    }
  };

  const startQuiz = () => {
    setQuizScore(0);
    setQuizAnswer(null);
    setQuizFinished(false);
    setCurrentIdx(0);
    setViewMode("quiz");
  };

  // Learn Mode
  const renderLearnMode = () => (
    <div className="space-y-6">
      {/* Word Card */}
      <motion.div
        key={currentIdx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/60 dark:border-white/10 flex flex-col md:flex-row items-center p-6 md:p-8 gap-6 md:gap-8 bg-white dark:bg-slate-900"
        style={{ minHeight: "320px" }}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 opacity-15 dark:opacity-25" 
          style={{ backgroundImage: `url('/images/cherry_blossom_bg.png')` }}
        />
        <div className="absolute inset-0 bg-linear-to-r from-white/95 to-white/70 dark:from-slate-900/95 dark:to-slate-900/70 z-0" />
        
        {/* Left: Large Word display */}
        <div className="relative z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/50 dark:border-white/10 w-full md:w-56 aspect-square shrink-0 shadow-xs">
          <div 
            className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white select-none text-center leading-tight break-all"
            style={{ fontFamily: "var(--font-japanese)" }}
          >
            {currentWord.word}
          </div>
          
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => speakJapanese(currentWord.word)}
              className="w-9 h-9 rounded-xl bg-primary text-white hover:opacity-90 transition flex items-center justify-center shadow-md shadow-primary/20 cursor-pointer"
              title="Nghe phát âm"
            >
              <Volume2 className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition text-xs font-bold cursor-pointer"
            >
              {showAnswer ? "Hide Details" : "Show Details"}
            </button>
          </div>
        </div>
        
        {/* Right: Word Info */}
        <div className="relative z-10 flex-1 space-y-4 text-left w-full">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20">
                {currentIdx + 1} / {lesson.loanwords.length}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                {currentWord.category}
              </span>
            </div>
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
              {currentWord.word}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-bold">
              Romaji: <span className="text-slate-700 dark:text-slate-200 font-black">"{currentWord.romaji}"</span>
            </p>
          </div>
          
          <div className="h-px bg-slate-200 dark:bg-white/10" />
          
          <AnimatePresence mode="wait">
            {showAnswer ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3"
              >
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Meaning</h5>
                  <p className="text-base font-bold text-slate-800 dark:text-white">
                    {currentWord.meaning}
                  </p>
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">IPA Pronunciation</h5>
                  <p className="text-xs font-semibold text-slate-500 dark:text-indigo-200/60">
                    {currentWord.pronunciation}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="text-xs text-slate-400 italic py-4">
                Click "Show Details" to view meaning and pronunciation details.
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Navigation Buttons (Chuyển tới chuyển lui) */}
      <div className="flex items-center justify-between gap-4">
        <Button
          onClick={() => {
            if (currentIdx > 0) {
              setCurrentIdx((i) => i - 1);
              setShowAnswer(false);
            }
          }}
          disabled={currentIdx === 0}
          variant="outline"
          className="flex-1 py-5 rounded-2xl border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        <Button
          onClick={toggleWordLearned}
          variant="outline"
          className={cn(
            "py-5 px-6 rounded-2xl font-bold transition shadow-xs cursor-pointer text-xs",
            progress.wordsLearned.includes(currentWord.id)
              ? "bg-green-500 hover:bg-green-600 text-white border-green-600"
              : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
          )}
        >
          {progress.wordsLearned.includes(currentWord.id) ? (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4.5 h-4.5" />
              Learned
            </span>
          ) : (
            "Mark as Learned"
          )}
        </Button>

        <Button
          onClick={() => {
            if (currentIdx < lesson.loanwords.length - 1) {
              setCurrentIdx((i) => i + 1);
              setShowAnswer(false);
            }
          }}
          disabled={currentIdx === lesson.loanwords.length - 1}
          className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs"
        >
          Next
          <ArrowRight className="w-4 h-4" />
        </Button>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-white/10 shadow-xl space-y-4"
          >
            {passed ? (
              <Trophy className="w-16 h-16 mx-auto text-yellow-500 animate-bounce" />
            ) : (
              <XCircle className="w-16 h-16 mx-auto text-red-500" />
            )}

            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              {passed ? "Congratulations! 🎉" : "Keep Practicing! 💪"}
            </h2>

            <div className="text-6xl font-black text-primary leading-none">{percentage}%</div>

            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              You answered {quizScore} out of {lesson.loanwords.length} questions correctly.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setViewMode("learn");
                  setQuizFinished(false);
                }}
                variant="outline"
                className="flex-1 py-5 border-slate-200 dark:border-white/10 text-xs font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
              >
                Review Words
              </Button>
              <Button
                onClick={startQuiz}
                className="flex-1 py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-2xl hover:opacity-95 cursor-pointer shadow-md"
              >
                Try Again
              </Button>
            </div>
          </motion.div>
        </div>
      );
    }

    const options = quizOptions;

    return (
      <div className="space-y-6">
        {/* Progress & Score */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider">
            Question <span className="text-slate-800 dark:text-white font-black">{currentIdx + 1}</span> of {lesson.loanwords.length}
          </span>
          <span className="text-slate-500 font-bold uppercase tracking-wider">
            Score: <span className="text-primary font-black">{quizScore}</span>
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 bg-amber-500"
            style={{ width: `${((currentIdx + 1) / lesson.loanwords.length) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-white/10 shadow-xl"
        >
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
            What does this word mean?
          </div>



          <div
            className="text-5xl font-black text-slate-800 dark:text-white select-none leading-tight"
            style={{ fontFamily: "var(--font-japanese)" }}
          >
            {currentWord.word}
          </div>
        </motion.div>

        {/* Answer Options */}
        <div className="space-y-2.5">
          {options.map((option) => {
            const isCorrect = option === currentWord.meaning;
            const isSelected = quizAnswer === option;

            return (
              <button
                key={option}
                onClick={() => {
                  if (!quizAnswer) {
                    setQuizAnswer(option);
                    if (isCorrect) setQuizScore((s) => s + 1);
                  }
                }}
                disabled={!!quizAnswer}
                className={cn(
                  "w-full p-4.5 rounded-2xl font-bold transition-all shadow-xs cursor-pointer text-left",
                  quizAnswer
                    ? isCorrect
                      ? "bg-green-500 text-white border-green-600 shadow-md shadow-green-500/20"
                      : isSelected
                        ? "bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20"
                        : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border border-slate-200/40 dark:border-white/5"
                    : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                )}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        {quizAnswer && (
          <Button
            onClick={handleQuizNext}
            className="w-full py-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-95 transition shadow-md cursor-pointer text-xs"
          >
            {currentIdx < lesson.loanwords.length - 1 ? "Next Question" : "See Results"}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen relative pb-12">
      <SakuraBg count={14} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Link & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <Link
              to="/student/learning/alphabet/katakana"
              className="w-10 h-10 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-amber-500/20">
                カ
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white leading-none mb-1">
                  {lesson.title}
                </h1>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  {lesson.subtitle || "Master the loanwords"} • {lesson.loanwords.length} words
                </p>
              </div>
            </div>
          </div>
          
        </div>

        {/* Navigation & Mode Tabs */}
        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-white/10 p-2 rounded-2xl flex flex-wrap items-center gap-1 shadow-sm mb-6">
          {[
            { id: "learn" as ViewMode, icon: GraduationCap, label: "Learn" },
            { id: "quiz" as ViewMode, icon: BrainCircuit, label: "Practice" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setViewMode(mode.id);
                setQuizAnswer(null);
              }}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                viewMode === mode.id
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20"
                  : "text-slate-600 dark:text-indigo-200 hover:bg-slate-100/50 dark:hover:bg-white/5"
              )}
            >
              <mode.icon className="w-4 h-4" />
              {mode.label}
            </button>
          ))}
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Your Progress</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{progressPercent}%</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">{progress.wordsLearned.length}/{lesson.loanwords.length} learned</span>
                </div>
                <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Best Score</span>
                  <span className="text-lg font-black text-slate-800 dark:text-white leading-none mt-1">{progress.score}%</span>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {viewMode === "learn" && renderLearnMode()}
                {viewMode === "quiz" && renderQuizMode()}
              </motion.div>
            </AnimatePresence>

          </div>

          {/* Right Column: sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Word List set */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider">
                Word List
              </h3>
              
              <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto scrollbar-thin">
                {lesson.loanwords.map((word, idx) => (
                  <button
                    key={word.id}
                    onClick={() => {
                      setCurrentIdx(idx);
                      setViewMode("learn");
                    }}
                    className={cn(
                      "p-2 rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer border select-none truncate block w-full text-center",
                      currentIdx === idx
                        ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/25"
                        : progress.wordsLearned.includes(word.id)
                          ? "bg-green-50/50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/50 dark:border-white/5 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {word.word}
                  </button>
                ))}
              </div>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}
