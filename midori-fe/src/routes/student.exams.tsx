import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, FileText, Star, CheckCircle, X, ChevronRight, ChevronLeft,
  Play, Timer, Trophy, RotateCcw, BookOpen, Headphones, GraduationCap,
  Brain, Target, Eye, TrendingUp, Award, Users, Search,
  ArrowRight, Target as TargetIcon, ChevronDown
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type QuestionType = "vocabulary" | "grammar" | "reading" | "listening" | "multiple-choice";
type Difficulty = "easy" | "medium" | "hard";
type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";
type ExamPhase = "list" | "intro" | "doing" | "result" | "review";

// ─── Mock Data ────────────────────────────────────────────────────────────────

interface Exam {
  id: number;
  title: string;
  level: JLPTLevel;
  type: string;
  questions: number;
  time: number;
  typeIcon: React.ElementType;
  difficulty: Difficulty;
  description: string;
  attempts: number;
  avgScore: number;
  yourBest: number | null;
  status: "available" | "completed";
  tags: string[];
}

const EXAMS: Exam[] = [
  {
    id: 1, title: "JLPT N5 Vocabulary Challenge", level: "N5", type: "Vocabulary",
    questions: 15, time: 20, typeIcon: BookOpen, difficulty: "easy",
    description: "Test your N5 vocabulary with images and example sentences.",
    attempts: 3, avgScore: 82, yourBest: 93, status: "available",
    tags: ["Vocabulary", "N5", "Beginner"]
  },
  {
    id: 2, title: "JLPT N5 Grammar Basics", level: "N5", type: "Grammar",
    questions: 20, time: 30, typeIcon: GraduationCap, difficulty: "easy",
    description: "Common N5 grammar patterns from the JLPT exam.",
    attempts: 1, avgScore: 75, yourBest: 68, status: "completed",
    tags: ["Grammar", "N5", "Beginner"]
  },
  {
    id: 3, title: "JLPT N4 Kanji Reading", level: "N4", type: "Kanji",
    questions: 25, time: 35, typeIcon: Brain, difficulty: "medium",
    description: "Read and understand N4 kanji in context.",
    attempts: 0, avgScore: 71, yourBest: null, status: "available",
    tags: ["Kanji", "N4", "Intermediate"]
  },
  {
    id: 4, title: "JLPT N3 Listening Practice", level: "N3", type: "Listening",
    questions: 20, time: 40, typeIcon: Headphones, difficulty: "medium",
    description: "Practice listening comprehension at N3 level.",
    attempts: 0, avgScore: 69, yourBest: null, status: "available",
    tags: ["Listening", "N3", "Intermediate"]
  },
  {
    id: 5, title: "JLPT N3 Reading Comprehension", level: "N3", type: "Reading",
    questions: 15, time: 45, typeIcon: FileText, difficulty: "hard",
    description: "Read short essays and answer comprehension questions.",
    attempts: 2, avgScore: 65, yourBest: 72, status: "completed",
    tags: ["Reading", "N3", "Advanced"]
  },
  {
    id: 6, title: "JLPT N2 Full Mock Exam", level: "N2", type: "Full Exam",
    questions: 80, time: 120, typeIcon: Target, difficulty: "hard",
    description: "Full N2 practice exam covering all skill areas.",
    attempts: 0, avgScore: 62, yourBest: null, status: "available",
    tags: ["Full Exam", "N2", "Advanced"]
  },
];

const SAMPLE_QUESTIONS = [
  {
    id: "q1", type: "vocabulary" as QuestionType, difficulty: "easy" as Difficulty, jlptLevel: "N5" as JLPTLevel,
    question: "What does 「あさ」 mean?",
    options: ["Noon", "Morning", "Evening", "Afternoon"],
    correctAnswer: 1,
    explanation: "「あさ」(asa) = morning. Noon is 「ひる」(hiru), evening is 「よる」(yoru)."
  },
  {
    id: "q2", type: "vocabulary" as QuestionType, difficulty: "easy" as Difficulty, jlptLevel: "N5" as JLPTLevel,
    question: "What is the reading of 「大きい」?",
    options: ["おおきい (ookii)", "ちいさい (chiisai)", "あたらしい (atarashii)", "ふるい (furui)"],
    correctAnswer: 0,
    explanation: "「大きい」(ookii) = big. 「小さい」= small, 「新しい」= new, 「古い」= old."
  },
  {
    id: "q3", type: "grammar" as QuestionType, difficulty: "easy" as Difficulty, jlptLevel: "N5" as JLPTLevel,
    question: "Complete: 私は毎朝コーヒーを_____ます。",
    options: ["飲み (nomi)", "書く (kaki)", "読む (yomi)", "行く (iki)"],
    correctAnswer: 0,
    explanation: "Drink coffee = コーヒーを飲みます。The て-form of 飲む is 飲んで."
  },
  {
    id: "q4", type: "grammar" as QuestionType, difficulty: "easy" as Difficulty, jlptLevel: "N5" as JLPTLevel,
    question: "学校に_____ますか。 → はい、行きます。",
    options: ["何が", "誰と", "どこへ", "いつ"],
    correctAnswer: 2,
    explanation: "「どこへ」= where to (direction). 「行きます」indicates directional movement."
  },
  {
    id: "q5", type: "reading" as QuestionType, difficulty: "medium" as Difficulty, jlptLevel: "N5" as JLPTLevel,
    question: "Read: 田中さんは毎日 朝6時に 起きます。会社には 9時に 着きます。\nWhat time does 田中さん wake up?",
    options: ["6 o'clock", "9 o'clock", "7 o'clock", "8 o'clock"],
    correctAnswer: 0,
    explanation: "The text clearly states 「朝6時に 起きます」(wakes up at 6 AM)."
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: JLPTLevel }) {
  const colors: Record<JLPTLevel, string> = {
    N5: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    N4: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    N3: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    N2: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    N1: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${colors[level]}`}>
      {level}
    </span>
  );
}

function DifficultyDot({ difficulty }: { difficulty: Difficulty }) {
  const colors = { easy: "bg-green-400", medium: "bg-amber-400", hard: "bg-red-400" };
  const labels = { easy: "Easy", medium: "Medium", hard: "Hard" };
  return (
    <span className="flex items-center gap-1.5 text-[10px] text-white/70">
      <span className={`w-2 h-2 rounded-full ${colors[difficulty]}`} />
      {labels[difficulty]}
    </span>
  );
}

function ExamCard({ exam, onStart, onReview }: { exam: Exam; onStart: (exam: Exam) => void; onReview?: (exam: Exam) => void }) {
  const Icon = exam.typeIcon;
  const isCompleted = exam.status === "completed";

  const gradMap: Record<JLPTLevel, string> = {
    N5: "from-blue-500/80 via-sky-500/80 to-cyan-500/80",
    N4: "from-violet-500/80 via-purple-500/80 to-fuchsia-500/80",
    N3: "from-pink-500/80 via-rose-500/80 to-red-500/80",
    N2: "from-amber-500/80 via-orange-500/80 to-yellow-500/80",
    N1: "from-red-500/80 via-pink-500/80 to-fuchsia-500/80",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl overflow-hidden border bg-white/80 dark:bg-slate-800/80 border-white/50 dark:border-slate-700/50 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer transition-all"
      onClick={() => onStart(exam)}
    >
      {/* Gradient header */}
      <div className={`relative px-4 pt-4 pb-3 bg-gradient-to-br ${gradMap[exam.level]}`}>
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <LevelBadge level={exam.level} />
            {isCompleted && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                <CheckCircle className="w-3 h-3" /> Done
              </span>
            )}
          </div>
        </div>

        <h3 className="font-display font-black text-sm mt-3 leading-tight text-white">{exam.title}</h3>
        <p className="text-white/60 text-[11px] mt-1 leading-relaxed">{exam.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {exam.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-white/15 text-white/70 text-[10px] font-semibold">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> {exam.questions} Q
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {exam.time} min
          </span>
          <DifficultyDot difficulty={exam.difficulty} />
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {exam.attempts > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3.5 h-3.5" /> {exam.attempts} attempts
            </span>
          )}
          {exam.yourBest !== null && (
            <span className="flex items-center gap-1 text-green-400 font-bold ml-auto">
              <Trophy className="w-3.5 h-3.5" /> Best: {exam.yourBest}%
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={(e) => { e.stopPropagation(); onStart(exam); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-all ${
              isCompleted
                ? "bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                : "bg-white text-slate-700 hover:bg-white/90 shadow"
            }`}>
            {isCompleted ? (
              <><RotateCcw className="w-3.5 h-3.5" /> Retake</>
            ) : (
              <><Play className="w-3.5 h-3.5" /> Start</>
            )}
          </button>
          {isCompleted && onReview && (
            <button
              onClick={(e) => { e.stopPropagation(); onReview(exam); }}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-all bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
            >
              <Eye className="w-3.5 h-3.5" /> Review
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Exam Intro Screen ───────────────────────────────────────────────────────

function ExamIntro({
  exam,
  onStart,
  onBack,
}: {
  exam: Exam;
  onStart: () => void;
  onBack: () => void;
}) {
  const Icon = exam.typeIcon;

  const gradMap: Record<JLPTLevel, string> = {
    N5: "from-blue-500 via-sky-400 to-cyan-400",
    N4: "from-violet-500 via-purple-400 to-fuchsia-400",
    N3: "from-pink-500 via-rose-400 to-red-400",
    N2: "from-amber-500 via-orange-400 to-yellow-400",
    N1: "from-red-500 via-pink-400 to-fuchsia-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-xl mx-auto"
    >
      {/* Header card */}
      <div className={`relative rounded-2xl overflow-hidden mb-4 bg-gradient-to-br ${gradMap[exam.level]}`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative px-5 pt-5 pb-4 text-center text-white">

          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <LevelBadge level={exam.level} />
            {exam.yourBest !== null && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/20 text-[11px] font-bold">
                <Trophy className="w-3.5 h-3.5" /> {exam.yourBest}%
              </span>
            )}
          </div>

          <h2 className="font-display font-black text-lg leading-tight">{exam.title}</h2>
          <p className="text-white/70 text-xs mt-1 leading-relaxed">{exam.description}</p>

          <div className="flex items-center justify-center gap-5 mt-4 text-white/80 text-xs">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> {exam.questions} questions
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {exam.time} minutes
            </span>
            <DifficultyDot difficulty={exam.difficulty} />
          </div>

          <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-white/60">
            <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{exam.time} min countdown</span>
            <span className="text-white/30">·</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Change answers freely</span>
            <span className="text-white/30">·</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Detailed explanations</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/50 dark:border-slate-700/50 text-sm font-semibold hover:bg-white transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onStart}
          className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-slate-800 font-bold shadow hover:bg-white/90 transition"
        >
          <Play className="w-4 h-4" /> Start Exam
        </button>
      </div>
    </motion.div>
  );
}

// ─── Question Card ───────────────────────────────────────────────────────────

function QuestionCard({
  q,
  index,
  total,
  selectedAnswer,
  onSelect,
  showResult,
}: {
  q: typeof SAMPLE_QUESTIONS[0];
  index: number;
  total: number;
  selectedAnswer: number | null;
  onSelect: (idx: number) => void;
  showResult: boolean;
}) {
  const letters = ["A", "B", "C", "D"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
    >
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
          {index + 1} / {total}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-white/30 dark:bg-slate-700/50 overflow-hidden">
          <motion.div
            animate={{ width: `${((index + 1) / total) * 100}%` }}
            transition={{ duration: 0.4 }}
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-pink-400"
          />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-white/50 dark:border-slate-700/50 overflow-hidden">
        <div className="px-5 pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              q.difficulty === "easy" ? "bg-green-500/15 text-green-400" :
              q.difficulty === "medium" ? "bg-amber-500/15 text-amber-400" :
              "bg-red-500/15 text-red-400"
            }`}>
              {q.difficulty === "easy" ? "Easy" : q.difficulty === "medium" ? "Medium" : "Hard"}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-400">
              {q.jlptLevel}
            </span>
          </div>
          <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{q.question}</p>
        </div>

        <div className="px-5 pb-4 space-y-2">
          {q.options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = showResult && i === q.correctAnswer;
            const isWrong = showResult && isSelected && i !== q.correctAnswer;

            let optClass = "bg-white/60 dark:bg-slate-700/60 border border-transparent hover:border-blue-400/50 hover:bg-blue-500/5";
            if (showResult) {
              if (isCorrect) optClass = "bg-green-500/15 border-green-500/40";
              else if (isWrong) optClass = "bg-red-500/15 border-red-500/40";
            } else if (isSelected) {
              optClass = "bg-blue-500/15 border-blue-500/40";
            }

            return (
              <button
                key={i}
                onClick={() => !showResult && onSelect(i)}
                disabled={showResult}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all ${optClass}`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  showResult && isCorrect ? "bg-green-500 text-white" :
                  showResult && isWrong ? "bg-red-500 text-white" :
                  isSelected ? "bg-blue-500 text-white" :
                  "bg-slate-100 dark:bg-slate-600 text-muted-foreground"
                }`}>
                  {showResult ? (
                    isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> :
                    isWrong ? <X className="w-3.5 h-3.5" /> : letters[i]
                  ) : isSelected ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    letters[i]
                  )}
                </span>
                <span className={`font-semibold flex-1 ${
                  showResult && isCorrect ? "text-green-400" :
                  showResult && isWrong ? "text-red-400" : ""
                }`}>{opt}</span>
              </button>
            );
          })}
        </div>

        {showResult && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="px-5 pb-4"
          >
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Explanation</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Result Screen ───────────────────────────────────────────────────────────

function ExamResult({
  exam,
  answers,
  questions,
  onRetry,
  onReview,
  onBack,
}: {
  exam: Exam;
  answers: Record<string, number | null>;
  questions: typeof SAMPLE_QUESTIONS;
  onRetry: () => void;
  onReview: () => void;
  onBack: () => void;
}) {
  const correct = questions.filter(q => answers[q.id] === q.correctAnswer).length;
  const total = questions.length;
  const score = Math.round((correct / total) * 100);
  const timeTaken = 8;

  const isPerfect = score === 100;
  const isGood = score >= 70;
  const isPass = score >= 50;

  const gradMap: Record<JLPTLevel, string> = {
    N5: "from-blue-400 to-cyan-400",
    N4: "from-violet-400 to-fuchsia-400",
    N3: "from-pink-400 to-red-400",
    N2: "from-amber-400 to-yellow-400",
    N1: "from-red-400 to-fuchsia-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto text-center space-y-4"
    >
      {/* Trophy */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        className="relative w-24 h-24 mx-auto"
      >
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradMap[exam.level]} opacity-20 blur-2xl`} />
        <div className={`relative w-full h-full rounded-full bg-gradient-to-br ${gradMap[exam.level]} flex items-center justify-center shadow-xl`}>
          {isPerfect ? <Award className="w-10 h-10 text-white" /> :
           isGood ? <Trophy className="w-10 h-10 text-white" /> :
           <TrendingUp className="w-10 h-10 text-white" />}
        </div>
      </motion.div>

      <div>
        <h2 className="font-display font-black text-2xl">
          {isPerfect ? "Perfect!" : isGood ? "Well Done!" : isPass ? "Keep Going!" : "Don't Give Up!"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{exam.title}</p>
      </div>

      {/* Score ring */}
      <div className="relative w-36 h-36 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" className="fill-none stroke-slate-100 dark:stroke-slate-700" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r="42"
            className="fill-none stroke-[url(#resultGrad)]"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 42}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - score / 100) }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
          <defs>
            <linearGradient id="resultGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={isGood ? "#34D399" : isPass ? "#FBBF24" : "#F87171"} />
              <stop offset="100%" stopColor={isGood ? "#3B82F6" : isPass ? "#F97316" : "#EF4444"} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-800 dark:text-white">{score}%</span>
          <span className="text-[10px] text-muted-foreground">{correct}/{total} correct</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Correct", value: correct, color: "text-green-400", bg: "bg-green-500/15 border-green-500/30" },
          { label: "Wrong", value: total - correct, color: "text-red-400", bg: "bg-red-500/15 border-red-500/30" },
          { label: "Time", value: `${timeTaken}m`, color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30" },
          { label: "Best", value: exam.yourBest !== null ? `${Math.max(exam.yourBest, score)}%` : `${score}%`, color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl p-2.5 border ${stat.bg}`}>
            <div className={`text-base font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Comparison */}
      {exam.yourBest !== null && (
        <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl border border-white/50 dark:border-slate-700/50 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Previous best</span>
            <span className="font-bold">{exam.yourBest}%</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-muted-foreground">This attempt</span>
            <span className={`font-bold ${score > exam.yourBest! ? "text-green-400" : score < exam.yourBest! ? "text-red-400" : ""}`}>
              {score}% {score > exam.yourBest! ? "↑ New!" : score < exam.yourBest! ? "↓" : "="}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-slate-700/50 text-sm font-semibold hover:bg-white transition"
        >
          <ChevronLeft className="w-4 h-4" /> All Exams
        </button>
        <button
          onClick={onReview}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition"
        >
          <Eye className="w-4 h-4" /> Review
        </button>
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-slate-800 font-bold shadow hover:bg-white/90 transition"
        >
          <RotateCcw className="w-4 h-4" /> Retake
        </button>
      </div>
    </motion.div>
  );
}

// ─── Review Screen ────────────────────────────────────────────────────────────

function ExamReview({
  exam,
  answers,
  questions,
  onBack,
}: {
  exam: Exam;
  answers: Record<string, number | null>;
  questions: typeof SAMPLE_QUESTIONS;
  onBack: () => void;
}) {
  const [currentQ, setCurrentQ] = useState(0);
  const correct = questions.filter(q => answers[q.id] === q.correctAnswer).length;
  const total = questions.length;
  const score = Math.round((correct / total) * 100);
  const q = questions[currentQ];
  const isCorrect = answers[q.id] === q.correctAnswer;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Question {currentQ + 1}/{total}</span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-1.5 p-2 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-slate-700/50">
        {questions.map((question, i) => {
          const answered = answers[question.id] !== null && answers[question.id] !== undefined;
          const isQCorrect = answers[question.id] === question.correctAnswer;
          return (
            <button
              key={question.id}
              onClick={() => setCurrentQ(i)}
              className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                i === currentQ
                  ? "ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-900"
                  : ""
              } ${
                !answered
                  ? "bg-slate-200 dark:bg-slate-600 text-muted-foreground"
                  : isQCorrect
                  ? "bg-green-500/20 text-green-500"
                  : "bg-red-500/20 text-red-500"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Score summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
          <div className="text-xl font-black text-green-400">{correct}</div>
          <div className="text-[10px] text-muted-foreground">Correct</div>
        </div>
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <div className="text-xl font-black text-red-400">{total - correct}</div>
          <div className="text-[10px] text-muted-foreground">Wrong</div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-white/50 dark:border-slate-700/50 overflow-hidden">
        {/* Status badge */}
        <div className={`px-5 pt-4 pb-2 flex items-center justify-between ${
          isCorrect ? "bg-green-500/10" : "bg-red-500/10"
        }`}>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
            isCorrect
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}>
            {isCorrect ? (
              <><CheckCircle className="w-3.5 h-3.5" /> Correct</>
            ) : (
              <><X className="w-3.5 h-3.5" /> Wrong</>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {answers[q.id] !== null && answers[q.id] !== undefined
              ? `Your answer: ${String.fromCharCode(65 + (answers[q.id] as number))}`
              : "Not answered"}
          </span>
        </div>

        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              q.difficulty === "easy" ? "bg-green-500/15 text-green-400" :
              q.difficulty === "medium" ? "bg-amber-500/15 text-amber-400" :
              "bg-red-500/15 text-red-400"
            }`}>
              {q.difficulty === "easy" ? "Easy" : q.difficulty === "medium" ? "Medium" : "Hard"}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-400">
              {q.jlptLevel}
            </span>
          </div>
          <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{q.question}</p>
        </div>

        {/* Options */}
        <div className="px-5 pb-4 space-y-2">
          {q.options.map((opt, i) => {
            const isYourAnswer = answers[q.id] === i;
            const isCorrectAnswer = i === q.correctAnswer;

            let optClass = "bg-white/60 dark:bg-slate-700/60 border border-transparent";
            if (isCorrectAnswer) {
              optClass = "bg-green-500/15 border-green-500/40";
            } else if (isYourAnswer && !isCorrectAnswer) {
              optClass = "bg-red-500/15 border-red-500/40";
            }

            return (
              <div
                key={i}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm ${optClass}`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  isCorrectAnswer ? "bg-green-500 text-white" :
                  isYourAnswer ? "bg-red-500 text-white" :
                  "bg-slate-100 dark:bg-slate-600 text-muted-foreground"
                }`}>
                  {isCorrectAnswer ? <CheckCircle className="w-3.5 h-3.5" /> :
                   isYourAnswer ? <X className="w-3.5 h-3.5" /> :
                   String.fromCharCode(65 + i)}
                </span>
                <span className={`font-semibold flex-1 ${
                  isCorrectAnswer ? "text-green-400" :
                  isYourAnswer ? "text-red-400" : ""
                }`}>{opt}</span>
                {isYourAnswer && !isCorrectAnswer && (
                  <span className="text-[10px] text-red-400 font-semibold">Your answer</span>
                )}
                {isCorrectAnswer && (
                  <span className="text-[10px] text-green-400 font-semibold">Correct</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        <div className="px-5 pb-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Explanation</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{q.explanation}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrentQ(i => Math.max(0, i - 1))}
          disabled={currentQ === 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-slate-700/50 text-sm font-semibold hover:bg-white transition disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        {currentQ < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(i => i + 1)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 dark:bg-white text-white dark:text-slate-800 font-bold hover:opacity-90 transition"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition"
          >
            <CheckCircle className="w-4 h-4" /> Finish
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/student/exams")({ component: ExamsPage });

function ExamsPage() {
  const [phase, setPhase] = useState<ExamPhase>("list");
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<JLPTLevel | "All">("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "completed">("all");
  const [topicFilter, setTopicFilter] = useState<string>("All Topics");
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const [examHistory, setExamHistory] = useState<Record<number, Record<string, number | null>>>({
    2: { q1: 1, q2: 0, q3: 0, q4: 1, q5: 0 }, // N5 Grammar - example history
    5: { q1: 1, q2: 1, q3: 1, q4: 0, q5: 0 }, // N3 Reading - example history
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save answers when submitting exam
  useEffect(() => {
    if (phase === "result" && selectedExam) {
      setExamHistory(prev => ({
        ...prev,
        [selectedExam.id]: answers
      }));
    }
  }, [phase, selectedExam, answers]);

  useEffect(() => {
    if (phase === "doing" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setShowResult(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const startExam = useCallback((exam: Exam) => {
    setSelectedExam(exam);
    setPhase("intro");
  }, []);

  const confirmStart = useCallback(() => {
    setCurrentQ(0);
    setAnswers({});
    setShowResult(false);
    setTimeLeft((selectedExam?.time ?? 30) * 60);
    setPhase("doing");
  }, [selectedExam]);

  const goBack = useCallback(() => {
    setPhase("list");
    setSelectedExam(null);
    setCurrentQ(0);
    setAnswers({});
    setShowResult(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const retry = useCallback(() => {
    setCurrentQ(0);
    setAnswers({});
    setShowResult(false);
    setTimeLeft((selectedExam?.time ?? 30) * 60);
    setPhase("doing");
  }, [selectedExam]);

  const handleReview = useCallback((exam: Exam) => {
    setSelectedExam(exam);
    const history = examHistory[exam.id];
    if (history) {
      setAnswers(history);
    } else {
      // Generate random answers for demo
      const randomAnswers: Record<string, number | null> = {};
      SAMPLE_QUESTIONS.forEach(q => {
        randomAnswers[q.id] = Math.random() > 0.5 ? Math.floor(Math.random() * 4) : null;
      });
      setAnswers(randomAnswers);
    }
    setPhase("review");
  }, [examHistory]);

  const filteredExams = EXAMS.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (levelFilter !== "All" && e.level !== levelFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (topicFilter !== "All Topics" && e.type !== topicFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredExams.length / ITEMS_PER_PAGE));
  const pagedExams = filteredExams.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset to page 1 whenever filters change
  const handleSetLevel = (lvl: typeof levelFilter) => { setLevelFilter(lvl); setCurrentPage(1); };
  const handleSetTopic = (t: string) => { setTopicFilter(t); setCurrentPage(1); setTopicDropdownOpen(false); };
  const handleSetSearch = (v: string) => { setSearch(v); setCurrentPage(1); };
  const handleSetStatus = (s: typeof statusFilter) => { setStatusFilter(s); setCurrentPage(1); };

  const questions = SAMPLE_QUESTIONS;
  const totalAnswered = Object.values(answers).filter(v => v !== null).length;

  const totalAvailable = EXAMS.length;
  const completedCount = EXAMS.filter(e => e.status === "completed").length;
  const avgScore = Math.round(
    EXAMS.filter(e => e.yourBest !== null)
      .reduce((s, e) => s + (e.yourBest ?? 0), 0) /
    Math.max(1, EXAMS.filter(e => e.yourBest !== null).length)
  );

  // ─── INTRO ────────────────────────────────────────────────────────────────
  if (phase === "intro" && selectedExam) {
    return (
      <div className="max-w-xl mx-auto">
        <ExamIntro exam={selectedExam} onStart={confirmStart} onBack={goBack} />
      </div>
    );
  }

  // ─── REVIEW ──────────────────────────────────────────────────────────────
  if (phase === "review" && selectedExam) {
    return (
      <div className="max-w-lg mx-auto">
        <ExamReview
          exam={selectedExam}
          answers={answers}
          questions={questions}
          onBack={goBack}
        />
      </div>
    );
  }

  // ─── RESULT ───────────────────────────────────────────────────────────────
  if (phase === "result" && selectedExam) {
    return (
      <div className="max-w-lg mx-auto">
        <ExamResult
          exam={selectedExam}
          answers={answers}
          questions={questions}
          onRetry={retry}
          onReview={() => setPhase("review")}
          onBack={goBack}
        />
      </div>
    );
  }

  // ─── DOING ────────────────────────────────────────────────────────────────
  if (phase === "doing" && selectedExam) {
    const q = questions[currentQ];
    const isLowTime = timeLeft < 60;

    return (
      <div className="max-w-lg mx-auto space-y-4">
        {/* Timer bar */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-white/50 dark:border-slate-700/50 px-4 py-3 -mx-4 -mt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition">
              <X className="w-4 h-4" />
            </button>
            <span className={`font-mono font-black text-sm ${isLowTime ? "text-red-500 animate-pulse" : "text-foreground"}`}>
              <Timer className="w-3.5 h-3.5 inline mr-1" />
              {formatTime(timeLeft)}
            </span>
            <button
              onClick={() => { setShowResult(true); setPhase("result"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 text-xs font-bold hover:opacity-90 transition"
            >
              <ChevronRight className="w-3 h-3" /> Submit
            </button>
          </div>
          <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden mb-1.5">
            <motion.div
              animate={{ width: `${(timeLeft / ((selectedExam.time) * 60)) * 100}%` }}
              className={`h-full rounded-full ${isLowTime ? "bg-red-400" : "bg-gradient-to-r from-blue-400 to-pink-400"}`}
            />
          </div>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => { if (!showResult) setCurrentQ(i); }}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  i === currentQ
                    ? "bg-gradient-to-r from-blue-400 to-pink-400"
                    : answers[questions[i]?.id] != null
                    ? "bg-green-400"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>

        <QuestionCard
          q={q}
          index={currentQ}
          total={questions.length}
          selectedAnswer={answers[q.id] ?? null}
          onSelect={(idx) => setAnswers(prev => ({ ...prev, [q.id]: idx }))}
          showResult={showResult}
        />

        {!showResult && (
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentQ(i => Math.max(0, i - 1))}
              disabled={currentQ === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-slate-700/50 text-sm font-semibold hover:bg-white transition disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            {currentQ < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(i => i + 1)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 dark:bg-white text-white dark:text-slate-800 font-bold hover:opacity-90 transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => { setShowResult(true); setPhase("result"); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition"
              >
                <CheckCircle className="w-4 h-4" /> Submit
              </button>
            )}
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground">
          Answered: {totalAnswered}/{questions.length} questions
        </p>
      </div>
    );
  }

  // ─── LIST ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-black">Exams</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Practice with JLPT-aligned quizzes and track your progress.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Exams", value: totalAvailable, icon: TargetIcon, color: "from-blue-500/10 to-purple-500/10", textColor: "text-blue-400" },
          { label: "Completed", value: completedCount, icon: CheckCircle, color: "from-green-500/10 to-emerald-500/10", textColor: "text-green-400" },
          { label: "Avg Score", value: avgScore > 0 ? `${avgScore}%` : "—", icon: Trophy, color: "from-amber-500/10 to-orange-500/10", textColor: "text-amber-400" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${stat.color} border border-white/50 dark:border-slate-700/50`}>
              <Icon className={`w-5 h-5 flex-shrink-0 ${stat.textColor}`} />
              <div>
                <div className={`text-xl font-black leading-tight ${stat.textColor}`}>{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Level filter chips — above search */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {(["All", "N5", "N4", "N3", "N2", "N1"] as const).map(lvl => {
          const count = lvl === "All" ? EXAMS.length : EXAMS.filter(e => e.level === lvl).length;
          const isSelected = levelFilter === lvl;
          return (
            <button
              key={lvl}
              onClick={() => handleSetLevel(lvl)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow"
                  : "bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              <span>{lvl}</span>
              <span className={`text-[10px] ${isSelected ? "text-white/60" : ""}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search row: input + All Topics dropdown */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => handleSetSearch(e.target.value)}
            placeholder="Search exams..."
            className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-slate-700/50 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 text-foreground placeholder:text-muted-foreground"
          />
          {search && (
            <button
              onClick={() => handleSetSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* All Topics dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setTopicDropdownOpen(o => !o)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              topicFilter !== "All Topics"
                ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white border-transparent shadow"
                : "bg-white/70 dark:bg-slate-800/70 border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            <span>{topicFilter}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${topicDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {topicDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-white dark:bg-slate-800 border border-white/50 dark:border-slate-700/50 shadow-xl z-20 overflow-hidden py-1"
              >
                {["All Topics", "Vocabulary", "Grammar", "Listening", "Mixed"].map(t => (
                  <button
                    key={t}
                    onClick={() => handleSetTopic(t)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition ${
                      topicFilter === t
                        ? "bg-blue-500/10 text-blue-500 font-semibold"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    {topicFilter === t && (
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    )}
                    <span className={topicFilter !== t ? "pl-5" : ""}>{t}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status filter — compact row */}
      <div className="flex items-center gap-2">
        {([
          { key: "all", label: "All" },
          { key: "available", label: "Available" },
          { key: "completed", label: "Completed" },
        ] as const).map(s => (
          <button
            key={s.key}
            onClick={() => handleSetStatus(s.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === s.key
                ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow"
                : "bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredExams.length} result{filteredExams.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      {filteredExams.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground font-medium text-sm">No exams found</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            {pagedExams.map(exam => (
              <ExamCard key={exam.id} exam={exam} onStart={startExam} onReview={handleReview} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    page === currentPage
                      ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white shadow"
                      : "bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 dark:bg-slate-800/70 border border-white/50 dark:border-slate-700/50 text-muted-foreground hover:text-foreground transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
