import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Target,
  Volume2,
  Layers,
  Pencil,
  BookOpen,
  BrainCircuit,
  Zap,
  RotateCcw,
  Play,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import { LESSONS, getLessonById, speakJapanese } from "@/data/japanese-learning-data";

export const Route = createFileRoute("/student/learning/japanese/quiz")({
  component: QuizHubPage,
});

type QuizType =
  | "recognition"
  | "listening"
  | "matching"
  | "wordbuilding"
  | "fillblank"
  | "romaji-to-char";

const QUIZ_TYPES: {
  id: QuizType;
  title: string;
  description: string;
  icon: typeof Target;
  color: string;
  questionCount: number;
  difficulty: 1 | 2 | 3;
}[] = [
  {
    id: "recognition",
    title: "Recognition Quiz",
    description: "See a character and identify its romaji reading",
    icon: Target,
    color: "from-pink-400 to-rose-500",
    questionCount: 10,
    difficulty: 1,
  },
  {
    id: "romaji-to-char",
    title: "Romaji to Hiragana",
    description: "See romaji and select the correct Hiragana character",
    icon: Volume2,
    color: "from-green-400 to-emerald-500",
    questionCount: 10,
    difficulty: 1,
  },
  {
    id: "listening",
    title: "Listening Quiz",
    description: "Listen to audio and identify the character",
    icon: Volume2,
    color: "from-blue-400 to-cyan-500",
    questionCount: 10,
    difficulty: 2,
  },
  {
    id: "matching",
    title: "Matching Quiz",
    description: "Match characters to their meanings",
    icon: Layers,
    color: "from-purple-400 to-violet-500",
    questionCount: 8,
    difficulty: 2,
  },
  {
    id: "wordbuilding",
    title: "Word Building",
    description: "Build words from their romaji components",
    icon: Pencil,
    color: "from-emerald-400 to-teal-500",
    questionCount: 8,
    difficulty: 3,
  },
  {
    id: "fillblank",
    title: "Fill in the Blank",
    description: "Complete words with missing characters",
    icon: BookOpen,
    color: "from-amber-400 to-orange-500",
    questionCount: 10,
    difficulty: 2,
  },
];

export const RouteQuizType = createFileRoute("/student/learning/japanese/quiz/$quizType")({
  component: QuizPage,
});

function QuizHubPage() {
  const [selectedLesson, setSelectedLesson] = useState<string>("all");
  const [showLessonSelect, setShowLessonSelect] = useState(false);
  const [selectedQuizType, setSelectedQuizType] = useState<QuizType | null>(null);

  const filteredLessons =
    selectedLesson === "all" ? LESSONS : LESSONS.filter((l) => l.id === selectedLesson);

  // If quiz type is selected, show lesson selection
  if (selectedQuizType) {
    return (
      <div className="min-h-screen">
        <SakuraBg count={15} />
        <div className="relative z-10">
          <div className="w-full max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <button
                onClick={() => setSelectedQuizType(null)}
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                  Select Lesson
                </h1>
                <p className="text-sm text-slate-500 dark:text-indigo-200/60">
                  Choose a lesson for {selectedQuizType} quiz
                </p>
              </div>
            </div>

            {/* Lesson Selection */}
            <div className="space-y-3">
              {/* All Lessons option */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  window.location.href = `/student/learning/japanese/quiz/${selectedQuizType}?lesson=all`;
                }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/80 dark:bg-indigo-950/50 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gradient-hero flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  <BrainCircuit className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 dark:text-white">All Characters</h3>
                  <p className="text-sm text-slate-500 dark:text-indigo-200/60">
                    Test on all available characters
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </motion.button>

              {LESSONS.map((lesson, index) => (
                <motion.button
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index + 1) * 0.05 }}
                  onClick={() => {
                    window.location.href = `/student/learning/japanese/quiz/${selectedQuizType}?lesson=${lesson.id}`;
                  }}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/80 dark:bg-indigo-950/50 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl font-bold text-white shadow-lg",
                      lesson.color,
                    )}
                  >
                    {lesson.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white">{lesson.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-indigo-200/60">
                      {lesson.characters.length} characters
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SakuraBg count={15} />
      <div className="relative z-10">
        <div className="w-full max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link
              to="/student/learning/japanese"
              className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">Quizzes</h1>
              <p className="text-sm text-slate-500 dark:text-indigo-200/60">
                Test your Japanese character knowledge
              </p>
            </div>
          </div>

          {/* Quiz Types */}
          <div className="space-y-4">
            {QUIZ_TYPES.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => setSelectedQuizType(quiz.id)}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl bg-white/80 dark:bg-indigo-950/50 backdrop-blur-sm border border-slate-200/60 dark:border-white/10 hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                >
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                      quiz.color,
                    )}
                  >
                    <quiz.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 dark:text-white">{quiz.title}</h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          quiz.difficulty === 1
                            ? "bg-green-500/20 text-green-600"
                            : quiz.difficulty === 2
                              ? "bg-amber-500/20 text-amber-600"
                              : "bg-red-500/20 text-red-600",
                        )}
                      >
                        {quiz.difficulty === 1 ? "Easy" : quiz.difficulty === 2 ? "Medium" : "Hard"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-indigo-200/60">
                      {quiz.description}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-indigo-200/40 mt-1">
                      {quiz.questionCount} questions
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ RECOGNITION QUIZ PAGE ============
function QuizPage() {
  const { quizType } = RouteQuizType.useParams();
  const searchParams = RouteQuizType.useSearch();
  const lessonId = searchParams.lesson || "all";

  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [lives, setLives] = useState(3);

  // Get characters based on lesson and quiz type
  const getCharacters = () => {
    let chars = [...HIRAGANA_BASIC, ...KATAKANA_BASIC];

    // For romaji-to-char, only show hiragana
    if (quizType === "romaji-to-char") {
      chars = [...HIRAGANA_BASIC];
    }

    if (lessonId === "all") {
      return chars.slice(0, 46); // Limit to 46 for basic quiz
    }
    const lesson = getLessonById(lessonId);
    return lesson?.characters || chars.slice(0, 10);
  };

  // Generate questions based on quiz type
  const generateQuestions = () => {
    const chars = getCharacters();
    const shuffled = [...chars].sort(() => Math.random() - 0.5).slice(0, 10);

    return shuffled.map((char) => {
      // For romaji-to-char: show romaji, options are hiragana characters
      if (quizType === "romaji-to-char") {
        const wrongOptions = chars
          .filter((c) => c.romaji !== char.romaji)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((c) => c.char);

        return {
          type: "romaji-to-char" as const,
          romaji: char.romaji,
          char: char.char,
          options: [char.char, ...wrongOptions].sort(() => Math.random() - 0.5),
          correctAnswer: char.char,
        };
      }

      // For other quizzes: show character, options are romaji
      const wrongOptions = chars
        .filter((c) => c.romaji !== char.romaji)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((c) => c.romaji);

      return {
        type: quizType as QuizType,
        char: char.char,
        romaji: char.romaji,
        options: [char.romaji, ...wrongOptions].sort(() => Math.random() - 0.5),
        correctAnswer: char.romaji,
      };
    });
  };

  const startQuiz = () => {
    setQuestions(generateQuestions());
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
    setLives(3);
    setQuizStarted(true);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    // For romaji-to-char, correct answer is the character, not romaji
    const currentQ = questions[currentIdx];
    const correctAnswer =
      currentQ.type === "romaji-to-char" ? currentQ.correctAnswer : currentQ.romaji;
    const isCorrect = answer === correctAnswer;

    if (isCorrect) {
      setScore((s) => s + 1);
    } else {
      setLives((l) => l - 1);
      if (lives <= 1) {
        setQuizFinished(true);
      }
    }

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((i) => i + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
      }
    }, 1000);
  };

  const retryQuiz = () => {
    startQuiz();
  };

  if (!quizStarted) {
    return (
      <div className="min-h-screen">
        <SakuraBg count={15} />
        <div className="relative z-10">
          <div className="w-full max-w-lg mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-8">
              <Link
                to="/student/learning/japanese/quiz"
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                  {quizType === "recognition"
                    ? "Recognition"
                    : quizType === "romaji-to-char"
                      ? "Romaji to Hiragana"
                      : quizType === "listening"
                        ? "Listening"
                        : quizType === "matching"
                          ? "Matching"
                          : quizType === "wordbuilding"
                            ? "Word Building"
                            : "Fill in the Blank"}{" "}
                  Quiz
                </h1>
                <p className="text-sm text-slate-500 dark:text-indigo-200/60">
                  {lessonId === "all" ? "All Characters" : getLessonById(lessonId)?.title}
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-indigo-950/50 rounded-3xl p-8 text-center border border-slate-200/60 dark:border-white/20">
              <div
                className={cn(
                  "w-20 h-20 rounded-full mx-auto mb-6 bg-gradient-to-br flex items-center justify-center",
                  quizType === "recognition"
                    ? "from-pink-400 to-rose-500"
                    : quizType === "romaji-to-char"
                      ? "from-green-400 to-emerald-500"
                      : quizType === "listening"
                        ? "from-blue-400 to-cyan-500"
                        : quizType === "matching"
                          ? "from-purple-400 to-violet-500"
                          : quizType === "wordbuilding"
                            ? "from-emerald-400 to-teal-500"
                            : "from-amber-400 to-orange-500",
                )}
              >
                <Trophy className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                Ready to Quiz?
              </h2>
              <p className="text-slate-600 dark:text-indigo-200/80 mb-6">
                {quizType === "recognition"
                  ? "Identify romaji readings from characters"
                  : quizType === "romaji-to-char"
                    ? "Select the correct Hiragana for the romaji shown"
                    : quizType === "listening"
                      ? "Listen and identify characters"
                      : quizType === "matching"
                        ? "Match characters to meanings"
                        : quizType === "wordbuilding"
                          ? "Build words from components"
                          : "Complete words with missing characters"}
              </p>

              <div className="flex items-center justify-center gap-6 text-sm text-slate-500 dark:text-indigo-200/60 mb-6">
                <span>10 questions</span>
                <span>•</span>
                <span>3 lives</span>
              </div>

              <button
                onClick={startQuiz}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold hover:opacity-90 transition",
                  quizType === "recognition"
                    ? "bg-gradient-to-r from-pink-500 to-purple-500"
                    : quizType === "romaji-to-char"
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : quizType === "listening"
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                        : quizType === "matching"
                          ? "bg-gradient-to-r from-purple-500 to-violet-500"
                          : quizType === "wordbuilding"
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : "bg-gradient-to-r from-amber-500 to-orange-500",
                )}
              >
                <Play className="w-5 h-5" />
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (quizFinished) {
    const finalScore = Math.round((score / questions.length) * 100);
    const passed = finalScore >= 70;

    return (
      <div className="min-h-screen">
        <SakuraBg count={15} />
        <div className="relative z-10">
          <div className="w-full max-w-lg mx-auto px-4 py-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/80 dark:bg-indigo-950/50 rounded-3xl p-8 text-center border border-slate-200/60 dark:border-white/20"
            >
              <div
                className={cn(
                  "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center",
                  passed
                    ? "bg-gradient-to-br from-green-400 to-emerald-500"
                    : "bg-gradient-to-br from-amber-400 to-orange-500",
                )}
              >
                <Trophy className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                {passed ? "Great Job!" : "Keep Practicing!"}
              </h2>

              <div className="text-6xl font-black text-primary mb-2">{finalScore}%</div>
              <p className="text-slate-600 dark:text-indigo-200/80 mb-6">
                {score} out of {questions.length} correct
              </p>

              <div className="h-3 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden mb-6">
                <div
                  className={cn(
                    "h-full rounded-full",
                    passed
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : "bg-gradient-to-r from-amber-400 to-orange-500",
                  )}
                  style={{ width: `${finalScore}%` }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={retryQuiz}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100/80 dark:bg-white/10 text-slate-700 dark:text-white font-bold hover:bg-slate-200 transition"
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Again
                </button>
                <Link
                  to="/student/learning/japanese/quiz"
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold hover:opacity-90 transition"
                >
                  More Quizzes
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="min-h-screen">
      <SakuraBg count={15} />
      <div className="relative z-10">
        <div className="w-full max-w-lg mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/student/learning/japanese/quiz"
              className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
            </Link>
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 rounded-full",
                    i < lives ? "bg-red-500" : "bg-slate-300 dark:bg-white/20",
                  )}
                />
              ))}
            </div>
            <span className="font-bold text-slate-800 dark:text-white">
              {score}/{questions.length}
            </span>
          </div>

          {/* Progress */}
          <div className="h-2 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden mb-6">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                quizType === "recognition"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500"
                  : quizType === "romaji-to-char"
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : quizType === "listening"
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                      : quizType === "matching"
                        ? "bg-gradient-to-r from-purple-500 to-violet-500"
                        : quizType === "wordbuilding"
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                          : "bg-gradient-to-r from-amber-500 to-orange-500",
              )}
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/80 dark:bg-indigo-950/50 rounded-3xl p-8 text-center border border-slate-200/60 dark:border-white/20 shadow-xl mb-6"
          >
            {currentQuestion.type === "romaji-to-char" ? (
              <>
                <p className="text-sm text-slate-500 dark:text-indigo-200/60 mb-4">
                  Which Hiragana character matches this romaji?
                </p>
                <div className="text-5xl font-black text-emerald-600 dark:text-emerald-400 mb-4">
                  {currentQuestion.romaji}
                </div>
                <button
                  onClick={() => speakJapanese(currentQuestion.char)}
                  className="p-2 rounded-xl bg-slate-100/80 dark:bg-white/10 text-slate-500 hover:text-emerald-500 transition"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500 dark:text-indigo-200/60 mb-4">
                  What is the romaji for this character?
                </p>
                <div
                  className="text-8xl font-black text-slate-800 dark:text-white mb-4"
                  style={{ fontFamily: "var(--font-japanese)" }}
                >
                  {currentQuestion.char}
                </div>
                <button
                  onClick={() => speakJapanese(currentQuestion.char)}
                  className="p-2 rounded-xl bg-slate-100/80 dark:bg-white/10 text-slate-500 hover:text-primary transition"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </>
            )}
          </motion.div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option: string) => {
              const isSelected = selectedAnswer === option;
              const isCorrect =
                option ===
                (currentQuestion.type === "romaji-to-char"
                  ? currentQuestion.correctAnswer
                  : currentQuestion.romaji);
              const showCorrect = selectedAnswer && isCorrect;
              const showIncorrect = selectedAnswer && isSelected && !isCorrect;

              let btnStyle =
                "bg-white/80 dark:bg-indigo-950/50 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white";

              // For romaji-to-char, style the hiragana options
              if (currentQuestion.type === "romaji-to-char") {
                btnStyle =
                  "bg-white/80 dark:bg-indigo-950/50 border border-slate-200/60 dark:border-white/20";
                if (showCorrect) {
                  btnStyle = "bg-green-500/20 border-2 border-green-500/40";
                } else if (showIncorrect) {
                  btnStyle = "bg-red-500/20 border-2 border-red-500/40";
                } else if (selectedAnswer) {
                  btnStyle = "bg-slate-100/50 text-slate-400 cursor-default";
                } else {
                  btnStyle += " hover:bg-slate-100 hover:border-slate-300 transition-all";
                }
              } else {
                if (showCorrect) {
                  btnStyle = "bg-green-500/20 border-2 border-green-500/40 text-green-600";
                } else if (showIncorrect) {
                  btnStyle = "bg-red-500/20 border-2 border-red-500/40 text-red-600";
                } else if (selectedAnswer) {
                  btnStyle = "bg-slate-100/50 text-slate-400 cursor-default";
                } else {
                  btnStyle += " hover:bg-slate-100 hover:border-slate-300 transition-all";
                }
              }

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={!!selectedAnswer}
                  className={cn(
                    "py-4 rounded-2xl font-bold text-center transition-all",
                    currentQuestion.type === "romaji-to-char" ? "text-4xl" : "text-xl",
                    btnStyle,
                  )}
                  style={
                    currentQuestion.type === "romaji-to-char"
                      ? { fontFamily: "var(--font-japanese)" }
                      : {}
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Import character data for quiz
import { HIRAGANA_BASIC, KATAKANA_BASIC } from "@/data/japanese-learning-data";
