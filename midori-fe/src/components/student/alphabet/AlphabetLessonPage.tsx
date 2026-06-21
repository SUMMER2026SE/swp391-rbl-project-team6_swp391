import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
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
  BrainCircuit,
  GraduationCap,
  Pencil,
  Star,
  Clock,
  Target,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { speakJapanese } from "@/data/japanese-learning-data";

export interface LessonCharacter {
  id: string;
  character: string;
  romaji: string;
  pronunciation: string;
  meaning: string;
  exampleWord: string;
  exampleMeaning: string;
  audioUrl: null;
  strokeOrder: number;
}

export interface LessonData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  totalCharacters: number;
  difficulty: number;
  estimatedTime: number;
  characters: LessonCharacter[];
  color: string;
}

interface LessonPageProps {
  lesson: LessonData;
  progressKey: string;
  onComplete?: (score: number) => void;
}

type ViewMode = "learn" | "quiz" | "result";

interface QuizQuestion {
  char: string;
  romaji: string;
  options: string[];
  correctAnswer: string;
  type: "recognize" | "listen" | "type" | "romaji-to-char" | "char-to-romaji";
}

type QuizMode = "romaji-to-char" | "char-to-romaji";

export function AlphabetLessonPage({ lesson, progressKey, onComplete }: LessonPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("learn");
  const [currentCharIdx, setCurrentCharIdx] = useState(0);
  const [showRomaji, setShowRomaji] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>("char-to-romaji");

  // Progress state
  const [progress, setProgress] = useState({
    completed: false,
    score: 0,
    attempts: 0,
    charactersLearned: [] as string[],
  });

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(`alphabet-progress-${progressKey}`);
      if (saved) {
        setProgress(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load progress:", e);
    }
  }, [progressKey]);

  // Save progress to localStorage
  const saveProgress = (newProgress: typeof progress) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`alphabet-progress-${progressKey}`, JSON.stringify(newProgress));
    } catch (e) {
      console.error("Failed to save progress:", e);
    }
    setProgress(newProgress);
  };

  // Generate quiz questions based on quiz mode
  const generateQuizQuestions = (mode: QuizMode) => {
    if (!lesson?.characters?.length) return [];
    
    const chars = [...lesson.characters].sort(() => Math.random() - 0.5);
    const questions: QuizQuestion[] = [];

    chars.forEach((char) => {
      if (mode === "romaji-to-char") {
        // Mode 1: Show romaji, select Hiragana/Katakana character
        const wrongOptions = lesson.characters
          .filter((c) => c.romaji !== char.romaji)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((c) => c.character);

        questions.push({
          char: char.character,
          romaji: char.romaji,
          options: [char.character, ...wrongOptions].sort(() => Math.random() - 0.5),
          correctAnswer: char.character,
          type: "romaji-to-char",
        });
      } else {
        // Mode 2: Show character, select romaji
        const wrongOptions = lesson.characters
          .filter((c) => c.romaji !== char.romaji)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((c) => c.romaji);

        questions.push({
          char: char.character,
          romaji: char.romaji,
          options: [char.romaji, ...wrongOptions].sort(() => Math.random() - 0.5),
          correctAnswer: char.romaji,
          type: "char-to-romaji",
        });
      }
    });

    return questions;
  };

  if (!lesson || !lesson.characters || lesson.characters.length === 0) {
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

  const currentChar = lesson.characters[currentCharIdx];

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
    } else {
      // Finish quiz
      const finalScore = Math.round(
        ((quizScore + (quizAnswer === quizQuestions[quizIdx].correctAnswer ? 1 : 0)) / quizQuestions.length) * 100
      );
      const newProgress = {
        ...progress,
        completed: finalScore >= 70,
        score: Math.max(progress.score, finalScore),
        attempts: progress.attempts + 1,
      };
      saveProgress(newProgress);
      setQuizFinished(true);
      setViewMode("result");
      if (onComplete) onComplete(finalScore);
    }
  };

  // Reset and start quiz with selected mode
  const startQuiz = (mode: QuizMode) => {
    const questions = generateQuizQuestions(mode);
    setQuizQuestions(questions);
    setQuizIdx(0);
    setQuizAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizMode(mode);
    setViewMode("quiz");
  };

  // Mark character as learned
  const markCharacterLearned = () => {
    if (!progress.charactersLearned.includes(currentChar.id)) {
      const newProgress = {
        ...progress,
        charactersLearned: [...progress.charactersLearned, currentChar.id],
      };
      saveProgress(newProgress);
    }
  };

  // Render Learn Mode
  const renderLearnMode = () => {
    return (
      <div className="space-y-4">
        {/* Top Section: Header with position */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold">
              {lesson.title}
            </span>
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-indigo-200/60">
            {currentCharIdx + 1} / {lesson.characters.length}
          </span>
        </div>

        {/* Character Card */}
        <motion.div
          key={currentCharIdx}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 dark:bg-indigo-950/50 backdrop-blur-xl rounded-3xl p-6 text-center border border-slate-200/60 dark:border-white/20 shadow-xl"
        >
          {/* Character Section */}
          <div className="mb-6">
            <button
              onClick={() => speakJapanese(currentChar.character)}
              className="mb-4 p-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 transition shadow-lg inline-flex"
            >
              <Volume2 className="w-6 h-6" />
            </button>

            <div
              className="text-8xl md:text-9xl font-black text-slate-800 dark:text-white mb-3 select-none"
              style={{ fontFamily: "var(--font-japanese)" }}
            >
              {currentChar.character}
            </div>

            <AnimatePresence>
              {showRomaji && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-3xl font-bold text-primary mb-3"
                >
                  {currentChar.romaji}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setShowRomaji(!showRomaji)}
              className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-indigo-200/80 hover:bg-slate-200/80 transition text-sm font-medium"
            >
              {showRomaji ? "Hide" : "Show"} Romaji
            </button>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-4 gap-2 text-left">
            <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-white/5">
              <div className="text-[10px] text-muted-foreground mb-0.5">Pronunciation</div>
              <div className="font-semibold text-sm">{currentChar.pronunciation}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-white/5">
              <div className="text-[10px] text-muted-foreground mb-0.5">Meaning</div>
              <div className="font-semibold text-sm truncate" title={currentChar.meaning}>{currentChar.meaning}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-white/5">
              <div className="text-[10px] text-muted-foreground mb-0.5">Strokes</div>
              <div className="font-semibold text-sm">{currentChar.strokeOrder}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100/60 dark:bg-white/5">
              <div className="text-[10px] text-muted-foreground mb-0.5">Type</div>
              <div className="font-semibold text-sm">{lesson.title.split(' ')[0]}</div>
            </div>
          </div>
        </motion.div>

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
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white font-bold hover:bg-white/90 disabled:opacity-30 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={markCharacterLearned}
            className={cn(
              "px-4 py-3.5 rounded-2xl font-bold transition",
              progress.charactersLearned.includes(currentChar.id)
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-600 dark:text-indigo-200 hover:bg-white/90"
            )}
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (currentCharIdx < lesson.characters.length - 1) {
                setCurrentCharIdx((i) => i + 1);
                setShowRomaji(false);
              }
            }}
            disabled={currentCharIdx === lesson.characters.length - 1}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:opacity-90 disabled:opacity-30 transition"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Render Quiz Mode
  const renderQuizMode = () => {
    if (quizFinished) {
      return renderResultMode();
    }

    if (!quizQuestions || quizQuestions.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-500">No questions available. Please start a quiz.</p>
        </div>
      );
    }

    const question = quizQuestions[quizIdx];
    const isRomajiToChar = question?.type === "romaji-to-char";

    return (
      <div className="space-y-6">
        {/* Quiz Mode Indicator */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-sm font-medium text-slate-600 dark:text-indigo-200/80">
            {isRomajiToChar ? "Romaji → Character" : "Character → Romaji"}
          </span>
        </div>

        {/* Progress */}
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-600 dark:text-indigo-200/80">
            Question <span className="font-bold text-slate-800 dark:text-white">{quizIdx + 1}</span> of{" "}
            <span className="text-slate-500">{quizQuestions.length}</span>
          </span>
          <span className="text-slate-800 dark:text-white font-bold">Score: {quizScore}</span>
        </div>
        <div className="h-2 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isRomajiToChar ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-pink-500 to-purple-500"
            )}
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
            {isRomajiToChar ? "Select the character for:" : "What is the romaji for?"}
          </div>

          {isRomajiToChar ? (
            // Mode: Show romaji, options are characters
            <div className="text-5xl md:text-6xl font-black text-emerald-600 dark:text-emerald-400 select-none">
              {question.romaji}
            </div>
          ) : (
            // Mode: Show character, options are romaji
            <div
              className="text-7xl md:text-8xl font-black text-slate-800 dark:text-white select-none"
              style={{ fontFamily: "var(--font-japanese)" }}
            >
              {question.char}
            </div>
          )}
        </motion.div>

        {/* Answer Options */}
        <div className="grid grid-cols-2 gap-3">
          {question.options.map((option) => {
            const isCorrect = option === question.correctAnswer;
            const isSelected = quizAnswer === option;

            return (
              <button
                key={option}
                onClick={() => !quizAnswer && handleAnswer(option)}
                disabled={!!quizAnswer}
                className={cn(
                  "p-4 rounded-xl font-bold text-lg transition-all",
                  isRomajiToChar && !quizAnswer ? "text-4xl" : "text-lg",
                  quizAnswer
                    ? isCorrect
                      ? "bg-green-500 text-white"
                      : isSelected
                      ? "bg-red-500 text-white"
                      : "bg-slate-100 dark:bg-white/10 text-slate-400"
                    : "bg-white/70 dark:bg-white/10 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100/80 dark:hover:bg-white/20"
                )}
                style={isRomajiToChar ? { fontFamily: "var(--font-japanese)" } : {}}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        {quizAnswer && (
          <button
            onClick={handleNextQuestion}
            className={cn(
              "w-full py-4 rounded-2xl text-white font-bold hover:opacity-90 transition",
              isRomajiToChar ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-pink-500 to-purple-500"
            )}
          >
            {quizIdx < quizQuestions.length - 1 ? "Next Question" : "See Results"}
          </button>
        )}
      </div>
    );
  };

  // Render Result Mode
  const renderResultMode = () => {
    const percentage = Math.round((quizScore / quizQuestions.length) * 100);
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
            You got {quizScore} out of {quizQuestions.length} questions correct.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setViewMode("learn");
                setQuizFinished(false);
              }}
              className="flex-1 py-4 rounded-2xl bg-slate-100/80 dark:bg-white/10 text-slate-700 dark:text-white font-bold hover:bg-slate-200/80 transition"
            >
              Review Lesson
            </button>
            <button
              onClick={startQuiz}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:opacity-90 transition"
            >
              Try Again
            </button>
          </div>
        </motion.div>
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
                to="/student/learning/alphabet"
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white">{lesson.title}</h1>
                <p className="text-xs text-slate-500 dark:text-indigo-200/60">
                  {lesson.characters.length} characters
                  {progress.attempts > 0 && ` • Best: ${progress.score}%`}
                </p>
              </div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: "learn" as ViewMode, icon: GraduationCap, label: "Learn" },
              { id: "quiz" as ViewMode, icon: BrainCircuit, label: "Quiz" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  // Auto-generate questions when entering quiz mode
                  if (mode.id === "quiz" && quizQuestions.length === 0) {
                    const questions = generateQuizQuestions(quizMode);
                    setQuizQuestions(questions);
                  }
                  setViewMode(mode.id);
                  setQuizAnswer(null);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  viewMode === mode.id
                    ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg"
                    : "bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-indigo-200 hover:bg-white/90"
                )}
              >
                <mode.icon className="w-4 h-4" />
                {mode.label}
              </button>
            ))}
            
            {/* Quiz Mode Selector - Only show when in quiz mode */}
            {viewMode === "quiz" && (
              <div className="flex gap-1 ml-auto">
                <button
                  onClick={() => startQuiz("char-to-romaji")}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    quizMode === "char-to-romaji"
                      ? "bg-pink-500 text-white"
                      : "bg-white/70 dark:bg-white/10 text-slate-600 dark:text-indigo-200 hover:bg-slate-100"
                  )}
                >
                  あ→a
                </button>
                <button
                  onClick={() => startQuiz("romaji-to-char")}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    quizMode === "romaji-to-char"
                      ? "bg-green-500 text-white"
                      : "bg-white/70 dark:bg-white/10 text-slate-600 dark:text-indigo-200 hover:bg-slate-100"
                  )}
                >
                  a→あ
                </button>
              </div>
            )}
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

export default AlphabetLessonPage;
