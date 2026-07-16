import { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
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
  Play,
  BrainCircuit,
  GraduationCap,
  Star,
  Clock,
  Sparkles,
  BookOpen,
  Info,
  Lock,
  Target
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

type ViewMode = "learn" | "quiz";

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
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [selectedQuizDetailIdx, setSelectedQuizDetailIdx] = useState<number | null>(null);

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
        // Mode 1: Show romaji, select character
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

  const currentChar = useMemo(() => {
    return lesson.characters[currentCharIdx] || lesson.characters[0];
  }, [lesson, currentCharIdx]);

  // Handle answer selection
  const handleAnswer = (answer: string) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[quizIdx] = answer;
    setUserAnswers(updatedAnswers);
  };

  // Submit and grade quiz
  const submitQuiz = () => {
    let correctCount = 0;
    quizQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });
    setQuizScore(correctCount);

    const finalScore = Math.round((correctCount / quizQuestions.length) * 100);
    const newProgress = {
      ...progress,
      completed: finalScore >= 70,
      score: Math.max(progress.score, finalScore),
      attempts: progress.attempts + 1,
    };
    saveProgress(newProgress);
    setQuizFinished(true);
    setSelectedQuizDetailIdx(0); // Automatically show details of the first question
    if (onComplete) onComplete(finalScore);
  };

  // Reset and start quiz with selected mode
  const startQuiz = (mode: QuizMode) => {
    const questions = generateQuizQuestions(mode);
    setQuizQuestions(questions);
    setQuizIdx(0);
    setUserAnswers(new Array(questions.length).fill(null));
    setQuizScore(0);
    setCurrentStreak(0);
    setQuizFinished(false);
    setSelectedQuizDetailIdx(null);
    setQuizMode(mode);
    setViewMode("quiz");
  };

  // Mark character as learned
  const toggleCharacterLearned = () => {
    const isLearned = progress.charactersLearned.includes(currentChar.id);
    let updatedLearned = [...progress.charactersLearned];
    if (isLearned) {
      updatedLearned = updatedLearned.filter((id) => id !== currentChar.id);
    } else {
      updatedLearned.push(currentChar.id);
    }
    const newProgress = {
      ...progress,
      charactersLearned: updatedLearned,
    };
    saveProgress(newProgress);
  };

  const progressPercent = Math.round((progress.charactersLearned.length / lesson.characters.length) * 100);

  // Render Learn Mode
  const renderLearnMode = () => {
    return (
      <div className="space-y-6">
        {/* Character Card */}
        <motion.div
          key={currentCharIdx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/60 dark:border-white/10 flex flex-col md:flex-row items-center p-6 md:p-8 gap-6 md:gap-8 bg-white dark:bg-slate-900"
          style={{ minHeight: "320px" }}
        >
          {/* Background Illustration with clean overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center z-0 opacity-15 dark:opacity-25" 
            style={{ backgroundImage: `url('/images/cherry_blossom_bg.png')` }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-white/95 to-white/70 dark:from-slate-900/95 dark:to-slate-900/70 z-0" />
          
          {/* Left: Large Character display with guidelines and stroke order */}
          <div className="relative z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/50 dark:border-white/10 w-full md:w-52 aspect-square shrink-0 shadow-xs overflow-hidden">
            {/* Dashed Guidelines */}
            <div className="absolute inset-0 border-r border-dashed border-slate-200/40 dark:border-white/5 left-1/2" />
            <div className="absolute inset-0 border-b border-dashed border-slate-200/40 dark:border-white/5 top-1/2" />

            <div 
              className="text-8xl md:text-9xl font-black text-slate-800 dark:text-white select-none leading-none relative"
              style={{ fontFamily: "var(--font-japanese)" }}
            >
              {currentChar.character}
              
              {/* Stroke guide numbers based on stroke count */}
              {currentChar.strokeOrder >= 1 && (
                <span className="absolute -left-2 top-2 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">1</span>
              )}
              {currentChar.strokeOrder >= 2 && (
                <span className="absolute -right-2 top-4 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">2</span>
              )}
              {currentChar.strokeOrder >= 3 && (
                <span className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">3</span>
              )}
            </div>
            
            <div className="flex gap-2 mt-5 relative z-10">
              <button
                onClick={() => speakJapanese(currentChar.character)}
                className="w-9 h-9 rounded-xl bg-primary text-white hover:opacity-90 transition flex items-center justify-center shadow-md shadow-primary/20 cursor-pointer"
                title="Nghe phát âm"
              >
                <Volume2 className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => setShowRomaji(!showRomaji)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition text-xs font-bold cursor-pointer"
              >
                {showRomaji ? "Ẩn Romaji" : "Show Romaji"}
              </button>
            </div>
          </div>
          
          {/* Right: Character Info */}
          <div className="relative z-10 flex-1 space-y-4 text-left w-full">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black border border-primary/20">
                  {currentCharIdx + 1} / {lesson.characters.length}
                </span>
              </div>
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2 flex items-baseline gap-2">
                <span>{currentChar.character}</span>
                {showRomaji && (
                  <span className="text-xl font-bold text-slate-600 dark:text-slate-400">({currentChar.romaji})</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-bold">
                Sound: <span className="text-slate-700 dark:text-slate-200 font-black">"{currentChar.meaning}"</span> as in "{currentChar.pronunciation}"
              </p>
            </div>
            
            <div className="h-px bg-slate-200 dark:bg-white/10" />
            
            <div className="space-y-4">
              <div>
                <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Từ ví dụ (Example)</h5>
                <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 rounded-xl w-fit">
                  <span 
                    className="text-base font-black text-slate-800 dark:text-white"
                    style={{ fontFamily: "var(--font-japanese)" }}
                  >
                    {currentChar.exampleWord}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">({currentChar.exampleMeaning})</span>
                  <button
                    onClick={() => speakJapanese(currentChar.exampleWord)}
                    className="p-1 rounded-lg text-slate-400 hover:text-primary transition cursor-pointer"
                  >
                    <Volume2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Navigation Buttons (Chuyển tới chuyển lui) */}
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={() => {
              if (currentCharIdx > 0) {
                setCurrentCharIdx((i) => i - 1);
                setShowRomaji(false);
              }
            }}
            disabled={currentCharIdx === 0}
            variant="outline"
            className="flex-1 py-5 rounded-2xl border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>

          <Button
            onClick={toggleCharacterLearned}
            variant="outline"
            className={cn(
              "py-5 px-6 rounded-2xl font-bold transition shadow-xs cursor-pointer text-xs",
              progress.charactersLearned.includes(currentChar.id)
                ? "bg-green-500 hover:bg-green-600 text-white border-green-600"
                : "border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5"
            )}
          >
            {progress.charactersLearned.includes(currentChar.id) ? (
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
              if (currentCharIdx < lesson.characters.length - 1) {
                setCurrentCharIdx((i) => i + 1);
                setShowRomaji(false);
              }
            }}
            disabled={currentCharIdx === lesson.characters.length - 1}
            className="flex-1 py-5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
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
        <Card className="p-8 text-center bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-white/10 rounded-2xl">
          <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-4">No questions loaded. Choose a quiz mode to start!</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => startQuiz("char-to-romaji")} className="bg-primary hover:bg-primary/90 text-xs font-bold rounded-xl cursor-pointer">
              Character → Romaji
            </Button>
            <Button onClick={() => startQuiz("romaji-to-char")} className="bg-emerald-500 hover:bg-emerald-600 text-xs font-bold rounded-xl cursor-pointer">
              Romaji → Character
            </Button>
          </div>
        </Card>
      );
    }

    const question = quizQuestions[quizIdx];
    const isRomajiToChar = question?.type === "romaji-to-char";

    const allAnswered = userAnswers.length === quizQuestions.length && userAnswers.every((ans) => ans !== null);

    return (
      <div className="space-y-4">
        {/* Progress & Score Row */}
        <div className="flex justify-between items-center text-xs font-bold text-slate-500 pb-1">
          <span>
            Question <span className="text-slate-800 dark:text-white font-black">{quizIdx + 1}</span> of {quizQuestions.length}
          </span>
          <span className="text-slate-400 font-bold uppercase tracking-wider">
            {isRomajiToChar ? "Romaji → Character" : "Character → Romaji"}
          </span>
          <span>
            Answered: <span className="text-primary font-black">{userAnswers.filter((ans) => ans !== null).length}</span>/{quizQuestions.length}
          </span>
        </div>
        
        {/* Thin Underline Progress Bar */}
        <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((quizIdx + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>



        {/* Question Card */}
        <motion.div
          key={quizIdx}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/60 dark:border-white/10 flex flex-col items-center justify-center p-5 gap-2 bg-white dark:bg-slate-900"
          style={{ minHeight: "180px" }}
        >
          {/* Background decoration */}
          <div 
            className="absolute inset-0 bg-cover bg-center z-0 opacity-15 dark:opacity-25" 
            style={{ backgroundImage: `url('/images/cherry_blossom_bg.png')` }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-white/95 to-white/80 dark:from-slate-900/95 dark:to-slate-900/80 z-0" />
          
          <div className="relative z-10 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
            {isRomajiToChar ? "SELECT THE CHARACTER FOR:" : "WHAT IS THE ROMAJI FOR?"}
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {isRomajiToChar ? (
              <div className="text-6xl font-black text-emerald-500 select-none">
                {question.romaji}
              </div>
            ) : (
              <div
                className="text-8xl font-black text-slate-800 dark:text-white select-none leading-none"
                style={{ fontFamily: "var(--font-japanese)" }}
              >
                {question.char}
              </div>
            )}
          </div>
        </motion.div>

        {/* Answer Options Grid (2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, idx) => {
            const prefix = ["A", "B", "C", "D"][idx];
            const isSelected = userAnswers[quizIdx] === option;

            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className={cn(
                  "p-3.5 rounded-2xl font-bold transition-all shadow-xs cursor-pointer border flex items-center gap-3.5 text-left w-full",
                  isSelected
                    ? "bg-primary/10 text-primary border-primary shadow-md shadow-primary/5"
                    : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                )}
              >
                {/* Circle badge for A, B, C, D */}
                <div 
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 border select-none transition-colors",
                    isSelected
                      ? "bg-primary text-white border-primary"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-white/10"
                  )}
                >
                  {prefix}
                </div>
                
                <span 
                  className={cn(
                    "font-black text-sm",
                    isRomajiToChar ? "text-2xl" : "text-sm"
                  )}
                  style={isRomajiToChar ? { fontFamily: "var(--font-japanese)" } : {}}
                >
                  {option}
                </span>
              </button>
            );
          })}
        </div>

        {/* Back & Next/Submit Button */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <Button
            onClick={() => quizIdx > 0 && setQuizIdx(quizIdx - 1)}
            disabled={quizIdx === 0}
            variant="outline"
            className="px-6 py-5 rounded-2xl border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {quizIdx < quizQuestions.length - 1 ? (
            <Button
              onClick={() => setQuizIdx(quizIdx + 1)}
              className="flex-1 py-5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={submitQuiz}
              disabled={!allAnswered}
              className={cn(
                "flex-1 py-5 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs",
                allAnswered 
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-95" 
                  : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed border-slate-200 dark:border-white/10"
              )}
            >
              Chấm điểm
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!allAnswered && quizIdx === quizQuestions.length - 1 && (
          <p className="text-center text-[10px] text-red-500 font-bold uppercase tracking-wider mt-2">
            * Bạn phải trả lời tất cả các câu hỏi để chấm điểm
          </p>
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-white/10 shadow-xl space-y-6"
        >
          <div className="text-center space-y-4">
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
              Bạn đã trả lời đúng {quizScore} trên tổng số {quizQuestions.length} câu hỏi.
            </p>
          </div>

          {/* Details of right and wrong answers */}
          {selectedQuizDetailIdx !== null && quizQuestions[selectedQuizDetailIdx] && (() => {
            const q = quizQuestions[selectedQuizDetailIdx];
            const userAns = userAnswers[selectedQuizDetailIdx];
            const isCorrect = userAns === q.correctAnswer;
            
            return (
              <div className="border-t border-slate-100 dark:border-white/5 pt-6 text-left">
                <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Chi tiết Câu {selectedQuizDetailIdx + 1}</span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                    isCorrect ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {isCorrect ? "Đúng" : "Sai"}
                  </span>
                </h3>
                
                <div 
                  className={cn(
                    "p-5 rounded-2xl border flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-900/50",
                    isCorrect 
                      ? "border-green-200/50 dark:border-green-900/30"
                      : "border-red-200/50 dark:border-red-900/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                        Câu hỏi
                      </div>
                      <div className="text-lg font-black text-slate-800 dark:text-white">
                        {q.type === "char-to-romaji" ? (
                          <>
                            Chữ: <span style={{ fontFamily: "var(--font-japanese)" }} className="text-2xl ml-1 text-primary">{q.char}</span>
                            <span className="text-xs font-medium block text-slate-500 mt-1">(Tìm Romaji tương ứng)</span>
                          </>
                        ) : (
                          <>
                            Romaji: <span className="text-2xl ml-1 text-primary">{q.romaji}</span>
                            <span className="text-xs font-medium block text-slate-500 mt-1">(Tìm chữ viết tương ứng)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/5">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Đáp án đúng
                      </div>
                      <div className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span style={q.type !== "char-to-romaji" ? { fontFamily: "var(--font-japanese)" } : {}} className="text-base">
                          {q.correctAnswer}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        Bạn đã chọn
                      </div>
                      <div className={cn(
                        "text-sm font-bold flex items-center gap-1.5",
                        isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span style={q.type !== "char-to-romaji" ? { fontFamily: "var(--font-japanese)" } : {}} className="text-base">
                          {userAns || "Bỏ qua / Trống"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
            <Button
              onClick={() => {
                setViewMode("learn");
                setQuizFinished(false);
              }}
              variant="outline"
              className="flex-1 py-5 border-slate-200 dark:border-white/10 text-xs font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
            >
              Review Lesson
            </Button>
            <Button
              onClick={() => startQuiz(quizMode)}
              className="flex-1 py-5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-2xl hover:opacity-95 cursor-pointer shadow-md"
            >
              Try Again
            </Button>
          </div>
        </motion.div>
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
              to="/student/learning/alphabet"
              className="w-10 h-10 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-pink-500/20">
                あ
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 dark:text-white leading-none mb-1">
                  {lesson.title}
                </h1>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  {lesson.subtitle || "Master the basics"} • {lesson.characters.length} characters
                </p>
              </div>
            </div>
          </div>
          
        </div>

        {/* Navigation & Mode Tabs */}
        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/60 dark:border-white/10 p-2 rounded-2xl flex flex-wrap items-center gap-1 shadow-sm mb-6">
          {[
            { id: "learn" as ViewMode, icon: GraduationCap, label: "Learn" },
            { id: "quiz" as ViewMode, icon: BrainCircuit, label: "Quiz" },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                if (mode.id === "quiz" && quizQuestions.length === 0) {
                  const questions = generateQuizQuestions(quizMode);
                  setQuizQuestions(questions);
                  setUserAnswers(new Array(questions.length).fill(null));
                }
                setViewMode(mode.id);
              }}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                viewMode === mode.id
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-500/20"
                  : "text-slate-600 dark:text-indigo-200 hover:bg-slate-100/50 dark:hover:bg-white/5"
              )}
            >
              <mode.icon className="w-4 h-4" />
              {mode.label}
            </button>
          ))}
          
          {/* Quiz Mode selectors next to tabs */}
          {viewMode === "quiz" && !quizFinished && (
            <div className="flex gap-1 ml-auto">
              <button
                onClick={() => startQuiz("char-to-romaji")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                  quizMode === "char-to-romaji"
                    ? "bg-pink-500 text-white"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-indigo-200 hover:bg-slate-200"
                )}
              >
                あ → a
              </button>
              <button
                onClick={() => startQuiz("romaji-to-char")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                  quizMode === "romaji-to-char"
                    ? "bg-green-500 text-white"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-indigo-200 hover:bg-slate-200"
                )}
              >
                a → あ
              </button>
            </div>
          )}
        </div>

        {/* Dashboard Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Learning Content */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Stats Row - Only show when NOT in quiz mode */}
            {viewMode !== "quiz" && (
              <div className="grid grid-cols-2 gap-4">
                {/* Progress Card */}
                <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Your Progress</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-slate-800 dark:text-white leading-none">{progressPercent}%</span>
                    <span className="text-[9px] text-muted-foreground font-semibold">{progress.charactersLearned.length}/{lesson.characters.length} learned</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                {/* Best Score */}
                <div className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 border border-purple-500/20">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Best Score</span>
                    <span className="text-lg font-black text-slate-800 dark:text-white leading-none mt-1">{progress.score}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Main Area based on Tab */}
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

          {/* Right Column: Information Sidebars */}
          <div className="lg:col-span-4 space-y-6">
            {viewMode === "quiz" && !quizFinished ? (
              /* Sidebar: Quiz Question navigation grid */
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 p-5 rounded-3xl shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                  <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider">
                    Danh sách câu hỏi
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    Đã làm {userAnswers.filter((ans) => ans !== null).length}/{quizQuestions.length}
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {quizQuestions.map((_, idx) => {
                    const isCurrent = idx === quizIdx;
                    const isAnswered = userAnswers[idx] !== null;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setQuizIdx(idx)}
                        className={cn(
                          "py-2 px-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 select-none",
                          isCurrent
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                            : isAnswered
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30 hover:bg-emerald-100/70"
                              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/50 dark:border-white/5 hover:border-slate-300 text-slate-400 dark:text-slate-500"
                        )}
                      >
                        <span>Câu {idx + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ) : quizFinished ? (
              /* Sidebar: Quiz Question results grid */
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 p-5 rounded-3xl shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                  <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider">
                    Kết quả câu hỏi
                  </h3>
                  <span className="text-[10px] font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    Đúng {quizScore}/{quizQuestions.length}
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {quizQuestions.map((q, idx) => {
                    const userAns = userAnswers[idx];
                    const isCorrect = userAns === q.correctAnswer;
                    const isSelected = selectedQuizDetailIdx === idx;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedQuizDetailIdx(idx)}
                        className={cn(
                          "py-2 px-1 rounded-xl text-[10px] font-black transition-all cursor-pointer border flex flex-col items-center justify-center gap-1 select-none",
                          isCorrect
                            ? isSelected
                              ? "bg-green-500 text-white border-green-600 shadow-md shadow-green-500/25"
                              : "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30 hover:bg-green-100/70"
                            : isSelected
                              ? "bg-red-500 text-white border-red-600 shadow-md shadow-red-500/25"
                              : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30 hover:bg-red-100/70"
                        )}
                      >
                        <span>Câu {idx + 1}</span>
                        {isCorrect ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ) : (
              /* Sidebar 1: Character Set */
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wider">
                    Character Set
                  </h3>
                </div>
                
                <div className="grid grid-cols-5 gap-2.5">
                  {lesson.characters.map((char, idx) => (
                    <button
                      key={char.id}
                      onClick={() => {
                        setCurrentCharIdx(idx);
                        setViewMode("learn");
                      }}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-all cursor-pointer border select-none",
                        currentCharIdx === idx
                          ? "bg-purple-500 hover:bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25"
                          : progress.charactersLearned.includes(char.id)
                            ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200/50 dark:border-white/5 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {char.character}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlphabetLessonPage;
