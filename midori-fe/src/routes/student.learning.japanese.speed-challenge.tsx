import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Zap,
  Volume2,
  Play,
  RotateCcw,
  Trophy,
  Target,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Pause,
  Volume1,
} from "lucide-react";
import { SakuraBg } from "@/components/sakura-bg";
import { cn } from "@/lib/utils";
import {
  HIRAGANA_BASIC,
  KATAKANA_BASIC,
  speakJapanese,
} from "@/data/japanese-learning-data";

export const Route = createFileRoute("/student/learning/japanese/speed-challenge")({
  component: SpeedChallengePage,
});

interface SpeedQuestion {
  char: string;
  romaji: string;
  options: string[];
}

function SpeedChallengePage() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "paused" | "finished">("idle");
  const [questions, setQuestions] = useState<SpeedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem("speed-challenge-highscore");
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Generate questions
  const generateQuestions = useCallback(() => {
    const allChars = [...HIRAGANA_BASIC, ...KATAKANA_BASIC];
    const shuffled = [...allChars].sort(() => Math.random() - 0.5).slice(0, 30);

    return shuffled.map((char) => {
      const wrongOptions = allChars
        .filter((c) => c.romaji !== char.romaji)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((c) => c.romaji);

      return {
        char: char.char,
        romaji: char.romaji,
        options: [char.romaji, ...wrongOptions].sort(() => Math.random() - 0.5),
      };
    });
  }, []);

  // Timer
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setGameState("finished");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  const startGame = () => {
    setQuestions(generateQuestions());
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(60);
    setSelectedAnswer(null);
    setShowResult(false);
    setGameState("playing");
  };

  const pauseGame = () => {
    setGameState("paused");
  };

  const resumeGame = () => {
    setGameState("playing");
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer || showResult) return;

    setSelectedAnswer(answer);
    const isCorrect = answer === questions[currentIdx].romaji;

    if (isCorrect) {
      setScore((s) => s + 10 + streak * 2);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    setShowResult(true);

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((i) => i + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setGameState("finished");
      }
    }, 300);
  };

  const endGame = useCallback(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem("speed-challenge-highscore", score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    if (gameState === "finished") {
      endGame();
    }
  }, [gameState, endGame]);

  // Idle State
  if (gameState === "idle") {
    return (
      <div className="min-h-screen">
        <SakuraBg count={15} />
        <div className="relative z-10">
          <div className="w-full max-w-lg mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <Link
                to="/student/learning/japanese"
                className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">Speed Challenge</h1>
                <p className="text-sm text-slate-500 dark:text-indigo-200/60">Test your recognition speed</p>
              </div>
            </div>

            {/* High Score */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10 rounded-2xl p-5 border border-amber-200/40 dark:border-amber-500/20 mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-amber-500" />
                <div>
                  <div className="text-sm text-slate-500 dark:text-indigo-200/60">High Score</div>
                  <div className="text-2xl font-black text-slate-800 dark:text-white">{highScore}</div>
                </div>
              </div>
            </div>

            {/* Game Info */}
            <div className="bg-white/80 dark:bg-indigo-950/50 rounded-3xl p-8 text-center border border-slate-200/60 dark:border-white/20 mb-6">
              <div className={cn(
                "w-20 h-20 rounded-full mx-auto mb-6 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl"
              )}>
                <Zap className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ready to Race?</h2>
              <p className="text-slate-600 dark:text-indigo-200/80 mb-6">
                Answer as many questions as you can in 60 seconds. Build combos for bonus points!
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
                <div className="bg-slate-100/60 dark:bg-white/5 rounded-xl p-3">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-slate-500" />
                  <div className="font-bold text-slate-700 dark:text-white">60 sec</div>
                  <div className="text-xs text-slate-500">Time Limit</div>
                </div>
                <div className="bg-slate-100/60 dark:bg-white/5 rounded-xl p-3">
                  <Target className="w-5 h-5 mx-auto mb-1 text-slate-500" />
                  <div className="font-bold text-slate-700 dark:text-white">10 pts</div>
                  <div className="text-xs text-slate-500">Per Correct</div>
                </div>
                <div className="bg-slate-100/60 dark:bg-white/5 rounded-xl p-3">
                  <Zap className="w-5 h-5 mx-auto mb-1 text-slate-500" />
                  <div className="font-bold text-slate-700 dark:text-white">+2 pts</div>
                  <div className="text-xs text-slate-500">Per Streak</div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition shadow-lg"
              >
                <Play className="w-5 h-5" />
                Start Challenge
              </button>
            </div>

            {/* Tips */}
            <div className="bg-slate-100/60 dark:bg-white/5 rounded-xl p-4 border border-slate-200/40 dark:border-white/10">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-indigo-200/80">
                <Star className="w-4 h-4 text-amber-500" />
                <span>Tip: Build streaks for bonus points!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Finished State
  if (gameState === "finished") {
    const finalScore = score;
    const questionsAnswered = currentIdx + 1;
    const accuracy = questionsAnswered > 0 ? Math.round((score / (questionsAnswered * 10 + streak * 2)) * 100) : 0;
    const isNewHighScore = finalScore >= highScore && finalScore > 0;

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
              {isNewHighScore && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mb-4"
                >
                  <span className="inline-block px-4 py-1 rounded-full bg-amber-500 text-white text-sm font-bold">
                    New High Score!
                  </span>
                </motion.div>
              )}

              <div className={cn(
                "w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center",
                isNewHighScore
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : "bg-gradient-to-br from-blue-400 to-purple-500"
              )}>
                <Trophy className="w-12 h-12 text-white" />
              </div>

              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                {isNewHighScore ? "Amazing!" : "Time's Up!"}
              </h2>

              <div className="text-6xl font-black text-primary mb-2">{finalScore}</div>
              <p className="text-slate-600 dark:text-indigo-200/80 mb-6">points</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-100/60 dark:bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-black text-slate-800 dark:text-white">{questionsAnswered}</div>
                  <div className="text-xs text-slate-500">Questions</div>
                </div>
                <div className="bg-slate-100/60 dark:bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-black text-slate-800 dark:text-white">{streak}</div>
                  <div className="text-xs text-slate-500">Best Streak</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startGame}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition"
                >
                  <RotateCcw className="w-5 h-5" />
                  Play Again
                </button>
                <Link
                  to="/student/learning/japanese"
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100/80 dark:bg-white/10 text-slate-700 dark:text-white font-bold hover:bg-slate-200 transition"
                >
                  Back
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Playing or Paused State
  const currentQuestion = questions[currentIdx];

  return (
    <div className="min-h-screen">
      <SakuraBg count={15} />
      <div className="relative z-10">
        <div className="w-full max-w-lg mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={pauseGame}
              className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center hover:bg-white/80 transition"
            >
              <Pause className="w-5 h-5 text-slate-700 dark:text-white" />
            </button>

            {/* Timer */}
            <div className={cn(
              "px-4 py-2 rounded-full font-black text-lg",
              timeLeft <= 10
                ? "bg-red-500/20 text-red-500"
                : "bg-slate-100/80 dark:bg-white/10 text-slate-700 dark:text-white"
            )}>
              {timeLeft}s
            </div>

            {/* Score */}
            <div className="px-4 py-2 rounded-full bg-amber-500/20 text-amber-600 font-black text-lg">
              {score}
            </div>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center mb-4"
            >
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold">
                <Zap className="w-4 h-4" />
                {streak} Streak! +{streak * 2} bonus
              </span>
            </motion.div>
          )}

          {/* Progress */}
          <div className="h-1.5 bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="bg-white/80 dark:bg-indigo-950/50 rounded-3xl p-8 text-center border border-slate-200/60 dark:border-white/20 shadow-xl mb-6"
            >
              <p className="text-sm text-slate-500 dark:text-indigo-200/60 mb-4">
                What is the romaji?
              </p>
              <div
                className="text-8xl font-black text-slate-800 dark:text-white mb-4 select-none"
                style={{ fontFamily: "var(--font-japanese)" }}
              >
                {currentQuestion.char}
              </div>
              <button
                onClick={() => speakJapanese(currentQuestion.char)}
                className="p-2 rounded-xl bg-slate-100/80 dark:bg-white/10 text-slate-500 hover:text-primary transition"
              >
                <Volume1 className="w-5 h-5" />
              </button>
            </motion.div>
          </AnimatePresence>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrect = option === currentQuestion.romaji;
              const showCorrect = showResult && isCorrect;
              const showIncorrect = showResult && isSelected && !isCorrect;

              let btnStyle = "bg-white/80 dark:bg-indigo-950/50 border border-slate-200/60 dark:border-white/20 text-slate-700 dark:text-white";
              if (showCorrect) {
                btnStyle = "bg-green-500/30 border-2 border-green-500/50 text-green-600";
              } else if (showIncorrect) {
                btnStyle = "bg-red-500/30 border-2 border-red-500/50 text-red-600";
              } else if (showResult) {
                btnStyle = "bg-slate-100/30 text-slate-400 cursor-default";
              }

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={showResult}
                  className={cn(
                    "py-5 rounded-2xl font-bold text-center text-lg transition-all transform",
                    showCorrect && "scale-105",
                    btnStyle
                  )}
                >
                  {option}
                  {showCorrect && <CheckCircle2 className="w-6 h-6 inline ml-2" />}
                  {showIncorrect && <XCircle className="w-6 h-6 inline ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Pause Overlay */}
          {gameState === "paused" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <div className="bg-white dark:bg-indigo-950 rounded-3xl p-8 max-w-sm w-full mx-4 border border-white/20">
                <h2 className="text-2xl font-black text-slate-800 dark:text-white text-center mb-6">Paused</h2>
                <button
                  onClick={resumeGame}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition mb-3"
                >
                  <Play className="w-5 h-5" />
                  Resume
                </button>
                <button
                  onClick={() => {
                    setGameState("idle");
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-100/80 dark:bg-white/10 text-slate-700 dark:text-white font-bold hover:bg-slate-200 transition"
                >
                  Quit Game
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
