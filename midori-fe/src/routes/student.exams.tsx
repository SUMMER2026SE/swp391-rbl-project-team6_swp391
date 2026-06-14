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
    N5: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/12 dark:text-blue-300",
    N4: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/12 dark:text-violet-300",
    N3: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/12 dark:text-cyan-300",
    N2: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/12 dark:text-indigo-300",
    N1: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-400/20 dark:bg-slate-500/12 dark:text-slate-300",
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
    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground dark:text-white/70">
      <span className={`w-2 h-2 rounded-full ${colors[difficulty]}`} />
      {labels[difficulty]}
    </span>
  );
}

function ExamCard({ exam, onStart, onReview }: { exam: Exam; onStart: (exam: Exam) => void; onReview?: (exam: Exam) => void }) {
  const Icon = exam.typeIcon;
  const isCompleted = exam.status === "completed";

  const accentMap: Record<JLPTLevel, string> = {
    N5: "bg-blue-500 dark:bg-blue-400",
    N4: "bg-violet-500 dark:bg-violet-400",
    N3: "bg-cyan-500 dark:bg-cyan-400",
    N2: "bg-indigo-500 dark:bg-indigo-400",
    N1: "bg-slate-500 dark:bg-slate-400",
  };

  const lightHeaderMap: Record<JLPTLevel, string> = {
    N5: "from-sky-50 via-cyan-50/80 to-indigo-50/70",
    N4: "from-sky-50 via-indigo-50/80 to-violet-50/65",
    N3: "from-cyan-50 via-sky-50/80 to-blue-50/70",
    N2: "from-blue-50 via-indigo-50/85 to-sky-50/70",
    N1: "from-slate-50 via-sky-50/55 to-indigo-50/45",
  };

  const darkHeaderMap: Record<JLPTLevel, string> = {
    N5: "dark:from-blue-500/14 dark:via-cyan-500/8 dark:to-transparent",
    N4: "dark:from-violet-500/14 dark:via-fuchsia-500/8 dark:to-transparent",
    N3: "dark:from-cyan-500/14 dark:via-blue-500/8 dark:to-transparent",
    N2: "dark:from-indigo-500/14 dark:via-violet-500/8 dark:to-transparent",
    N1: "dark:from-slate-500/14 dark:via-slate-400/8 dark:to-transparent",
  };

  const iconToneMap: Record<JLPTLevel, string> = {
    N5: "bg-gradient-to-br from-sky-100 to-cyan-50 text-blue-600 ring-1 ring-sky-200 shadow-sm shadow-sky-100/70 dark:from-blue-500/18 dark:to-cyan-500/12 dark:text-blue-300 dark:ring-blue-400/15 dark:shadow-none",
    N4: "bg-gradient-to-br from-indigo-100 to-violet-50 text-indigo-600 ring-1 ring-indigo-200 shadow-sm shadow-indigo-100/70 dark:from-violet-500/18 dark:to-fuchsia-500/12 dark:text-violet-300 dark:ring-violet-400/15 dark:shadow-none",
    N3: "bg-gradient-to-br from-cyan-100 to-sky-50 text-cyan-600 ring-1 ring-cyan-200 shadow-sm shadow-cyan-100/70 dark:from-cyan-500/18 dark:to-blue-500/12 dark:text-cyan-300 dark:ring-cyan-400/15 dark:shadow-none",
    N2: "bg-gradient-to-br from-blue-100 to-indigo-50 text-indigo-600 ring-1 ring-blue-200 shadow-sm shadow-blue-100/70 dark:from-indigo-500/18 dark:to-violet-500/12 dark:text-indigo-300 dark:ring-indigo-400/15 dark:shadow-none",
    N1: "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 ring-1 ring-slate-200 shadow-sm shadow-slate-200/70 dark:from-slate-500/18 dark:to-slate-400/12 dark:text-slate-300 dark:ring-slate-400/15 dark:shadow-none",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-0.5 hover:border-sky-200/90 hover:shadow-[0_16px_34px_rgba(37,99,235,0.10)] dark:border-slate-700/55 dark:bg-slate-900/72 dark:shadow-black/10 dark:hover:border-slate-600/70 dark:hover:shadow-black/20"
      onClick={() => onStart(exam)}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentMap[exam.level]}`} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/90 to-transparent dark:via-white/10" />

      <div className={`relative min-h-[180px] border-b border-slate-200/85 px-4 pt-4 pb-3 bg-gradient-to-br ${lightHeaderMap[exam.level]} ${darkHeaderMap[exam.level]} dark:border-slate-700/55`}>
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconToneMap[exam.level]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <LevelBadge level={exam.level} />
            {isCompleted && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-500/12 dark:text-emerald-300">
                <CheckCircle className="w-3 h-3" /> Done
              </span>
            )}
          </div>
        </div>

        <h3 className="mt-3 font-display text-sm font-black leading-tight text-slate-900 dark:text-white">{exam.title}</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-white/60">{exam.description}</p>

        <div className="mt-2 flex flex-wrap gap-1">
          {exam.tags.map(tag => (
            <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-white/10 dark:bg-white/8 dark:text-white/70">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="relative space-y-2 px-4 py-3 dark:bg-slate-900/72">
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
            <span className="ml-auto flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 font-bold text-green-600 dark:border-emerald-400/14 dark:bg-emerald-500/12 dark:text-green-400">
              <Trophy className="w-3.5 h-3.5" /> Best: {exam.yourBest}%
            </span>
          )}
        </div>

        <div className="mt-2 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onStart(exam); }}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
              isCompleted
                ? "border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-400/16 dark:bg-blue-500/12 dark:text-blue-400 dark:hover:bg-blue-500/18"
                : "border border-transparent bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm shadow-blue-900/10 hover:opacity-95 dark:from-blue-600 dark:to-indigo-500 dark:shadow-black/20"
            }`}
          >
            {isCompleted ? (
              <><RotateCcw className="w-3.5 h-3.5" /> Retake</>
            ) : (
              <><Play className="w-3.5 h-3.5" /> Start</>
            )}
          </button>
          {isCompleted && onReview && (
            <button
              onClick={(e) => { e.stopPropagation(); onReview(exam); }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-blue-600 transition-all hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700/60 dark:bg-slate-800/85 dark:text-blue-400 dark:hover:border-blue-400/18 dark:hover:bg-blue-500/10"
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

  const accentMap: Record<JLPTLevel, string> = {
    N5: "bg-blue-500 dark:bg-blue-400",
    N4: "bg-violet-500 dark:bg-violet-400",
    N3: "bg-cyan-500 dark:bg-cyan-400",
    N2: "bg-indigo-500 dark:bg-indigo-400",
    N1: "bg-slate-500 dark:bg-slate-400",
  };

  const lightHeaderMap: Record<JLPTLevel, string> = {
    N5: "from-sky-50 via-cyan-50/80 to-indigo-50/70",
    N4: "from-sky-50 via-indigo-50/80 to-violet-50/65",
    N3: "from-cyan-50 via-sky-50/80 to-blue-50/70",
    N2: "from-blue-50 via-indigo-50/85 to-sky-50/70",
    N1: "from-slate-50 via-sky-50/55 to-indigo-50/45",
  };

  const darkHeaderMap: Record<JLPTLevel, string> = {
    N5: "dark:from-blue-500/14 dark:via-cyan-500/8 dark:to-transparent",
    N4: "dark:from-violet-500/14 dark:via-fuchsia-500/8 dark:to-transparent",
    N3: "dark:from-cyan-500/14 dark:via-blue-500/8 dark:to-transparent",
    N2: "dark:from-indigo-500/14 dark:via-violet-500/8 dark:to-transparent",
    N1: "dark:from-slate-500/14 dark:via-slate-400/8 dark:to-transparent",
  };

  const iconToneMap: Record<JLPTLevel, string> = {
    N5: "bg-gradient-to-br from-blue-100 to-cyan-50 text-blue-600 ring-1 ring-blue-200 dark:from-blue-500/18 dark:to-cyan-500/12 dark:text-blue-300 dark:ring-blue-400/15",
    N4: "bg-gradient-to-br from-violet-100 to-fuchsia-50 text-violet-600 ring-1 ring-violet-200 dark:from-violet-500/18 dark:to-fuchsia-500/12 dark:text-violet-300 dark:ring-violet-400/15",
    N3: "bg-gradient-to-br from-cyan-100 to-blue-50 text-cyan-600 ring-1 ring-cyan-200 dark:from-cyan-500/18 dark:to-blue-500/12 dark:text-cyan-300 dark:ring-cyan-400/15",
    N2: "bg-gradient-to-br from-indigo-100 to-violet-50 text-indigo-600 ring-1 ring-indigo-200 dark:from-indigo-500/18 dark:to-violet-500/12 dark:text-indigo-300 dark:ring-indigo-400/15",
    N1: "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 ring-1 ring-slate-200 dark:from-slate-500/18 dark:to-slate-400/12 dark:text-slate-300 dark:ring-slate-400/15",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-xl"
    >
      <div className="group relative mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60 dark:border-slate-700/55 dark:bg-slate-900/72 dark:shadow-black/10">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentMap[exam.level]}`} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />
        <div className={`relative min-h-[240px] border-b border-slate-200 bg-gradient-to-br px-5 pt-5 pb-4 ${lightHeaderMap[exam.level]} ${darkHeaderMap[exam.level]} dark:border-slate-700/55`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${iconToneMap[exam.level]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <LevelBadge level={exam.level} />
                  {exam.yourBest !== null && (
                    <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-500/12 dark:text-emerald-300">
                      <Trophy className="w-3.5 h-3.5" /> {exam.yourBest}%
                    </span>
                  )}
                </div>
                <h2 className="font-display text-lg font-black leading-tight text-slate-900 dark:text-white">
                  {exam.title}
                </h2>
                <p className="max-w-lg text-xs leading-relaxed text-slate-600 dark:text-white/70">
                  {exam.description}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/55">
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Questions</span>
                  </div>
                  <div className="mt-1 font-black text-foreground">{exam.questions}</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Time</span>
                  </div>
                  <div className="mt-1 font-black text-foreground">{exam.time}m</div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground">
                    <Target className="w-3.5 h-3.5" />
                    <span>Level</span>
                  </div>
                  <div className="mt-1 font-black text-foreground">{exam.level}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { icon: Timer, label: `${exam.time} min countdown` },
              { icon: CheckCircle, label: "Change answers freely" },
              { icon: TrendingUp, label: "Detailed explanations" },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-600 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-white/65"
                >
                  <ItemIcon className="h-3.5 w-3.5 text-blue-500 dark:text-blue-300" />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative px-5 py-4">
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-semibold shadow-sm transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700/60 dark:bg-slate-800/75 dark:hover:border-slate-600/70 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={onStart}
              className="flex-[2] flex items-center justify-center gap-2 rounded-xl border border-transparent bg-gradient-to-r from-sky-600 to-indigo-600 py-3 font-bold text-white shadow-sm shadow-blue-900/10 transition hover:opacity-95 dark:from-blue-600 dark:to-indigo-500 dark:shadow-black/20"
            >
              <Play className="w-4 h-4" /> Start Exam
            </button>
          </div>
        </div>
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
  const isLoading = false;
  const error: string | null = null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
        <p className="text-muted-foreground text-sm">Loading exams...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="text-red-500 mb-3 text-2xl">⚠️</div>
        <p className="text-red-500 font-medium text-sm">Unable to load exams.</p>
      </div>
    );
  }

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
      // No prior attempt recorded for this exam in this session. In demo
      // mode we do NOT fabricate a random answer set — that would mislead
      // students into thinking they had taken the exam. Leave answers
      // empty so the review screen shows "Not answered" for every question.
      setAnswers({});
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

  // ─── DOING ───────────────────────────────────────────────────────────────
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-black">Exams</h1>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-sm">
              Demo
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Practice with JLPT-aligned quizzes and track your progress.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Exams", value: totalAvailable, icon: TargetIcon, color: "from-sky-100/80 to-white dark:from-blue-500/12 dark:to-transparent", textColor: "text-blue-500", iconWrap: "bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-500/12 dark:ring-blue-400/10" },
          { label: "Completed", value: completedCount, icon: CheckCircle, color: "from-cyan-100/75 to-white dark:from-cyan-500/12 dark:to-transparent", textColor: "text-cyan-500", iconWrap: "bg-cyan-50 ring-1 ring-cyan-100 dark:bg-cyan-500/12 dark:ring-cyan-400/10" },
          { label: "Avg Score", value: avgScore > 0 ? `${avgScore}%` : "—", icon: Trophy, color: "from-indigo-100/75 to-white dark:from-violet-500/12 dark:to-transparent", textColor: "text-indigo-500", iconWrap: "bg-indigo-50 ring-1 ring-indigo-100 dark:bg-violet-500/12 dark:ring-violet-400/10" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm shadow-slate-200/35 dark:border-slate-700/55 dark:bg-slate-900/72 dark:shadow-black/10">
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color}`} />
              <div className="relative flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconWrap}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${stat.textColor}`} />
                </div>
                <div>
                  <div className={`text-xl font-black leading-tight ${stat.textColor}`}>{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                </div>
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
                  ? "border border-blue-200/90 bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-sm shadow-blue-900/10 dark:from-blue-600 dark:to-indigo-500 dark:border-transparent dark:shadow-black/20"
                  : "bg-white/75 dark:bg-slate-900/72 border border-slate-200/70 dark:border-slate-700/55 text-muted-foreground hover:border-blue-400/20 hover:bg-blue-500/5 hover:text-foreground dark:hover:border-blue-400/16 dark:hover:bg-blue-500/8"
              }`}
            >
              <span>{lvl}</span>
              <span className={`text-[10px] ${isSelected ? "text-white/65" : ""}`}>{count}</span>
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
            className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white/78 dark:bg-slate-900/72 border border-slate-200/70 dark:border-slate-700/55 shadow-sm shadow-slate-200/35 dark:shadow-black/10 text-sm outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/20 text-foreground placeholder:text-muted-foreground"
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
                  ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white border border-blue-200/80 shadow-sm shadow-blue-900/10 dark:from-blue-600 dark:to-indigo-500 dark:border-transparent dark:shadow-black/20"
                : "bg-white/75 dark:bg-slate-900/72 border-slate-200/70 dark:border-slate-700/55 text-muted-foreground hover:text-foreground hover:border-blue-400/20 hover:bg-blue-500/5 dark:hover:border-blue-400/16 dark:hover:bg-blue-500/8"
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
                className="absolute right-0 top-full mt-1.5 z-20 w-44 overflow-hidden rounded-xl border border-slate-200/70 bg-white/96 py-1 shadow-xl shadow-slate-200/35 dark:border-slate-700/55 dark:bg-slate-900/95 dark:shadow-black/25"
              >
                {["All Topics", "Vocabulary", "Grammar", "Listening", "Mixed"].map(t => (
                  <button
                    key={t}
                    onClick={() => handleSetTopic(t)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition ${
                      topicFilter === t
                        ? "bg-blue-500/8 text-blue-500 font-semibold dark:bg-blue-500/10"
                        : "text-muted-foreground hover:bg-blue-500/5 hover:text-foreground dark:hover:bg-slate-800/90"
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
                ? "border border-blue-200/90 bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-sm shadow-blue-900/10 dark:from-blue-600 dark:to-indigo-500 dark:border-transparent dark:shadow-black/20"
                : "bg-white/75 dark:bg-slate-900/72 border border-slate-200/70 dark:border-slate-700/55 text-muted-foreground hover:border-blue-400/20 hover:bg-blue-500/5 hover:text-foreground dark:hover:border-blue-400/16 dark:hover:bg-blue-500/8"
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
          <p className="text-muted-foreground font-medium text-sm">No exams available.</p>
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
